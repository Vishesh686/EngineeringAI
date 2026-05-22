import { Link } from "@tanstack/react-router";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-lg", md: "text-xl", lg: "text-3xl" };
  return (
    <Link to="/" className="flex items-center gap-2 font-display font-bold">
      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow">
        <span className="absolute inset-[2px] rounded-md bg-background/40 backdrop-blur" />
        <span className="relative text-[10px] font-black tracking-tighter text-foreground">E</span>
      </span>
      <span className={sizes[size]}>
        Engineering <span className="glow-text">AI</span>
      </span>
    </Link>
  );
}
