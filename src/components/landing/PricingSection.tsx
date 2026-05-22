import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { CREDIT_PACK_LIST } from "@/lib/pricing";

const tiers = [
  {
    name: "Free", price: "₹0", tag: "Get a feel for Engineering AI",
    features: ["20 AI questions / day", "Basic engineering modes", "PDF & image upload (small files)", "Chat history"],
    cta: "Start free", highlight: false,
  },
  {
    name: "Top-up Plans", price: "Starting ₹49", tag: "Cheaper INR credit packs",
    features: CREDIT_PACK_LIST.map((p) => `${p.name}: ₹${p.amountInr} for ${p.credits} credits`),
    cta: "Open Billing", highlight: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="container mx-auto max-w-7xl px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">// Pricing</p>
        <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Engineered for every stage</h2>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-2xl border p-8 ${
              t.highlight
                ? "border-primary/60 bg-gradient-to-b from-primary/10 to-transparent shadow-glow"
                : "border-border/50 bg-card/40"
            }`}
          >
            {t.highlight && (
              <div className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-xs font-semibold text-primary-foreground">
                Most popular
              </div>
            )}
            <h3 className="font-display text-xl font-semibold">{t.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t.tag}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-display text-5xl font-bold">{t.price}</span>
              {t.per && <span className="text-sm text-muted-foreground">{t.per}</span>}
            </div>
            <ul className="mt-6 space-y-3">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8 w-full" variant={t.highlight ? "default" : "outline"}>
              <Link to={t.highlight ? "/app/billing" : "/signup"}>{t.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

