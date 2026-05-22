import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { notifyChatsChanged } from "@/lib/chat-events";
import { motion } from "framer-motion";
import { Send, Sparkles, MessageSquarePlus, Paperclip, Mic, Search, BookOpenCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getBranchSubjects } from "@/lib/engineering";

const CREDITS_PER_MESSAGE = 10;

type ChatSearch = { chatId?: string };

export const Route = createFileRoute("/app/chat")({
  validateSearch: (search: Record<string, unknown>): ChatSearch => ({
    chatId: typeof search.chatId === "string" ? search.chatId : undefined,
  }),
  component: ChatPage,
  head: () => ({ meta: [{ title: "Chat - Engineering AI" }] }),
});

const MODES = [
  { id: "general", label: "General Engineering" },
  { id: "aerospace", label: "Aerospace" },
  { id: "cfd", label: "CFD Expert" },
  { id: "fea", label: "FEA Expert" },
  { id: "thermo", label: "Thermodynamics" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "robotics", label: "Robotics" },
  { id: "matlab", label: "MATLAB Assistant" },
  { id: "research", label: "Research Copilot" },
  { id: "design", label: "Design Optimization" },
];

const SUGGESTIONS = [
  "Solve this thermodynamics numerically with steps",
  "Summarize and compare two research abstracts",
  "Debug this CFD setup and convergence strategy",
  "Generate an interview prep plan for ECE core",
];

type Msg = { role: "user" | "assistant"; content: string };

