import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, IndianRupee } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CREDIT_PACK_LIST, type CreditPackCode } from "@/lib/pricing";

export const Route = createFileRoute("/app/billing")({
  component: BillingPage,
  head: () => ({ meta: [{ title: "Billing - Engineering AI" }] }),
});

function BillingPage() {
  const [balance, setBalance] = useState(0);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  useEffect(() => {
    if (!(window as any).Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch("/api/credits/balance", {
        headers: { Authorization: `Bearer ${sess.session?.access_token ?? ""}` },
      });
      if (resp.ok) {
        const json = await resp.json();
        setBalance(json.balance ?? 0);
      }
    })();
  }, []);

  const buyCredits = async (pack: CreditPackCode) => {
    setLoadingPack(pack);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const createResp = await fetch("/api/billing/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ pack }),
      });
      if (!createResp.ok) throw new Error(await createResp.text());
      const order = await createResp.json();

      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amountInr * 100,
        currency: order.currency,
        name: "Engineering AI",
        description: `${order.credits} credits`,
        order_id: order.orderId,
        handler: async (response: any) => {
          const verifyResp = await fetch("/api/billing/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
            },
            body: JSON.stringify({ ...response, pack }),
          });
          if (!verifyResp.ok) throw new Error(await verifyResp.text());
          const verified = await verifyResp.json();
          setBalance(verified.newBalance ?? balance);
          toast.success("Credits added successfully");
        },
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e.message ?? "Checkout failed");
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
          <CreditCard className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold">Billing</h1>
      </div>
      <Card className="mb-4">
        <CardContent className="py-4 text-sm">
          Available credits: <span className="font-semibold">{balance}</span>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {CREDIT_PACK_LIST.map((p) => (
          <Card key={p.name}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-lg text-foreground"><IndianRupee className="h-4 w-4" />{p.amountInr}</CardDescription>
              <p className="text-sm text-muted-foreground">{p.credits} credits • {p.tag}</p>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => buyCredits(p.code)} disabled={loadingPack === p.code}>
                {loadingPack === p.code ? "Processing..." : "Buy Credits"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

