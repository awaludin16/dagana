import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { isAxiosError } from "axios";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import type { AuthUser, MeResponse, Membership } from "@/types/auth.types";

export interface AuthState {
  user: AuthUser | null;
  memberships: Membership[];
  activeMembership: Membership | null;
  setActiveMembership: (membershipId: string | number) => void;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeMembershipId, setActiveMembershipId] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadStarted = useRef(false);

  const loadMe = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<MeResponse>("/me");
      const data = res.data.data;
      setUser({ id: data.id, name: data.name, email: data.email });
      const nextMemberships = data.memberships || [];
      setMemberships(nextMemberships);
      setActiveMembershipId((currentId) => {
        const activeMemberships = nextMemberships.filter(
          (membership) => membership.status === "active",
        );
        const nextId =
          activeMemberships.find(
            (membership) => String(membership.id) === String(currentId),
          )?.id ?? activeMemberships[0]?.id ?? null;
        return nextId;
      });
      setError(null);
    } catch (loadError) {
      if (isAxiosError(loadError) && loadError.response?.status === 401) {
        setUser(null);
        setMemberships([]);
        setActiveMembershipId(null);
        setError(null);
        return;
      }
      setError("Sesi tidak dapat dimuat. Periksa koneksi lalu coba lagi.");
      throw loadError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    void loadMe().catch(() => undefined);
  }, [loadMe]);

  const activeMembership = useMemo(() => {
    return (
      memberships.find(
        (membership) =>
          membership.status === "active" &&
          String(membership.id) === String(activeMembershipId),
      ) ??
      memberships.find((membership) => membership.status === "active") ??
      null
    );
  }, [memberships, activeMembershipId]);

  const setActiveMembership = useCallback(
    (membershipId: string | number) => {
      if (
        memberships.some(
          (membership) =>
            membership.status === "active" &&
            String(membership.id) === String(membershipId),
        )
      ) {
        setActiveMembershipId(membershipId);
      }
    },
    [memberships],
  );

  const permissions = useMemo(() => {
    return (
      activeMembership?.permissions ||
      activeMembership?.preset_permissions ||
      []
    );
  }, [activeMembership]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      await api.post("/auth/login", { email, password });
      await loadMe();
    },
    [loadMe],
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      password_confirmation: string,
    ) => {
      setError(null);
      await api.post("/auth/register", {
        name,
        email,
        password,
        password_confirmation,
      });
      await loadMe();
    },
    [loadMe],
  );

  const logout = useCallback(async () => {
    setError(null);
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      setMemberships([]);
      setActiveMembershipId(null);
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      memberships,
      activeMembership,
      setActiveMembership,
      permissions,
      isAuthenticated: !!user,
      isLoading,
      error,
      refetch: loadMe,
      login,
      register,
      logout,
    }),
    [
      user,
      memberships,
      activeMembership,
      setActiveMembership,
      permissions,
      isLoading,
      error,
      loadMe,
      login,
      register,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
