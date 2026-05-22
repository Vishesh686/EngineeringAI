import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({ meta: [{ title: "Privacy Policy — Engineering AI" }] }),
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-invert prose-sm">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: May 22, 2026</p>

        <p>
          Engineering AI (“we”, “our”) operates <strong>engineerai.netlify.app</strong>. This policy explains how we
          collect, use, and protect your information.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>Account data: email, display name, and profile settings you provide.</li>
          <li>Usage data: chats, files, and engineering preferences stored in our database (Supabase).</li>
          <li>Technical data: browser type, IP address, and cookies required for sign-in and security.</li>
        </ul>

        <h2>Advertising (Google AdSense)</h2>
        <p>
          We use <strong>Google AdSense</strong> to show ads. Google and its partners may use cookies to serve ads
          based on your visits to this and other sites. You can opt out of personalized advertising at{" "}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer">
            Google Ads Settings
          </a>
          .
        </p>
        <p>
          Third-party vendors, including Google, use cookies to serve ads. Users may opt out of third-party vendor
          use of cookies for personalized advertising by visiting{" "}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noreferrer">
            aboutads.info
          </a>
          .
        </p>

        <h2>How we use data</h2>
        <p>To provide AI chat, calculators, billing/credits, improve the product, and comply with law.</p>

        <h2>Data storage</h2>
        <p>Data is hosted on Supabase and Netlify. We do not sell your personal information.</p>

        <h2>Your rights</h2>
        <p>You may request account deletion or data export by contacting us at the email on our site.</p>

        <h2>Contact</h2>
        <p>
          Questions: use the contact link on our homepage or email the address listed in your AdSense / site
          registration.
        </p>

        <p>
          <Link to="/" className="text-accent">
            ← Back to home
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
