import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator } from "lucide-react";

export const Route = createFileRoute("/app/calculators")({
  component: CalculatorsPage,
  head: () => ({ meta: [{ title: "Calculators — Engineering AI" }] }),
});

type Field = { key: string; label: string; unit?: string; default?: number };
type Calc = {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: Field[];
  compute: (v: Record<string, number>) => { label: string; value: string }[];
};

const CALCS: Calc[] = [
  {
    id: "reynolds",
    name: "Reynolds Number",
    category: "Fluids",
    description: "Re = ρ·v·L / μ — flow regime classification.",
    fields: [
      { key: "rho", label: "Density ρ", unit: "kg/m³", default: 1.225 },
      { key: "v", label: "Velocity v", unit: "m/s", default: 10 },
      { key: "L", label: "Char. length L", unit: "m", default: 1 },
      { key: "mu", label: "Dyn. viscosity μ", unit: "Pa·s", default: 1.81e-5 },
    ],
    compute: ({ rho, v, L, mu }) => {
      const Re = (rho * v * L) / mu;
      const regime = Re < 2300 ? "Laminar" : Re < 4000 ? "Transitional" : "Turbulent";
      return [
        { label: "Reynolds Number", value: Re.toExponential(3) },
        { label: "Flow Regime", value: regime },
      ];
    },
  },
  {
    id: "mach",
    name: "Mach Number",
    category: "Aerospace",
    description: "M = v / a — compressibility regime for gas flow.",
    fields: [
      { key: "v", label: "Velocity v", unit: "m/s", default: 250 },
      { key: "T", label: "Temperature T", unit: "K", default: 288.15 },
      { key: "gamma", label: "γ", default: 1.4 },
      { key: "R", label: "R", unit: "J/kg·K", default: 287 },
    ],
    compute: ({ v, T, gamma, R }) => {
      const a = Math.sqrt(gamma * R * T);
      const M = v / a;
      const regime = M < 0.3 ? "Incompressible" : M < 0.8 ? "Subsonic" : M < 1.2 ? "Transonic" : M < 5 ? "Supersonic" : "Hypersonic";
      return [
        { label: "Speed of sound a", value: a.toFixed(2) + " m/s" },
        { label: "Mach number", value: M.toFixed(3) },
        { label: "Regime", value: regime },
      ];
    },
  },
  {
    id: "bernoulli",
    name: "Bernoulli Equation",
    category: "Fluids",
    description: "P + ½ρv² + ρgh = const — pressure between two points.",
    fields: [
      { key: "P1", label: "P₁", unit: "Pa", default: 101325 },
      { key: "rho", label: "ρ", unit: "kg/m³", default: 1000 },
      { key: "v1", label: "v₁", unit: "m/s", default: 2 },
      { key: "v2", label: "v₂", unit: "m/s", default: 5 },
      { key: "h1", label: "h₁", unit: "m", default: 0 },
      { key: "h2", label: "h₂", unit: "m", default: 0 },
    ],
    compute: ({ P1, rho, v1, v2, h1, h2 }) => {
      const g = 9.81;
      const P2 = P1 + 0.5 * rho * (v1 * v1 - v2 * v2) + rho * g * (h1 - h2);
      return [{ label: "P₂", value: P2.toFixed(2) + " Pa" }];
    },
  },
  {
    id: "stress",
    name: "Normal Stress",
    category: "Solids",
    description: "σ = F / A — axial stress on a member.",
    fields: [
      { key: "F", label: "Force F", unit: "N", default: 1000 },
      { key: "A", label: "Area A", unit: "m²", default: 0.001 },
    ],
    compute: ({ F, A }) => [{ label: "Stress σ", value: (F / A / 1e6).toFixed(3) + " MPa" }],
  },
  {
    id: "beam",
    name: "Beam Deflection (Cantilever, End Load)",
    category: "Solids",
    description: "δ = F·L³ / (3·E·I) — tip deflection.",
    fields: [
      { key: "F", label: "Load F", unit: "N", default: 500 },
      { key: "L", label: "Length L", unit: "m", default: 1 },
      { key: "E", label: "Young's mod E", unit: "Pa", default: 2e11 },
      { key: "I", label: "Moment of inertia I", unit: "m⁴", default: 8.33e-6 },
    ],
    compute: ({ F, L, E, I }) => [
      { label: "Tip deflection δ", value: ((F * L ** 3) / (3 * E * I) * 1000).toFixed(4) + " mm" },
    ],
  },
  {
    id: "thermo",
    name: "Ideal Gas Law",
    category: "Thermo",
    description: "PV = nRT — solve for pressure.",
    fields: [
      { key: "n", label: "Moles n", unit: "mol", default: 1 },
      { key: "T", label: "T", unit: "K", default: 298 },
      { key: "V", label: "V", unit: "m³", default: 0.0224 },
    ],
    compute: ({ n, T, V }) => [{ label: "Pressure P", value: ((n * 8.314 * T) / V / 1000).toFixed(3) + " kPa" }],
  },
  {
    id: "heat",
    name: "Conductive Heat Transfer",
    category: "Heat",
    description: "Q = k·A·ΔT / L — Fourier's law (1D).",
    fields: [
      { key: "k", label: "Conductivity k", unit: "W/m·K", default: 200 },
      { key: "A", label: "Area A", unit: "m²", default: 0.01 },
      { key: "dT", label: "ΔT", unit: "K", default: 50 },
      { key: "L", label: "Thickness L", unit: "m", default: 0.005 },
    ],
    compute: ({ k, A, dT, L }) => [{ label: "Heat rate Q", value: ((k * A * dT) / L).toFixed(2) + " W" }],
  },
  {
    id: "drag",
    name: "Drag Force",
    category: "Aerospace",
    description: "F_D = ½·ρ·v²·C_D·A",
    fields: [
      { key: "rho", label: "ρ", unit: "kg/m³", default: 1.225 },
      { key: "v", label: "v", unit: "m/s", default: 30 },
      { key: "Cd", label: "C_D", default: 0.3 },
      { key: "A", label: "A", unit: "m²", default: 2 },
    ],
    compute: ({ rho, v, Cd, A }) => [{ label: "Drag", value: (0.5 * rho * v * v * Cd * A).toFixed(2) + " N" }],
  },
  {
    id: "lift",
    name: "Lift Force",
    category: "Aerospace",
    description: "F_L = ½·ρ·v²·C_L·A",
    fields: [
      { key: "rho", label: "ρ", unit: "kg/m³", default: 1.225 },
      { key: "v", label: "v", unit: "m/s", default: 60 },
      { key: "Cl", label: "C_L", default: 1.2 },
      { key: "A", label: "Wing area A", unit: "m²", default: 16 },
    ],
    compute: ({ rho, v, Cl, A }) => [{ label: "Lift", value: (0.5 * rho * v * v * Cl * A).toFixed(2) + " N" }],
  },
  {
    id: "torque",
    name: "Power from Torque",
    category: "Machines",
    description: "P = τ·ω",
    fields: [
      { key: "tau", label: "Torque τ", unit: "N·m", default: 50 },
      { key: "rpm", label: "Speed", unit: "RPM", default: 1500 },
    ],
    compute: ({ tau, rpm }) => {
      const omega = (rpm * 2 * Math.PI) / 60;
      return [
        { label: "Angular velocity ω", value: omega.toFixed(2) + " rad/s" },
        { label: "Power P", value: (tau * omega).toFixed(2) + " W" },
      ];
    },
  },
  {
    id: "gear",
    name: "Gear Ratio",
    category: "Machines",
    description: "i = N₂ / N₁ — output speed from input.",
    fields: [
      { key: "N1", label: "Teeth (driver)", default: 20 },
      { key: "N2", label: "Teeth (driven)", default: 60 },
      { key: "rpm1", label: "Input RPM", default: 1800 },
    ],
    compute: ({ N1, N2, rpm1 }) => {
      const ratio = N2 / N1;
      return [
        { label: "Gear ratio", value: ratio.toFixed(3) + ":1" },
        { label: "Output RPM", value: (rpm1 / ratio).toFixed(2) },
      ];
    },
  },
  {
    id: "pressure",
    name: "Hydrostatic Pressure",
    category: "Fluids",
    description: "P = ρ·g·h",
    fields: [
      { key: "rho", label: "ρ", unit: "kg/m³", default: 1000 },
      { key: "h", label: "Depth h", unit: "m", default: 10 },
    ],
    compute: ({ rho, h }) => [{ label: "Pressure", value: ((rho * 9.81 * h) / 1000).toFixed(2) + " kPa" }],
  },
  {
    id: "rocket",
    name: "Tsiolkovsky Rocket Equation",
    category: "Aerospace",
    description: "Δv = Isp·g·ln(m₀/m_f)",
    fields: [
      { key: "Isp", label: "Isp", unit: "s", default: 300 },
      { key: "m0", label: "Wet mass m₀", unit: "kg", default: 1000 },
      { key: "mf", label: "Dry mass m_f", unit: "kg", default: 200 },
    ],
    compute: ({ Isp, m0, mf }) => [
      { label: "Δv", value: (Isp * 9.81 * Math.log(m0 / mf)).toFixed(2) + " m/s" },
    ],
  },
];

