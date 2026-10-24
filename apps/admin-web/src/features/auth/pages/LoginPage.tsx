import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { DaganaLogo } from "@/components/layout/DaganaLogo";

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/";
  const invitationToken = new URLSearchParams(location.search).get(
    "inviteToken",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      toast.success("Berhasil masuk");
      navigate(
        invitationToken
          ? `/accept-invitation?token=${encodeURIComponent(invitationToken)}`
          : from,
        { replace: true },
      );
    } catch {
      setError("Email atau kata sandi tidak valid.");
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-6">
        <div className="space-y-3">
          <DaganaLogo />
          <h1 className="app-page-title">Masuk ke Dagana</h1>
          <p className="text-sm text-muted-foreground">
            Kelola menu, tim, dan transaksi bisnis Anda.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Memproses…" : "Masuk"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link
            to={
              invitationToken
                ? `/register?inviteToken=${encodeURIComponent(invitationToken)}`
                : "/register"
            }
            className="underline underline-offset-4"
          >
            Daftar
          </Link>
        </p>
      </div>
    </main>
  );
}
