import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { MeshBackground } from "@/components/MeshBackground";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — Engineering AI" }] }),
});

function LoginPage() {
  return <AuthForm mode="login" />;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = "/app/chat";
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/app/chat" },
        });
        if (error) throw error;
        toast.success("Check your email to verify your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/app/chat";
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app/chat` },
    });
    if (error) toast.error(error.message ?? "Google sign-in failed");
  };
  const github = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/app/chat` },
    });
    if (error) toast.error(error.message ?? "GitHub sign-in failed");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <MeshBackground />
      <div className="glass relative w-full max-w-md rounded-2xl p-8 shadow-elevated">
        <div className="mb-6 flex justify-center"><Logo size="lg" /></div>
        <h1 className="text-center font-display text-2xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Sign in to your engineering workspace" : "Start engineering with AI in 30 seconds"}
        </p>

        <Button onClick={google} variant="outline" className="mt-6 w-full" type="button">
          Continue with Google
        </Button>
        <Button onClick={github} variant="outline" className="mt-2 w-full" type="button">
          Continue with GitHub
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground">
            {loading ? "..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>No account? <Link to="/signup" className="text-accent hover:underline">Sign up</Link></>
          ) : (
            <>Have an account? <Link to="/login" className="text-accent hover:underline">Sign in</Link></>
          )}
        </p>
      </div>
    </div>
  );
}

