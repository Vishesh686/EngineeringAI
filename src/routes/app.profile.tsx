import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — Engineering AI" }] }),
});

function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    organization: "",
    engineering_domain: "",
    preferred_units: "SI",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setForm({
          display_name: data.display_name ?? "",
          bio: data.bio ?? "",
          organization: data.organization ?? "",
          engineering_domain: data.engineering_domain ?? "",
          preferred_units: data.preferred_units ?? "SI",
        });
      }
    });
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
          <UserIcon className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold">Profile</h1>
      </div>
      <Card>
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
            <div className="space-y-1">
              <Label>Display name</Label>
              <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Organization</Label>
              <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="University / Company" />
            </div>
            <div className="space-y-1">
              <Label>Engineering domain</Label>
              <Input value={form.engineering_domain} onChange={(e) => setForm({ ...form, engineering_domain: e.target.value })} placeholder="Aerospace, CFD, Robotics…" />
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

