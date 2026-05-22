import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon, Zap, Shield, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — Engineering AI" }] }),
});

function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [streaming, setStreaming] = useState(true);
  const [telemetry, setTelemetry] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
          <SettingsIcon className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Zap className="h-4 w-4" /> Chat</CardTitle>
            <CardDescription>Tune how Engineering AI responds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Stream responses token-by-token" checked={streaming} onChange={setStreaming} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4" /> Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Email me product updates" checked={notifications} onChange={setNotifications} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4" /> Privacy</CardTitle>
            <CardDescription>Your prompts are never used to train external models.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Share anonymous usage telemetry" checked={telemetry} onChange={setTelemetry} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

