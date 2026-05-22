import crypto from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin, getUserFromBearer } from "@/lib/server/supabase-admin";
import { CREDIT_PACKS, type CreditPackCode } from "@/lib/pricing";

export const Route = createFileRoute("/api/billing/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await getUserFromBearer(request.headers.get("authorization"));
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) return new Response("Razorpay env missing", { status: 500 });

        const body = (await request.json()) as {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
          pack: CreditPackCode;
        };

        const payload = `${body.razorpay_order_id}|${body.razorpay_payment_id}`;
        const expected = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");
        if (expected !== body.razorpay_signature) return new Response("Invalid signature", { status: 400 });

        const pack = CREDIT_PACKS[body.pack];
        if (!pack) return new Response("Invalid pack", { status: 400 });

        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.rpc("add_credits", {
          target_user_id: auth.user.id,
          amount: pack.credits,
          reason: "credit_topup",
          meta: {
            razorpay_order_id: body.razorpay_order_id,
            razorpay_payment_id: body.razorpay_payment_id,
            pack: body.pack,
          },
        });

        if (error) return new Response(error.message, { status: 500 });

        await supabase.from("notifications").insert({
          user_id: auth.user.id,
          kind: "billing",
          title: "Credits added",
          body: `${pack.credits} credits added successfully.`,
        });

        return Response.json({ ok: true, newBalance: data });
      },
    },
  },
});
