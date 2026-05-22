import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const exchanges = [
  {
    user: "My ANSYS Fluent simulation diverged at iteration 234. Residuals exploded after I refined the mesh near the wing's leading edge.",
    ai: "Likely cause: skewed cells from the refinement. Check **Quality > Skewness** — anything above 0.95 is suspect. Three fixes worth trying:\n\n1. Switch to **Coupled** solver with pseudo-transient relaxation 0.5\n2. Set $y^+ \\approx 1$ with a proper inflation layer (15 layers, 1.2 growth)\n3. Drop **Courant** to 5 for the first 200 iterations then ramp up",
  },
  {
    user: "Quick check — Reynolds number for water at 20°C, 0.5 m/s, 25 mm pipe?",
    ai: "$Re = \\frac{\\rho v D}{\\mu} = \\frac{998 \\times 0.5 \\times 0.025}{1.002 \\times 10^{-3}} \\approx 12{,}450$\n\nThat's **turbulent** (Re > 4000). Use Moody chart or Colebrook for friction factor.",
  },
];

export function DemoSection() {
  return (
    <section id="demo" className="container mx-auto max-w-7xl px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">// Live preview</p>
        <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
          Ask anything. Get <span className="glow-text">engineering-grade</span> answers.
        </h2>
      </div>

      <div className="mx-auto mt-12 max-w-3xl space-y-6">
        {exchanges.map((e, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.15 }}
            className="glass rounded-2xl p-6 shadow-elevated"
          >
            <div className="mb-4 rounded-xl bg-muted/40 p-4 text-sm">
              <div className="mb-1 text-xs font-medium text-muted-foreground">You</div>
              {e.user}
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-accent">
                <Sparkles className="h-3 w-3" /> Engineering AI
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{e.ai}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

