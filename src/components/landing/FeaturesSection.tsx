import { motion } from "framer-motion";
import {
  Brain, Wind, Image as ImageIcon, FileText, Calculator,
  Cog, BookOpen, Database, Workflow, Cloud,
} from "lucide-react";

const features = [
  { icon: Brain, title: "AI Engineering Assistant", desc: "Multi-modal reasoning tuned for mechanical, aerospace, CFD, and FEA." },
  { icon: Wind, title: "CFD & FEA Troubleshooting", desc: "Debug solver errors, mesh issues, convergence and boundary conditions." },
  { icon: ImageIcon, title: "Screenshot-to-Solution", desc: "Upload contours, mesh plots, or error dialogs — get root-cause analysis." },
  { icon: BookOpen, title: "Research Paper Copilot", desc: "Summarise papers, extract equations, generate lit reviews." },
  { icon: Calculator, title: "Engineering Calculators", desc: "Reynolds, Mach, beam stress, heat transfer, nozzle and compressor math." },
  { icon: Cog, title: "CAD & Design Assistance", desc: "Design optimisation guidance and feature-by-feature CAD debugging." },
  { icon: FileText, title: "PDF & Report Understanding", desc: "Drop a textbook or thesis — query, summarise, compare across docs." },
  { icon: Database, title: "Personalised Memory", desc: "Engineering AI remembers your projects, tools, units, and research." },
  { icon: Workflow, title: "Workflow Automation", desc: "Chain prompts and run repeatable engineering pipelines." },
  { icon: Cloud, title: "Cloud Workspace", desc: "Files, chats, notes — synced and searchable from anywhere." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="container mx-auto max-w-6xl px-4 py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Capabilities</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
          One workspace. <span className="glow-text">Every engineering tool.</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Ten tightly integrated tools that replace a folder full of notebooks, tabs, and Slack threads.
        </p>
      </div>

      <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-border/60 bg-border/40 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.03 }}
            className="group relative bg-background p-6 transition-colors hover:bg-card/60"
          >
            <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-card ring-1 ring-border/60 transition-colors group-hover:ring-primary/40">
              <f.icon className="h-4 w-4 text-accent" />
            </div>
            <h3 className="font-display text-base font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

