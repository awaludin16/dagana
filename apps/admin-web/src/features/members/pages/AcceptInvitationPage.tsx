import { useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, refetch, logout } = useAuth();
  const token = searchParams.get("token") ?? "";
  const started = useRef(false);

  const acceptMutation = useMutation({
    mutationFn: (invitationToken: string) =>
      api.post("/invitations/accept", { token: invitationToken }),
    onSuccess: async () => {
      await refetch();
      toast.success("Undangan diterima. Anda kini dapat mengakses bisnis.");
      navigate("/", { replace: true });
    },
  });

  useEffect(() => {
    if (isAuthenticated && token && !started.current) {
      started.current = true;
      acceptMutation.mutate(token);
    }
  }, [acceptMutation, isAuthenticated, token]);

  const serverError = isAxiosError<{ errors?: Record<string, string[]> }>(
    acceptMutation.error,
  )
    ? Object.values(acceptMutation.error.response?.data?.errors ?? {}).flat()[0]
    : undefined;
  const errorMessage = acceptMutation.error
    ? serverError?.toLowerCase().includes("email address")
      ? "Masuk menggunakan alamat email yang menerima undangan."
      : "Undangan tidak valid, sudah kedaluwarsa, atau telah digunakan. Periksa tautan dan coba lagi."
    : null;
  const authPathToken = encodeURIComponent(token);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg items-center px-4 py-8">
      <section className="w-full space-y-5 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Undangan Dagana</p>
          <h1 className="text-xl font-semibold">Bergabung ke bisnis</h1>
          <p className="text-sm text-muted-foreground">
            Buat akun menggunakan alamat email yang menerima undangan.
          </p>
        </div>
        {!token ? (
          <p className="text-sm text-destructive" role="alert">
            Tautan undangan tidak memiliki token.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground" role="status">
            Memeriksa sesi…
          </p>
        ) : !isAuthenticated ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* <Button asChild>
              <Link to={`/login?inviteToken=${authPathToken}`}>
                Masuk untuk menerima
              </Link>
            </Button> */}
            <Button asChild>
              <Link to={`/register?inviteToken=${authPathToken}`}>
                Buat akun baru
              </Link>
            </Button>
          </div>
        ) : acceptMutation.isPending ? (
          <p className="text-sm text-muted-foreground" role="status">
            Menerima undangan…
          </p>
        ) : errorMessage ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  started.current = true;
                  acceptMutation.mutate(token);
                }}
              >
                Coba lagi
              </Button>
              {errorMessage.toLowerCase().includes("email") && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await logout();
                      navigate(`/login?inviteToken=${authPathToken}`, {
                        replace: true,
                      });
                    } catch {
                      toast.error(
                        "Belum dapat keluar dari akun. Periksa koneksi lalu coba lagi.",
                      );
                    }
                  }}
                >
                  Keluar dan ganti akun
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
