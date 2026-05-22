import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Search, FileText, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/research")({
  component: ResearchPage,
  head: () => ({ meta: [{ title: "Research Copilot - Engineering AI" }] }),
});

type Match = { content: string; similarity: number; document_id: string };

function ResearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const { data: sess } = await supabase.auth.getSession();
    const resp = await fetch("/api/rag/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ query, topK: 5 }),
    });
    if (resp.ok) {
      const json = await resp.json();
      setMatches(json.matches ?? []);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Research Copilot</h1>
          <p className="text-sm text-muted-foreground">Semantic search over your indexed PDFs and notes.</p>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="flex gap-2 py-4">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask from your uploaded papers..." />
          <Button onClick={runSearch} disabled={loading}>{loading ? "Searching..." : "Search"}</Button>
        </CardContent>
      </Card>

      {matches.length > 0 && (
        <Card className="mb-4">
          <CardHeader><CardTitle>Top Matches</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {matches.map((m, idx) => (
              <div key={idx} className="rounded-lg border border-border/60 p-3 text-sm">
                <div className="mb-1 text-xs text-muted-foreground">Similarity: {(m.similarity * 100).toFixed(1)}%</div>
                <p className="line-clamp-5 whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Search, title: "Literature search", desc: "Find and compare key paragraphs from your own indexed library." },
          { icon: FileText, title: "Paper summaries", desc: "Upload in Files, index with AI, then query sections instantly." },
          { icon: Sparkles, title: "Hypothesis generation", desc: "Use retrieved context in chat to draft ideas and methodology." },
        ].map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <f.icon className="h-6 w-6 text-primary" />
              <CardTitle className="text-base">{f.title}</CardTitle>
              <CardDescription>{f.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Sparkles className="h-8 w-8 text-primary" />
          <h2 className="font-display text-xl font-semibold">Continue in chat</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Open Chat in Research Copilot mode to combine semantic matches with reasoning and paper drafting.
          </p>
          <Button asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
            <Link to="/app/chat">Open Research Chat</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