function ChatPage() {
  const navigate = useNavigate();
  const { chatId: routeChatId } = Route.useSearch();
  const [mode, setMode] = useState("general");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [branch, setBranch] = useState<string>("Mechanical Engineering");
  const [subject, setSubject] = useState<string>("General");
  const [balance, setBalance] = useState(0);
  const [claimingReward, setClaimingReward] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);

  const isEmpty = messages.length === 0;
  const subjects = useMemo(() => [...new Set(getBranchSubjects(branch))], [branch]);
  const subjectPicked = Boolean(subject && subject.trim());

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const refreshBalance = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const balanceResp = await fetch("/api/credits/balance", {
      headers: { Authorization: `Bearer ${sess.session?.access_token ?? ""}` },
    });
    if (balanceResp.ok) {
      const json = await balanceResp.json();
      setBalance(json.balance ?? 0);
    }
  };

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: profile }, { data: memory }] = await Promise.all([
        supabase.from("profiles").select("engineering_domain").eq("id", u.user.id).maybeSingle(),
        supabase.from("engineering_memory").select("value").eq("user_id", u.user.id).eq("key", "selected_subject").maybeSingle(),
      ]);
      if (profile?.engineering_domain) setBranch(profile.engineering_domain);
      if (memory?.value) setSubject(memory.value);
      await refreshBalance();
    })();
  }, []);

  useEffect(() => {
    if (!routeChatId) {
      setChatId(null);
      setMessages([]);
      return;
    }
    (async () => {
      const { data: chat, error: chatErr } = await supabase
        .from("chats")
        .select("id, title, mode")
        .eq("id", routeChatId)
        .maybeSingle();
      if (chatErr || !chat) {
        toast.error("Chat not found");
        navigate({ to: "/app/chat", search: {} });
        return;
      }
      setChatId(chat.id);
      setMode(chat.mode ?? "general");
      const { data: rows, error: msgErr } = await supabase
        .from("messages")
        .select("role, content")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: true });
      if (msgErr) {
        toast.error(msgErr.message);
        return;
      }
      setMessages(
        (rows ?? []).map((r) => ({
          role: r.role as "user" | "assistant",
          content: r.content,
        })),
      );
    })();
  }, [routeChatId, navigate]);

  const ensureChat = async (firstMessage: string): Promise<string | null> => {
    if (chatId) return chatId;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const title = firstMessage.slice(0, 60) || "New Chat";
    const { data, error } = await supabase
      .from("chats")
      .insert({ user_id: u.user.id, title, mode })
      .select("id")
      .single();
    if (error) {
      toast.error("Could not create chat");
      return null;
    }
    setChatId(data.id);
    navigate({ to: "/app/chat", search: { chatId: data.id }, replace: true });
    notifyChatsChanged();
    return data.id;
  };

  const saveMessage = async (cid: string, role: "user" | "assistant", content: string) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("messages").insert({ chat_id: cid, user_id: u.user.id, role, content });
  };

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    if (!subjectPicked) {
      toast.error("Choose a subject first so I can answer with the right context.");
      return;
    }

    const userMsg: Msg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    if (!override) setInput("");
    setLoading(true);
    let acc = "";

    const cid = await ensureChat(text);
    if (cid) await saveMessage(cid, "user", text);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg], mode, branch, subject }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Rate limit reached. Try again shortly.");
        else if (resp.status === 402) toast.error("AI credits exhausted. Watch a video or add credits in Billing.");
        else toast.error("Failed to reach AI.");
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let done = false;
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += dec.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }

          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }

      if (cid && acc) await saveMessage(cid, "assistant", acc);
      await refreshBalance();
      notifyChatsChanged();
    } catch (e: any) {
      toast.error(e.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  const watchAndClaimCredits = async () => {
    if (claimingReward) return;
    setClaimingReward(true);
    try {
      await new Promise((r) => setTimeout(r, 2200));
      const rewardToken = `reward_${Date.now()}`;
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch("/api/credits/reward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ rewardToken }),
      });
      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err || "Reward claim failed");
      }
      const json = await resp.json();
      setBalance(json.newBalance ?? balance);
      toast.success(`+${json.earned ?? 0} credits added`);
    } catch (e: any) {
      toast.error(e.message ?? "Could not claim credits");
    } finally {
      setClaimingReward(false);
    }
  };

  useEffect(() => {
    if (autoSentRef.current) return;
    let pending: string | null = null;
    try { pending = sessionStorage.getItem("engineering_ai_pending_prompt"); } catch {}
    if (pending && pending.trim()) {
      autoSentRef.current = true;
      try { sessionStorage.removeItem("engineering_ai_pending_prompt"); } catch {}
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) void send(pending!);
      });
    }
  }, []);

  const newChat = () => {
    setMessages([]);
    setChatId(null);
    setInput("");
    navigate({ to: "/app/chat", search: {} });
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col px-4 pb-4">
      <div className="premium-surface mt-4 flex items-center justify-between rounded-2xl px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODES.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Credits: {balance} ({CREDITS_PER_MESSAGE}/message)
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={watchAndClaimCredits}
            disabled={claimingReward}
            className="bg-gradient-to-r from-emerald-500/90 to-cyan-500/90 text-white hover:opacity-90"
          >
            {claimingReward ? "Watching..." : "Watch Video + Credits"}
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:inline-flex">
            <Search className="mr-2 h-4 w-4" /> Search chats
          </Button>
          <Button variant="ghost" size="sm" onClick={newChat}>
            <MessageSquarePlus className="mr-1 h-4 w-4" /> New chat
          </Button>
        </div>
      </div>

      {isEmpty ? (
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center py-10">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-3 shadow-glow">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="font-display text-4xl font-bold tracking-tight">Ask Engineering AI</h1>
              <p className="text-sm text-muted-foreground">Clear answers for every BTech branch.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="premium-surface mb-4 w-full rounded-3xl p-4"
          >
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpenCheck className="h-4 w-4 text-accent" />
              Choose subject context first ({branch})
            </div>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
              {subjects.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    subject === s
                      ? "border-primary bg-primary text-primary-foreground shadow-glow"
                      : "border-border/60 bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                  title={`Ask in ${s} context`}
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="premium-surface w-full rounded-3xl p-3">
            <div className="flex items-end gap-2 px-2">
              <button type="button" className="mb-2 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/40">
                <Paperclip className="h-4 w-4" />
              </button>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask anything - concepts, derivations, coding, numericals, interview prep..."
                rows={1}
                className="min-h-[54px] resize-none border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
              />
              <button type="button" className="mb-2 hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/40 md:flex">
                <Mic className="h-4 w-4" />
              </button>
              <Button size="icon" onClick={() => send()} disabled={loading || !input.trim()} className="mb-2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((item) => (
              <button key={item} onClick={() => setInput(item)} className="premium-surface rounded-2xl px-4 py-3 text-left text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto py-6">
            <div className="mx-auto max-w-4xl space-y-6">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={m.role === "user" ? "chat-bubble-user ml-auto max-w-[85%] rounded-2xl px-4 py-3 text-sm" : "chat-bubble-assistant max-w-[85%] rounded-2xl px-4 py-3 text-sm"}
                >
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {m.content || (loading ? "..." : "")}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-4xl">
            <div className="mb-2 flex flex-wrap gap-2">
              {subjects.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    subject === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                  title={`Switch to ${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="premium-surface rounded-2xl p-2">
              <div className="flex items-end gap-2 px-2">
                <button type="button" className="mb-2 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/40">
                  <Paperclip className="h-4 w-4" />
                </button>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Continue asking..."
                  rows={1}
                  className="min-h-[48px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                <Button size="icon" onClick={() => send()} disabled={loading || !input.trim()} className="mb-2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">Engineering AI may produce inaccuracies. Verify critical engineering results.</p>
          </div>
        </>
      )}
    </div>
  );
}
