import { createFileRoute } from "@tanstack/react-router";
import { chatCompletionRequest } from "@/lib/ai-provider";
import { getSupabaseAdmin, getUserFromBearer } from "@/lib/server/supabase-admin";

const CREDITS_PER_CHAT = 10;

const SYSTEM_PROMPTS: Record<string, string> = {
  general: "You are Engineering AI, an expert mechanical engineering copilot. Be precise, use SI units by default, format equations in LaTeX ($..$ for inline, $$..$$ for block), use markdown for structure.",
  aerospace: "You are Engineering AI in Aerospace mode. Expert in aerodynamics, propulsion, flight mechanics, structures, orbital mechanics. Use LaTeX for equations.",
  cfd: "You are Engineering AI in CFD Expert mode. Diagnose solver issues, mesh quality, turbulence model selection (k-ε, k-ω SST, LES), boundary conditions, y+ requirements, convergence problems. Specialize in ANSYS Fluent, OpenFOAM, CFX. Use LaTeX.",
  fea: "You are Engineering AI in FEA Expert mode. Expert in stress/strain analysis, element selection, mesh convergence, contact mechanics, nonlinear analysis, modal/buckling. Tools: ANSYS Mechanical, Abaqus, NASTRAN. Use LaTeX.",
  thermo: "You are Engineering AI in Thermodynamics Tutor mode. Teach step-by-step, derive formulas, identify processes (isothermal/adiabatic/etc), apply 1st/2nd law. Use LaTeX.",
  manufacturing: "You are Engineering AI in Manufacturing mode. Expert in machining, additive manufacturing, casting, forming, GD&T, tolerances, DFM.",
  robotics: "You are Engineering AI in Robotics mode. Expert in kinematics, dynamics, control, ROS, motion planning, actuators, sensors. Use LaTeX for transforms.",
  matlab: "You are Engineering AI in MATLAB mode. Write, debug, and explain MATLAB/Simulink code for engineering. Use code blocks.",
  research: "You are Engineering AI in Research Copilot mode. Help with literature review, methodology, novelty, paper structuring, citation, equation derivation. Suggest journals.",
  design: "You are Engineering AI in Design Optimization mode. Topology optimization, parametric studies, multidisciplinary optimization, Pareto trade-offs, lightweighting.",
};

function isMathContext(mode?: string, subject?: string) {
  const m = (mode ?? "").toLowerCase();
  const s = (subject ?? "").toLowerCase();
  const flags = ["math", "mathematics", "calculus", "algebra", "statistics", "numerical"];
  return flags.some((f) => m.includes(f) || s.includes(f));
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const auth = await getUserFromBearer(authHeader);
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const { messages, mode, branch, subject } = await request.json() as {
          messages: Array<{role: string; content: string}>;
          mode?: string;
          branch?: string;
          subject?: string;
        };
        const base = SYSTEM_PROMPTS[mode ?? "general"] ?? SYSTEM_PROMPTS.general;
        const context = `User branch: ${branch ?? "Unknown"}. Active subject: ${subject ?? "General"}. Prefer this context in every answer unless user asks to switch.`;
        const supabase = getSupabaseAdmin();

        const { data: kbRows } = await supabase
          .from("course_knowledge_base")
          .select("title,content,content_type,source_url")
          .eq("branch_name", branch ?? "Unknown")
          .in("subject_name", [subject ?? "General", "General"])
          .order("updated_at", { ascending: false })
          .limit(6);

        const knowledgeContext = (kbRows ?? [])
          .map((k: any, i: number) => {
            const source = k.source_url ? ` (source: ${k.source_url})` : "";
            return `${i + 1}. [${k.content_type}] ${k.title}${source}\n${String(k.content).slice(0, 700)}`;
          })
          .join("\n\n");

        const system = knowledgeContext
          ? `${base}\n\n${context}\n\nUse this trusted branch/subject knowledge if relevant:\n${knowledgeContext}\n\nIf the provided knowledge conflicts with generic info, prioritize the provided knowledge and mention assumptions.`
          : `${base}\n\n${context}`;

        const creditCharge = await supabase.rpc("consume_ai_credit", { cost: CREDITS_PER_CHAT });
        if (creditCharge.error) {
          if (creditCharge.error.message.includes("insufficient_credits")) {
            return new Response("Insufficient credits", { status: 402 });
          }
          return new Response(creditCharge.error.message, { status: 500 });
        }

        const mathMode = isMathContext(mode, subject);

        if (mathMode) {
          const draftResp = await chatCompletionRequest({
            stream: false,
            messages: [
                {
                  role: "system",
                  content:
                    `${system}\n\nFor math problems: solve with explicit numbered steps, maintain units, and compute carefully.`,
                },
                ...messages,
              ],
          });
          if (!draftResp.ok) {
            const text = await draftResp.text();
            return new Response(text, { status: draftResp.status });
          }
          const draftJson = await draftResp.json() as any;
          const draft = draftJson?.choices?.[0]?.message?.content ?? "";
          const userProblem = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

          const verifyResp = await chatCompletionRequest({
            stream: false,
            messages: [
                {
                  role: "system",
                  content:
                    "You are a strict math verifier. Recompute independently, catch arithmetic/algebra/sign/unit errors, then output a corrected final answer with concise steps and a final boxed result.",
                },
                {
                  role: "user",
                  content: `Problem:\n${userProblem}\n\nDraft answer:\n${draft}`,
                },
              ],
          });
          if (!verifyResp.ok) {
            const text = await verifyResp.text();
            return new Response(text, { status: verifyResp.status });
          }
          const verifyJson = await verifyResp.json() as any;
          const verified = verifyJson?.choices?.[0]?.message?.content ?? draft;
          const sse = `data: ${JSON.stringify({ choices: [{ delta: { content: verified } }] })}\n\ndata: [DONE]\n\n`;
          return new Response(sse, {
            headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
          });
        }

        const upstream = await chatCompletionRequest({
          stream: true,
          messages: [{ role: "system", content: system }, ...messages],
        });

        if (!upstream.ok) {
          const text = await upstream.text();
          console.error("AI gateway error", upstream.status, text);
          return new Response(text, { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});

