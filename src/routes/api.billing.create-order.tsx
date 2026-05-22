import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin, getUserFromBearer } from "@/lib/server/supabase-admin";
import { CREDIT_PACKS, type CreditPackCode } from "@/lib/pricing";

export const Route = createFileRoute("/api/billing/create-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await getUserFromBearer(request.headers.get("authorization"));
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) return new Response("Razorpay env missing", { status: 500 });

        const body = (await request.json()) as { pack?: CreditPackCode };
        const selectedPack = body.pack ?? "starter";
        const pack = CREDIT_PACKS[selectedPack];
        if (!pack) return new Response("Invalid pack", { status: 400 });

        const receipt = `credit_${auth.user.id.slice(0, 8)}_${Date.now()}`;
        const orderResp = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: pack.amountInr * 100,
            currency: "INR",
            receipt,
            notes: { user_id: auth.user.id, pack: selectedPack, credits: String(pack.credits) },
          }),
        });

        if (!orderResp.ok) return new Response(await orderResp.text(), { status: orderResp.status });
        const order = await orderResp.json();

        const supabase = getSupabaseAdmin();
        await supabase.from("notifications").insert({
          user_id: auth.user.id,
          kind: "billing",
          title: "Order created",
          body: `Razorpay order ${order.id} created for INR ${pack.amountInr}`,
        });

        return Response.json({
          orderId: order.id,
          keyId,
          amountInr: pack.amountInr,
          credits: pack.credits,
          currency: "INR",
          pack: selectedPack,
        });
      },
    },
  },
});
