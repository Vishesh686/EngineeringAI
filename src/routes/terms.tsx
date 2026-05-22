import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({ meta: [{ title: "Terms of Service — Engineering AI" }] }),
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-invert prose-sm">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: May 22, 2026</p>

        <p>By using Engineering AI you agree to these terms.</p>

        <h2>Service</h2>
        <p>
          Engineering AI provides educational AI assistance for engineering students. Outputs may contain errors;
          verify critical calculations and designs independently.
        </p>

        <h2>Accounts & credits</h2>
        <p>
          Free accounts receive starter credits. Additional credits may be earned through promotions or purchased
          where available. We may change credit pricing or limits with notice.
        </p>

        <h2>Acceptable use</h2>
        <ul>
          <li>No illegal, harassing, or cheating-on-exams content.</li>
          <li>No attempts to abuse ads, credits, or API limits.</li>
          <li>No scraping or reverse engineering of the service.</li>
        </ul>

        <h2>Advertising</h2>
        <p>
          The site displays third-party ads (Google AdSense). Rewarded credit offers require viewing sponsored content
          for a minimum time; misleading ad interaction is prohibited.
        </p>

        <h2>Liability</h2>
        <p>The service is provided “as is” without warranties. We are not liable for indirect damages from use of AI outputs.</p>

        <h2>Changes</h2>
        <p>We may update these terms; continued use means acceptance.</p>

        <p>
          <Link to="/privacy" className="text-accent">
            Privacy Policy
          </Link>
          {" · "}
          <Link to="/" className="text-accent">
            Home
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
