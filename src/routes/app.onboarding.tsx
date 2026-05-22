import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, GraduationCap, Rocket, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ENGINEERING_BRANCHES, getBranchSubjects } from "@/lib/engineering";
import { toast } from "sonner";

export const Route = createFileRoute("/app/onboarding")({
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Onboarding - Engineering AI" }] }),
});

const gradients = [
  "from-sky-500/25 to-cyan-400/10",
  "from-indigo-500/25 to-blue-400/10",
  "from-emerald-500/25 to-teal-400/10",
  "from-fuchsia-500/25 to-pink-400/10",
  "from-orange-500/25 to-amber-400/10",
  "from-violet-500/25 to-indigo-400/10",
];

function OnboardingPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [branch, setBranch] = useState<string>("Computer Science and Engineering (General)");
  const [subject, setSubject] = useState<string>("General");
  const [saving, setSaving] = useState(false);

  const subjects = useMemo(() => getBranchSubjects(branch), [branch]);

  const save = async () => {
    if (!user) return;
    setSaving(true);

    const profileUpdate = supabase
      .from("profiles")
      .update({ engineering_domain: branch, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    const memoryUpsert = supabase
      .from("engineering_memory")
      .upsert({ user_id: user.id, key: "selected_subject", value: subject }, { onConflict: "user_id,key" });

    const [{ error: profileError }, { error: memoryError }] = await Promise.all([profileUpdate, memoryUpsert]);

    setSaving(false);
    if (profileError || memoryError) {
      toast.error(profileError?.message ?? memoryError?.message ?? "Failed to save onboarding");
      return;
    }

    toast.success("Onboarding completed");
    window.location.href = "/app/chat";
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center px-4 py-8">
      <Card className="premium-surface w-full overflow-hidden rounded-3xl border-border/40">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              Engineering AI Onboarding
            </div>
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`h-2.5 w-10 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
          </div>

          <div className="relative min-h-[620px] p-6 md:p-8">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35 }}
                  className="mx-auto flex max-w-3xl flex-col items-center text-center"
                >
                  <div className="mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent p-4 shadow-glow">
                    <GraduationCap className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h1 className="font-display text-4xl font-bold tracking-tight">Welcome to Engineering AI</h1>
                  <p className="mt-3 max-w-2xl text-muted-foreground">
                    Your AI operating system for all BTech branches. Get personalized help for classes, assignments, projects, coding, and research.
                  </p>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="features"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35 }}
                  className="mx-auto max-w-5xl"
                >
                  <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 w-fit rounded-2xl bg-gradient-to-br from-primary to-accent p-4 shadow-glow">
                      <Rocket className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h2 className="font-display text-3xl font-bold">What you can do</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      "Subject-aware AI responses",
                      "Engineering calculators",
                      "PDF and screenshot analysis",
                      "Research copilot",
                      "Course memory by branch",
                      "Step-by-step problem solving",
                    ].map((item, idx) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="rounded-2xl border border-border/50 bg-card/70 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" />
                          <span className="text-sm">{item}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="branch"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="mb-6 text-center">
                    <h2 className="font-display text-3xl font-bold">Choose your BTech course</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Pick your branch to personalize AI routing, recommendations, and subject context.</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {ENGINEERING_BRANCHES.map((item, idx) => {
                      const active = item === branch;
                      return (
                        <motion.button
                          key={item}
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.015 }}
                          onClick={() => setBranch(item)}
                          type="button"
                          className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${active ? "border-primary shadow-glow" : "border-border/60 hover:border-primary/50"}`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${gradients[idx % gradients.length]} ${active ? "opacity-100" : "opacity-60"}`} />
                          <div className="relative">
                            <div className="mb-1 text-xs text-muted-foreground">BTech Branch</div>
                            <div className="text-sm font-medium leading-snug">{item}</div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="mt-6 rounded-2xl border border-border/50 bg-card/70 p-4">
                    <p className="mb-3 text-sm text-muted-foreground">Optional: choose default subject</p>
                    <div className="flex flex-wrap gap-2">
                      {["General", ...subjects].map((s) => (
                        <Badge
                          key={s}
                          className={`cursor-pointer rounded-full px-3 py-1 ${subject === s ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                          onClick={() => setSubject(s)}
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between border-t border-border/40 px-6 py-4">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {step < 2 ? (
              <Button onClick={() => setStep((s) => Math.min(2, s + 1))} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={saving} onClick={save} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                {saving ? "Saving..." : "Continue to Workspace"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
