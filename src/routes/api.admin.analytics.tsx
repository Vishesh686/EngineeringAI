import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin, getUserFromBearer } from "@/lib/server/supabase-admin";

export const Route = createFileRoute("/api/admin/analytics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await getUserFromBearer(request.headers.get("authorization"));
        if (!auth) return new Response("Unauthorized", { status: 401 });
        const supabase = getSupabaseAdmin();

        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", auth.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (!role) return new Response("Forbidden", { status: 403 });

        const [users, active, subscriptions, daily, credits] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("messages").select("user_id").gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString()),
          supabase.from("subscriptions").select("plan_code,status,amount_inr"),
          supabase.rpc("admin_daily_usage", { days_back: 30 }),
          supabase.from("credit_ledger").select("delta,created_at,reason").gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
        ]);

        const [mauRows, prevMauRows, branchRows] = await Promise.all([
          supabase.from("messages").select("user_id").gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
          supabase
            .from("messages")
            .select("user_id")
            .gte("created_at", new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString())
            .lt("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
          supabase.from("profiles").select("engineering_domain"),
        ]);

        const dau = new Set((active.data ?? []).map((r: any) => r.user_id)).size;
        const mauSet = new Set((mauRows.data ?? []).map((r: any) => r.user_id));
        const prevMauSet = new Set((prevMauRows.data ?? []).map((r: any) => r.user_id));
        const retainedUsers = [...prevMauSet].filter((id) => mauSet.has(id)).length;
        const retention30dPct = prevMauSet.size ? Math.round((retainedUsers / prevMauSet.size) * 100) : 0;
        const paying = (subscriptions.data ?? []).filter((s: any) => s.status === "active" && s.amount_inr > 0).length;
        const mrr = (subscriptions.data ?? []).filter((s: any) => s.status === "active").reduce((sum: number, s: any) => sum + (s.amount_inr ?? 0), 0);
        const revenue30d = (credits.data ?? []).reduce((sum: number, l: any) => sum + (l.delta > 0 ? l.delta : 0), 0);
        const creditsUsed30d = (credits.data ?? []).reduce((sum: number, l: any) => sum + (l.delta < 0 ? Math.abs(l.delta) : 0), 0);
        const freeCredits30d = (credits.data ?? [])
          .filter((l: any) => l.reason === "rewarded_video")
          .reduce((sum: number, l: any) => sum + (l.delta > 0 ? l.delta : 0), 0);
        const paidCredits30d = (credits.data ?? [])
          .filter((l: any) => l.reason === "credit_topup")
          .reduce((sum: number, l: any) => sum + (l.delta > 0 ? l.delta : 0), 0);

        const branchMap = new Map<string, number>();
        for (const row of branchRows.data ?? []) {
          const key = row.engineering_domain || "Unknown";
          branchMap.set(key, (branchMap.get(key) ?? 0) + 1);
        }
        const usersByBranch = [...branchMap.entries()]
          .map(([branch, count]) => ({ branch, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12);

        return Response.json({
          headline: {
            totalUsers: users.count ?? 0,
            dau,
            mau: mauSet.size,
            dauMauRatioPct: mauSet.size ? Math.round((dau / mauSet.size) * 100) : 0,
            retention30dPct,
            payingSubscribers: paying,
            mrrInr: mrr,
            revenue30dInr: revenue30d,
            creditsUsed30d,
            freeCredits30d,
            paidCredits30d,
          },
          daily: daily.data ?? [],
          usersByBranch,
        });
      },
    },
  },
});
