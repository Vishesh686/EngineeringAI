import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/60">
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The AI copilot built for mechanical and aerospace engineers.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold">App</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/app/chat" className="hover:text-foreground transition-colors">Open workspace</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Engineering AI. This site uses Google AdSense.</p>
        </div>
      </div>
    </footer>
  );
}
