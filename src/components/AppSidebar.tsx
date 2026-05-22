import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  MessageSquare,
  Calculator,
  FolderOpen,
  BookOpen,
  Cpu,
  User,
  Settings,
  Shield,
  CreditCard,
  LogOut,
  Sparkles,
  MessageSquarePlus,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { CHATS_CHANGED_EVENT, notifyChatsChanged } from "@/lib/chat-events";
import { currentUserIsAdmin } from "@/lib/admin";
import { toast } from "sonner";
import { AdSlot } from "@/components/AdSlot";

const workspaceItems = [
  { title: "Calculators", url: "/app/calculators", icon: Calculator },
  { title: "Files", url: "/app/files", icon: FolderOpen },
  { title: "Research", url: "/app/research", icon: BookOpen },
  { title: "Simulation", url: "/app/simulation", icon: Cpu },
];

type ChatRow = { id: string; title: string; updated_at: string };

export function AppSidebar() {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const search = useRouterState({ select: (r) => r.location.search as { chatId?: string } });
  const activeChatId = search.chatId;
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  const loadChats = useCallback(async () => {
    if (!user) {
      setChats([]);
      setLoadingChats(false);
      return;
    }
    setLoadingChats(true);
    const { data, error } = await supabase
      .from("chats")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(40);
    if (!error) setChats(data ?? []);
    setLoadingChats(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    currentUserIsAdmin().then(setIsAdmin);
  }, [user]);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  useEffect(() => {
    const handler = () => void loadChats();
    window.addEventListener(CHATS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(CHATS_CHANGED_EVENT, handler);
  }, [loadChats]);

  const isActive = (url: string) => path === url || path.startsWith(url + "/");

  const openChat = (id: string) => {
    navigate({ to: "/app/chat", search: { chatId: id } });
  };

  const newChat = () => {
    navigate({ to: "/app/chat", search: {} });
  };

  const renameChat = async (chat: ChatRow) => {
    const next = window.prompt("Chat name", chat.title);
    if (!next?.trim() || next === chat.title) return;
    const { error } = await supabase.from("chats").update({ title: next.trim() }).eq("id", chat.id);
    if (error) toast.error(error.message);
    else {
      notifyChatsChanged();
      toast.success("Chat renamed");
    }
  };

  const deleteChat = async (chat: ChatRow) => {
    if (!window.confirm(`Delete "${chat.title}"?`)) return;
    const { error } = await supabase.from("chats").delete().eq("id", chat.id);
    if (error) toast.error(error.message);
    else {
      notifyChatsChanged();
      if (activeChatId === chat.id) newChat();
      toast.success("Chat deleted");
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-sidebar">
      <SidebarHeader className="border-b border-border/40 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Engineering AI">
              <Link to="/app/chat" className="flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow">
                  <Sparkles className="size-4 text-primary-foreground" />
                </div>
                <span className="truncate font-display font-semibold">Engineering AI</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="New chat" onClick={newChat} isActive={path === "/app/chat" && !activeChatId}>
              <MessageSquarePlus className="size-4 shrink-0" />
              <span>New chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="min-h-0 flex-1 py-0">
          <SidebarGroupLabel>Recent chats</SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0">
            {collapsed ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Open chats"
                    isActive={path === "/app/chat"}
                    onClick={() => navigate({ to: "/app/chat" })}
                  >
                    <MessageSquare className="size-4 shrink-0" />
                    <span>Chats</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : (
              <ScrollArea className="h-[min(280px,35vh)] px-1">
                <SidebarMenu>
                  {loadingChats && (
                    <p className="px-2 py-2 text-xs text-muted-foreground">Loading…</p>
                  )}
                  {!loadingChats && chats.length === 0 && (
                    <p className="px-2 py-2 text-xs text-muted-foreground">No chats yet. Start a new chat.</p>
                  )}
                  {chats.map((chat) => (
                    <SidebarMenuItem key={chat.id} className="group/chat">
                      <SidebarMenuButton
                        isActive={activeChatId === chat.id}
                        onClick={() => openChat(chat.id)}
                        className="pr-14"
                      >
                        <MessageSquare className="size-4 shrink-0" />
                        <span className="truncate">{chat.title}</span>
                      </SidebarMenuButton>
                      <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition group-hover/chat:opacity-100">
                        <button
                          type="button"
                          className="rounded p-1 hover:bg-sidebar-accent"
                          onClick={(e) => {
                            e.stopPropagation();
                            void renameChat(chat);
                          }}
                          aria-label="Rename chat"
                        >
                          <Pencil className="size-3" />
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 hover:bg-destructive/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            void deleteChat(chat);
                          }}
                          aria-label="Delete chat"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </ScrollArea>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup className="px-2">
            <AdSlot className="mx-0" />
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                { title: "Profile", url: "/app/profile", icon: User },
                { title: "Settings", url: "/app/settings", icon: Settings },
                { title: "Billing", url: "/app/billing", icon: CreditCard },
              ].map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/app/admin")} tooltip="Admin">
                    <Link to="/app/admin">
                      <Shield className="size-4 shrink-0" />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
            >
              <LogOut className="size-4 shrink-0" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
