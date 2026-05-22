import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin, getUserFromBearer } from "@/lib/server/supabase-admin";

export const Route = createFileRoute("/api/credits/balance")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await getUserFromBearer(request.headers.get("authorization"));
        if (!auth) return new Response("Unauthorized", { status: 401 });
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
          .from("credit_wallets")
          .select("balance,daily_free_credits,last_daily_grant_at")
          .eq("user_id", auth.user.id)
          .maybeSingle();

        if (error) return new Response(error.message, { status: 500 });
        return Response.json(data ?? { balance: 0, daily_free_credits: 20, last_daily_grant_at: null });
      },
    },
  },
});
