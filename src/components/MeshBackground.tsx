import { motion } from "framer-motion";

export function MeshBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 mesh-bg opacity-60" />
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-glow)" }}
      />
      {/* Floating CFD-style orbs */}
      <motion.div
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "oklch(0.72 0.18 235 / 0.25)" }}
        animate={{ x: [0, 80, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: "oklch(0.82 0.16 200 / 0.2)" }}
        animate={{ x: [0, -60, 0], y: [0, -60, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
