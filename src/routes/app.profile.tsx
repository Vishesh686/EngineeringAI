import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ENGINEERING_BRANCHES } from "@/lib/engineering";
import { toast } from "sonner";
import { User as UserIcon, Coins, Crown } from "lucide-react";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — Engineering AI" }] }),
});

function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [planCode, setPlanCode] = useState("free");
  const [credits, setCredits] = useState(0);
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    organization: "",
    engineering_domain: ENGINEERING_BRANCHES[0],
    preferred_units: "SI",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profile }, { data: sub }, { data: wallet }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("subscriptions").select("plan_code, status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("credit_wallets").select("balance").eq("user_id", user.id).maybeSingle(),
      ]);
      if (profile) {
        setForm({
          display_name: profile.display_name ?? "",
          bio: profile.bio ?? "",
          organization: profile.organization ?? "",
          engineering_domain: profile.engineering_domain ?? ENGINEERING_BRANCHES[0],
          preferred_units: profile.preferred_units ?? "SI",
        });
      }
      setPlanCode(sub?.plan_code ?? "free");
      setCredits(wallet?.balance ?? 0);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const planLabel = planCode === "free" ? "Free Plan" : planCode.charAt(0).toUpperCase() + planCode.slice(1);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
          <UserIcon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your branch, plan, and credits</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card className="premium-surface border-border/40">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/15 p-3">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current plan</p>
              <p className="font-display text-xl font-semibold">{planLabel}</p>
              <Badge variant="secondary" className="mt-1 capitalize">
                {planCode}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="premium-surface border-border/40">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-accent/15 p-3">
              <Coins className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">AI credits</p>
              <p className="font-display text-xl font-semibold">{credits}</p>
              <p className="text-xs text-muted-foreground">10 credits per chat message</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="premium-surface border-border/40">
        <CardHeader>
          <CardTitle>Engineer profile</CardTitle>
          <CardDescription>Personalize how Engineering AI assists you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Account ID (for admin setup in Supabase)</Label>
              <Input value={user?.id ?? ""} disabled className="font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <Label>Display name</Label>
              <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Organization</Label>
              <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="University / Company" />
            </div>
            <div className="space-y-1">
              <Label>BTech branch / stream</Label>
              <Select
                value={form.engineering_domain}
                onValueChange={(v) => setForm({ ...form, engineering_domain: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your branch" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {ENGINEERING_BRANCHES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Preferred units</Label>
              <Select value={form.preferred_units} onValueChange={(v) => setForm({ ...form, preferred_units: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SI">SI (metric)</SelectItem>
                  <SelectItem value="Imperial">Imperial (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Bio</Label>
              <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell Engineering AI a bit about your work" />
            </div>
          </div>
          <Button onClick={save} disabled={loading} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