function CalcCard({ calc }: { calc: Calc }) {
  const [vals, setVals] = useState<Record<string, number>>(
    Object.fromEntries(calc.fields.map((f) => [f.key, f.default ?? 0]))
  );
  const [results, setResults] = useState<{ label: string; value: string }[] | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{calc.name}</CardTitle>
        <CardDescription>{calc.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {calc.fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label htmlFor={`${calc.id}-${f.key}`} className="text-xs">
                {f.label} {f.unit && <span className="text-muted-foreground">({f.unit})</span>}
              </Label>
              <Input
                id={`${calc.id}-${f.key}`}
                type="number"
                value={vals[f.key]}
                onChange={(e) => setVals((v) => ({ ...v, [f.key]: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          ))}
        </div>
        <Button
          onClick={() => setResults(calc.compute(vals))}
          className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
        >
          Compute
        </Button>
        {results && (
          <div className="space-y-1 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            {results.map((r) => (
              <div key={r.label} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-mono font-medium text-foreground">{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CalculatorsPage() {
  const categories = Array.from(new Set(CALCS.map((c) => c.category)));
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
          <Calculator className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Engineering Calculators</h1>
          <p className="text-sm text-muted-foreground">13 instant-solve calculators across mechanical & aerospace domains.</p>
        </div>
      </div>

      <Tabs defaultValue={categories[0]}>
        <TabsList className="flex flex-wrap">
          {categories.map((c) => (
            <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
          ))}
        </TabsList>
        {categories.map((c) => (
          <TabsContent key={c} value={c} className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {CALCS.filter((calc) => calc.category === c).map((calc) => (
                <CalcCard key={calc.id} calc={calc} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

