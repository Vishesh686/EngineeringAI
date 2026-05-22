import { motion } from "framer-motion";
import { ArrowUp, Paperclip, Sparkles, Wind, Calculator, BookOpen, Image as ImageIcon } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

const suggestions = [
  { icon: Wind, label: "Explain CFD divergence" },
  { icon: Calculator, label: "Solve beam deflection" },
  { icon: BookOpen, label: "Summarize this paper" },
  { icon: ImageIcon, label: "Analyze mesh screenshot" },
];

export function PromptHero() {
  const [value, setValue] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const submit = () => {
    const prompt = value.trim();
    if (prompt) {
      try { sessionStorage.setItem("engineering_ai_pending_prompt", prompt); } catch {}
    }
    navigate({ to: user ? "/app/chat" : "/signup" });
  };

  const google = async () => {
    setGoogleLoading(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app/chat" });
      if (res.error) toast.error("Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-20%] h-[640px] w-[1100px] -translate-x-1/2 rounded-full opacity-70 blur-3xl" style={{ background: "conic-gradient(from 180deg at 50% 50%, oklch(0.7 0.19 228 / 0.35), oklch(0.79 0.16 186 / 0.28), oklch(0.74 0.18 255 / 0.28), oklch(0.7 0.19 228 / 0.35))" }} />
        <div className="absolute inset-0 mesh-bg opacity-35" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="container mx-auto flex min-h-[88vh] max-w-4xl flex-col items-center justify-center px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="premium-surface inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-accent" />
          Introducing Engineering AI - Your BTech copilot
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Build smarter with
          <br />
          <span className="glow-text">Engineering AI</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Ask, solve, and study across all BTech branches with step-by-step explanations, technical formatting, and research-grade answers.
        </motion.p>

        <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18 }} onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-10 w-full max-w-2xl">
          <div className="premium-surface group relative rounded-3xl p-2 transition-all focus-within:border-primary/50 focus-within:shadow-glow">
            <div className="flex items-end gap-2 px-2">
              <button type="button" className="mb-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground" aria-label="Attach">
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
                rows={1}
                placeholder="Ask Engineering AI anything - for example: Explain boundary layer separation"
                className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-3 text-[15px] outline-none placeholder:text-muted-foreground"
              />
              <button type="submit" className="mb-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105 disabled:opacity-40" aria-label="Send">
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {suggestions.map((s) => (
              <button key={s.label} type="button" onClick={() => setValue(s.label)} className="premium-surface inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                <s.icon className="h-3.5 w-3.5 text-accent" />
                {s.label}
              </button>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">Free to start - No credit card required</p>
        </motion.form>

        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25 }}
            className="premium-surface mt-8 w-full max-w-2xl rounded-3xl p-4 sm:p-5"
          >
            <p className="mb-3 text-sm text-muted-foreground">Get started instantly</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/signup">Sign up</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="rounded-xl">
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl" onClick={google} disabled={googleLoading}>
                {googleLoading ? "Connecting..." : "Continue with Google"}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
