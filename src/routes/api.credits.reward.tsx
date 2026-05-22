import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin, getUserFromBearer } from "@/lib/server/supabase-admin";

const REWARD_CREDITS = Number(process.env.REWARDED_AD_CREDITS ?? 100);
const MAX_DAILY_REWARDS = Number(process.env.REWARDED_AD_MAX_DAILY ?? 10);
const MIN_SECONDS_BETWEEN_REWARDS = Number(process.env.REWARDED_AD_COOLDOWN_SECONDS ?? 45);

export const Route = createFileRoute("/api/credits/reward")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await getUserFromBearer(request.headers.get("authorization"));
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json().catch(() => ({}))) as { rewardToken?: string };
        if (!body.rewardToken || body.rewardToken.trim().length < 6) {
          return new Response("Missing reward token", { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { data: wallet, error } = await supabase
          .from("credit_wallets")
          .select("last_reward_grant_at,reward_claims_today")
          .eq("user_id", auth.user.id)
          .maybeSingle();
        if (error) return new Response(error.message, { status: 500 });

        const now = new Date();
        const last = wallet?.last_reward_grant_at ? new Date(wallet.last_reward_grant_at) : null;
        const sameDay = last ? last.toDateString() === now.toDateString() : false;
        const claimsToday = sameDay ? wallet?.reward_claims_today ?? 0 : 0;

        if (claimsToday >= MAX_DAILY_REWARDS) {
          return new Response("Daily rewarded-credit limit reached", { status: 429 });
        }
        if (last) {
          const elapsed = Math.floor((now.getTime() - last.getTime()) / 1000);
          if (elapsed < MIN_SECONDS_BETWEEN_REWARDS) {
            return new Response(`Please wait ${MIN_SECONDS_BETWEEN_REWARDS - elapsed}s`, { status: 429 });
          }
        }

        const { error: walletUpsertError } = await supabase.from("credit_wallets").upsert({
          user_id: auth.user.id,
          last_reward_grant_at: now.toISOString(),
          reward_claims_today: claimsToday + 1,
          updated_at: now.toISOString(),
        });
        if (walletUpsertError) return new Response(walletUpsertError.message, { status: 500 });

        const { data: newBalance, error: creditErr } = await supabase.rpc("add_credits", {
          target_user_id: auth.user.id,
          amount: REWARD_CREDITS,
          reason: "rewarded_video",
          meta: { reward_token: body.rewardToken },
        });
        if (creditErr) return new Response(creditErr.message, { status: 500 });

        return Response.json({
          ok: true,
          earned: REWARD_CREDITS,
          newBalance,
          claimsLeftToday: Math.max(0, MAX_DAILY_REWARDS - (claimsToday + 1)),
        });
      },
    },
  },
});
