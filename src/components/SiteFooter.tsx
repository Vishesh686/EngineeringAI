import { Logo } from "@/components/Logo";

export function SiteFooter() {
  const cols = [
    { title: "Product", links: ["Features", "Pricing", "Demo", "Documentation"] },
    { title: "Company", links: ["About", "Careers", "Contact", "Blog"] },
    { title: "Legal", links: ["Privacy Policy", "Terms", "Security", "Cookie Policy"] },
  ];
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
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="mb-4 font-display text-sm font-semibold">{c.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l}><a href="#" className="hover:text-foreground transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Engineering AI. Engineered with AI.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Twitter</a>
            <a href="#" className="hover:text-foreground">GitHub</a>
            <a href="#" className="hover:text-foreground">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

