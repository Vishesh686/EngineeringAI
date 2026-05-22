import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

function BrowserChrome({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
      <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
      <span className="ml-3 text-[10px] font-medium text-white/70">{label}</span>
    </div>
  );
}

function NavRow() {
  return (
    <div className="flex items-center justify-between px-5 py-3 text-[10px] text-white/85">
      <div className="flex items-center gap-2 font-semibold">
        <span className="h-4 w-4 rounded bg-white/90" />
        Engineering AI
      </div>
      <div className="hidden gap-4 sm:flex">
        <span>Overview</span><span>Features</span><span>Pricing</span><span>Docs</span>
      </div>
      <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">Sign in</span>
    </div>
  );
}

function MockCard({
  gradient,
  rotate,
  label,
  className = "",
  delay = 0,
}: {
  gradient: string;
  rotate: string;
  label: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={`absolute overflow-hidden rounded-2xl ring-glow ${gradient} ${className}`}
      style={{ transform: rotate, transformStyle: "preserve-3d" }}
    >
      <BrowserChrome label={label} />
      <NavRow />
      <div className="relative px-5 pb-6 pt-2 text-white">
        <div className="text-[9px] font-bold tracking-[0.2em] text-white/70">
          DESIGN SMARTER, NOT HARDER
        </div>
        <div className="mt-2 font-display text-[15px] font-bold leading-tight sm:text-lg">
          Discipline will take<br />you places motivation<br />can't.
        </div>
        <div className="mt-2 text-[9px] text-white/75 max-w-[80%]">
          Analyze CFD/FEA, debug meshes, and ship faster with an AI copilot built for engineers.
        </div>
        <div className="mt-3 flex gap-2">
          <span className="rounded-md bg-white px-2.5 py-1 text-[9px] font-semibold text-black">
            Schedule a Demo
          </span>
          <span className="rounded-md border border-white/40 px-2.5 py-1 text-[9px] font-semibold">
            Contact Sales
          </span>
        </div>
        {/* glossy orb */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/25 blur-2xl" />
      </div>
    </motion.div>
  );
}

export function HeroMockups() {
  return (
    <div className="relative mx-auto mt-16 hidden h-[520px] w-full max-w-6xl perspective-stage md:block">
      {/* back card */}
      <div className="float-slower">
        <MockCard
          gradient="mockup-emerald"
          rotate="rotateX(14deg) rotateY(-22deg) rotateZ(3deg)"
          label="Engineering AI.app/cfd"
          className="left-[8%] top-0 w-[420px]"
          delay={0.1}
        />
      </div>
      {/* center card */}
      <div className="float-slow">
        <MockCard
          gradient="mockup-blue"
          rotate="rotateX(10deg) rotateY(-12deg)"
          label="Engineering AI.app"
          className="left-1/2 top-12 w-[520px] -translate-x-1/2"
          delay={0.25}
        />
      </div>
      {/* foreground left */}
      <div className="float-slow">
        <MockCard
          gradient="mockup-violet"
          rotate="rotateX(6deg) rotateY(14deg) rotateZ(-3deg)"
          label="Engineering AI.app/research"
          className="-left-2 top-44 w-[380px]"
          delay={0.4}
        />
      </div>
      {/* foreground right */}
      <div className="float-slower">
        <MockCard
          gradient="mockup-pink"
          rotate="rotateX(8deg) rotateY(-26deg) rotateZ(4deg)"
          label="Engineering AI.app/fea"
          className="right-0 top-40 w-[400px]"
          delay={0.55}
        />
      </div>

      {/* floating badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute right-[12%] top-2 z-20 flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 backdrop-blur ring-1 ring-white/10"
      >
        <Logo size="sm" />
      </motion.div>
    </div>
  );
}

/* Compact stacked variant for narrow viewports */
export function HeroMockupsMobile() {
  return (
    <div className="relative mx-auto mt-12 h-[360px] w-full max-w-md perspective-stage md:hidden">
      <div className="float-slower">
        <MockCard
          gradient="mockup-emerald"
          rotate="rotateX(12deg) rotateY(-14deg)"
          label="Engineering AI.app/cfd"
          className="left-0 top-0 w-[88%]"
          delay={0.1}
        />
      </div>
      <div className="float-slow">
        <MockCard
          gradient="mockup-blue"
          rotate="rotateX(8deg) rotateY(-8deg)"
          label="Engineering AI.app"
          className="right-0 top-24 w-[88%]"
          delay={0.3}
        />
      </div>
      <div className="float-slow">
        <MockCard
          gradient="mockup-violet"
          rotate="rotateX(6deg) rotateY(12deg)"
          label="Engineering AI.app/fea"
          className="left-2 top-48 w-[88%]"
          delay={0.5}
        />
      </div>
    </div>
  );
}

