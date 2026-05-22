import { ArrowRight } from "lucide-react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { resolveAuthenticatedPath } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { DemoSection } from "@/components/landing/DemoSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { PromptHero } from "@/components/landing/PromptHero";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Index,
  head: () => ({
    meta: [
      { title: "Engineering AI — The AI Copilot for Mechanical & Aerospace Engineers" },
      { name: "description", content: "Ask Engineering AI anything — from CFD and FEA debugging to research papers, calculators, and CAD. The AI copilot built for engineers." },
      { property: "og:title", content: "Engineering AI — AI Copilot for Engineers" },
      { property: "og:description", content: "The AI copilot for mechanical and aerospace engineers. CFD, FEA, research, CAD, calculators." },
    ],
  }),
});

function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    resolveAuthenticatedPath().then((path) => navigate({ to: path, replace: true }));
  }, [user, loading, navigate]);

  return (
    <div className="relative min-h-screen bg-background">
      <SiteHeader />
      <PromptHero />
      <FeaturesSection />
      <DemoSection />
      <TestimonialsSection />
      <PricingSection />

      {/* FINAL CTA */}
      <section className="container mx-auto max-w-4xl px-4 py-28 text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
          Start engineering with <span className="glow-text">Engineering AI</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Join engineers, researchers, and students shipping work twice as fast.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/signup">
              Get started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="rounded-full">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

