import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import Logo from "@/components/Logo";

export default function AdminLogin() {
  const { signIn, user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (user && isAdmin) return <Navigate to="/admin" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(username.trim(), password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Welcome back, Admin.");
      navigate("/admin");
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "var(--gradient-hero)" }}
        aria-hidden
      />
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" aria-hidden />

      <div className="relative container py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] animate-fade-up">
          <div className="text-center mb-10">
            <Logo className="h-14 w-14 mx-auto mb-5" />
            <h1 className="font-display text-3xl font-bold tracking-tight">Admin Console</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in to access the screening dashboard.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="surface-elevated rounded-2xl p-7 space-y-5 noise"
          >
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin"
                autoComplete="username"
                required
                className="h-11 bg-background/60 border-border/80 focus-visible:border-primary focus-visible:ring-primary/20 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="h-11 bg-background/60 border-border/80 focus-visible:border-primary focus-visible:ring-primary/20 font-mono"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full btn-orange h-11 rounded-xl font-semibold"
              size="lg"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>

            <div className="pt-2 border-t border-border/50">
              <p className="text-[11px] text-muted-foreground text-center font-mono tracking-wider">
                AUTHORIZED PERSONNEL ONLY
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
