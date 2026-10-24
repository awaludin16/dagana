import { SignOut } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function UserInfo() {
  const { memberships, user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  if (!isAuthenticated || !user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      toast.error("Sesi belum dapat ditutup. Periksa koneksi lalu coba lagi.");
    }
  };

  return (
    <div className="mt-auto p-3">
      <p className="mb-2 truncate px-3 text-xs font-medium text-muted-foreground">
        {user.name}
        {memberships.map((membership) => (
          <span
            key={membership.id}
            className="ml-1 text-xs text-muted-foreground"
          >
            ({membership.role_label})
          </span>
        ))}
      </p>
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start"
        onClick={() => void handleLogout()}
      >
        <SignOut className="size-5" aria-hidden="true" />
        Keluar
      </Button>
    </div>
  );
}
