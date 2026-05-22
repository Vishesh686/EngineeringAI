import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shield, Users, Activity, IndianRupee, CreditCard, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { currentUserIsAdmin } from "@/lib/admin";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { toast } from "sonner";

type Daily = { day: string; users: number; chats: number; messages: number; revenue_inr: number };
type BranchStat = { branch: string; count: number };
type BranchSubject = { id: string; branch: string; subject: string };
type KnowledgeRow = { id: string; branch_name: string; subject_name: string; content_type: string; title: string; content: string; source_url: string | null; created_at: string };

export const Route = createFileRoute("/app/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) throw redirect({ to: "/login" });
    const isAdmin = await currentUserIsAdmin();
    if (!isAdmin) throw redirect({ to: "/app/chat" });
  },
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin - Engineering AI" }] }),
});

function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [headline, setHeadline] = useState({
    totalUsers: 0,
    dau: 0,
    mau: 0,
    dauMauRatioPct: 0,
    retention30dPct: 0,
    payingSubscribers: 0,
    mrrInr: 0,
    revenue30dInr: 0,
    creditsUsed30d: 0,
    freeCredits30d: 0,
    paidCredits30d: 0,
  });
  const [daily, setDaily] = useState<Daily[]>([]);
  const [usersByBranch, setUsersByBranch] = useState<BranchStat[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [branchSubjects, setBranchSubjects] = useState<BranchSubject[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeRow[]>([]);
  const [subjectBranch, setSubjectBranch] = useState("Mechanical Engineering");
  const [newSubject, setNewSubject] = useState("");
  const [kbBranch, setKbBranch] = useState("Mechanical Engineering");
  const [kbSubject, setKbSubject] = useState("General");
  const [kbType, setKbType] = useState("syllabus");
  const [kbTitle, setKbTitle] = useState("");
  const [kbSource, setKbSource] = useState("");
  const [kbContent, setKbContent] = useState("");

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${sess.session?.access_token ?? ""}` },
      });
      if (resp.ok) {
        const json = await resp.json();
        setHeadline(json.headline);
        setDaily(json.daily);
        setUsersByBranch(json.usersByBranch ?? []);
      }
      const contentResp = await fetch("/api/admin/content", {
        headers: { Authorization: `Bearer ${sess.session?.access_token ?? ""}` },
      });
      if (contentResp.ok) {
        const json = await contentResp.json();
        setBranches(json.branches ?? []);
        setBranchSubjects(json.branchSubjects ?? []);
        setKnowledge(json.knowledge ?? []);
        if (json.branches?.length) {
          setSubjectBranch(json.branches[0]);
          setKbBranch(json.branches[0]);
        }
      }
      setLoading(false);
    })();
  }, []);

  const chartData = useMemo(
    () => daily.map((d) => ({ ...d, label: new Date(d.day).toLocaleDateString(undefined, { month: "short", day: "numeric" }) })),
    [daily],
  );

  const tiles = [
    { icon: Users, label: "Total users", value: headline.totalUsers },
    { icon: Activity, label: "DAU", value: headline.dau },
    { icon: Activity, label: "MAU", value: headline.mau },
    { icon: CreditCard, label: "Paying users", value: headline.payingSubscribers },
    { icon: IndianRupee, label: "MRR (INR)", value: headline.mrrInr },
    { icon: Coins, label: "Credits Used (30d)", value: headline.creditsUsed30d },
  ];

  const subjectsForKbBranch = useMemo(() => {
    const set = new Set(
      branchSubjects
        .filter((bs) => bs.branch === kbBranch)
        .map((bs) => bs.subject),
    );
    return ["General", ...Array.from(set)];
  }, [branchSubjects, kbBranch]);

  const addSubject = async () => {
    if (!newSubject.trim()) return;
    const { data: sess } = await supabase.auth.getSession();
    const resp = await fetch("/api/admin/content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ action: "add_subject", branch: subjectBranch, subject: newSubject }),
    });
    if (!resp.ok) {
      toast.error(await resp.text());
      return;
    }
    setBranchSubjects((s) => [...s, { id: `${subjectBranch}-${newSubject}`, branch: subjectBranch, subject: newSubject }]);
    setNewSubject("");
    toast.success("Subject added");
  };

  const addKnowledge = async () => {
    if (!kbTitle.trim() || !kbContent.trim()) return;
    const { data: sess } = await supabase.auth.getSession();
    const resp = await fetch("/api/admin/content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
      },
      body: JSON.stringify({
        action: "add_knowledge",
        branch: kbBranch,
        subject: kbSubject,
        contentType: kbType,
        title: kbTitle,
        content: kbContent,
        sourceUrl: kbSource,
      }),
    });
    if (!resp.ok) {
      toast.error(await resp.text());
      return;
    }
    toast.success("Knowledge saved for AI context");
    setKbTitle("");
    setKbSource("");
    setKbContent("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold">Admin Analytics</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold">{Number(t.value).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>User and Message Growth</CardTitle></CardHeader>
          <CardContent className="h-72">
            {loading ? "Loading..." : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="messages" stroke="hsl(var(--accent))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue and Chats (30d)</CardTitle></CardHeader>
          <CardContent className="h-72">
            {loading ? "Loading..." : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue_inr" fill="hsl(var(--primary))" />
                  <Bar dataKey="chats" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Credit Mix (30d)</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Credits used by AI asks</span><span className="font-semibold">{headline.creditsUsed30d.toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Free credits via rewarded videos</span><span className="font-semibold">{headline.freeCredits30d.toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Paid credits purchased</span><span className="font-semibold">{headline.paidCredits30d.toLocaleString()}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Engagement Health</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">DAU / MAU</span><span className="font-semibold">{headline.dauMauRatioPct}%</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">30d retention (active users)</span><span className="font-semibold">{headline.retention30dPct}%</span></div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Users by Branch</CardTitle></CardHeader>
        <CardContent className="h-80">
          {loading ? "Loading..." : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usersByBranch}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" interval={0} angle={-18} textAnchor="end" height={90} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="py-4 text-sm text-muted-foreground">
          Revenue (30 days): <span className="font-semibold text-foreground">INR {headline.revenue30dInr.toLocaleString()}</span>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Add Subjects to BTech Courses</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={subjectBranch} onValueChange={setSubjectBranch}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{branches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="New subject name" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
            <Button onClick={addSubject}>Add Subject</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Add Books / Syllabus / Details for AI</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={kbBranch} onValueChange={setKbBranch}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{branches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={kbSubject} onValueChange={setKbSubject}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{subjectsForKbBranch.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={kbType} onValueChange={setKbType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="syllabus">Syllabus</SelectItem>
                <SelectItem value="book">Book</SelectItem>
                <SelectItem value="details">Details</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Title (ex: Fluid Mechanics Unit-1)" value={kbTitle} onChange={(e) => setKbTitle(e.target.value)} />
            <Input placeholder="Source URL (optional)" value={kbSource} onChange={(e) => setKbSource(e.target.value)} />
            <Textarea placeholder="Paste syllabus/book summary/details..." rows={5} value={kbContent} onChange={(e) => setKbContent(e.target.value)} />
            <Button onClick={addKnowledge}>Save to AI Knowledge</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Recent Knowledge Entries</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {knowledge.slice(0, 12).map((k) => (
              <div key={k.id} className="rounded-xl border border-border/60 p-3 text-sm">
                <div className="font-medium">{k.title}</div>
                <div className="text-xs text-muted-foreground">{k.branch_name} · {k.subject_name} · {k.content_type}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

