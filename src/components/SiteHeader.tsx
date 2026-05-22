import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { user, loading } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#demo" className="hover:text-foreground transition-colors">Demo</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-1">
          {loading ? null : user ? (
            <Button asChild size="sm" className="rounded-full">
              <Link to="/app/chat">Open app</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/signup">Try Engineering AI</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

