import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        throw redirect({ to: "/login" });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("engineering_domain")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (!profile?.engineering_domain && location.pathname !== "/app/onboarding") {
        throw redirect({ to: "/app/onboarding" });
      }

      return { session: data.session };
    } catch (error: any) {
      if (error?.status === 'REDIRECT_EXCEPTION') {
        throw error;
      }
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="premium-surface sticky top-0 z-30 flex h-12 items-center border-b border-border/40 px-3">
            <SidebarTrigger />
          </header>
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
