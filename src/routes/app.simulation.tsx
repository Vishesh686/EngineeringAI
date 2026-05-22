import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/app/simulation")({
  component: SimulationPage,
  head: () => ({ meta: [{ title: "Simulation Assistant - Engineering AI" }] }),
});

function SimulationPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
          <Cpu className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Simulation Assistant</h1>
          <p className="text-sm text-muted-foreground">Workflow support for CFD/FEA setup, debugging, and interpretation.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wrench className="h-4 w-4" /> Guided Troubleshooting</CardTitle>
          <CardDescription>Use Chat with CFD/FEA mode and upload screenshots or reports for root-cause diagnostics.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Next upgrade block: solver-specific templates, convergence checklists, and ANSYS/OpenFOAM playbooks.
        </CardContent>
      </Card>
    </div>
  );
}

