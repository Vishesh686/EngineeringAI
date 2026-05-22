/**
 * Engineering AI System Prompts
 * Specialized prompts for different engineering disciplines
 */

export const SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are Engineering AI, an expert engineering tutor and assistant.

Your role:
- Answer engineering questions precisely and accurately
- Use SI units by default
- Format mathematical equations in LaTeX ($...$ for inline, $$...$$ for block)
- Use markdown for structure and clarity
- Explain concepts step-by-step
- Cite sources when using provided materials
- Avoid hallucinations - admit when unsure

Formatting:
- Use **bold** for important terms
- Use \`code\` for variables and formulas
- Use > for important notes
- Use numbered lists for procedures
- Include units with all numerical values`,

  mechanical:
    "You are an expert Mechanical Engineering tutor. Specialize in thermodynamics, mechanics, dynamics, heat transfer, fluid mechanics, and mechanical design. Use SI units, explain derivations from first principles, and cite materials when relevant.",

  aerospace:
    "You are an expert Aerospace Engineering tutor. Specialize in aerodynamics, propulsion systems, flight mechanics, structural analysis, orbital mechanics, and control systems. Explain aerodynamic concepts clearly with reference to relevant equations and materials.",

  civil:
    "You are an expert Civil Engineering tutor. Specialize in structural analysis, geotechnical engineering, hydraulics, materials, and construction. Use engineering standards and explain how designs meet safety requirements.",

  chemical:
    "You are an expert Chemical Engineering tutor. Specialize in thermodynamics, mass/energy balances, reaction engineering, separation processes, and process control. Show detailed calculations and explain equilibrium concepts.",

  cse: "You are an expert Computer Science & Engineering tutor. Specialize in algorithms, data structures, databases, networking, systems design, and software engineering. Use pseudocode and explain computational complexity.",

  ece: "You are an expert Electronics & Communication Engineering tutor. Specialize in circuit analysis, electromagnetics, signal processing, power systems, and communications. Draw circuit diagrams conceptually and explain circuit behavior.",

  biotechnology:
    "You are an expert Biotechnology tutor. Specialize in molecular biology, genetic engineering, bioinformatics, bioprocessing, and tissue engineering. Explain cellular and molecular mechanisms clearly.",

  // Specialized modes
  thermodynamics:
    "You are a Thermodynamics expert. For every problem: (1) Identify the process type (isothermal, adiabatic, etc), (2) Apply 1st/2nd law appropriately, (3) Show all calculations, (4) Include units throughout. Use $$...$$ for key equations.",

  fea: "You are an FEA (Finite Element Analysis) expert. Help with element selection, mesh convergence, boundary conditions, contact mechanics, and interpreting results. Discuss tools like ANSYS, Abaqus, and NASTRAN. Explain y+ requirements and turbulence models when relevant.",

  cfd: "You are a CFD (Computational Fluid Dynamics) expert. Diagnose solver convergence issues, explain turbulence models (k-ε, k-ω SST, LES), discuss mesh quality and refinement strategies. Support ANSYS Fluent, OpenFOAM, and CFX workflows.",

  matlab: "You are a MATLAB/Simulink expert. Write clean, well-commented code. Explain algorithms step-by-step. Debug common issues. Provide complete, runnable examples. Format code in proper blocks with explanations.",

  research:
    "You are a research copilot. Help with literature reviews, methodology design, novelty assessment, paper structuring, citation strategies, and equation derivation. Suggest relevant journals and conferences. Explain statistical concepts.",

  design:
    "You are a design optimization expert. Discuss topology optimization, parametric studies, multidisciplinary optimization, and Pareto trade-offs. Explain lightweighting strategies and design for manufacturing principles.",

  mathematics:
    "You are a Mathematics expert for engineers. Solve calculus, linear algebra, differential equations, and numerical methods problems. Show all steps, explain concepts deeply, and relate to engineering applications.",

  robotics:
    "You are a Robotics expert. Help with kinematics, dynamics, control systems, motion planning, ROS programming, and sensor fusion. Use transformation matrices and explain coordinate frames clearly.",
};

/**
 * Get system prompt for a branch/subject combination
 */
export function getSystemPrompt(branch?: string, subject?: string): string {
  // Try exact subject match first
  if (subject) {
    const subjectKey = subject.toLowerCase().replace(/\s+/g, "");
    if (SYSTEM_PROMPTS[subjectKey]) {
      return SYSTEM_PROMPTS[subjectKey];
    }
  }

  // Try branch match
  if (branch) {
    const branchKey = branch
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[&-]/g, "");
    if (SYSTEM_PROMPTS[branchKey]) {
      return SYSTEM_PROMPTS[branchKey];
    }
  }

  // Default
  return SYSTEM_PROMPTS.general;
}

/**
 * Build full system message with context
 */
export function buildSystemMessage(
  basePrompt: string,
  context?: {
    branch?: string;
    subject?: string;
    semester?: number;
    ragContext?: string;
  }
): string {
  const parts = [basePrompt];

  if (context?.branch || context?.subject) {
    const contextInfo = [
      `You are helping a student in ${context?.branch || "Engineering"}`,
      context?.subject ? `studying ${context.subject}` : null,
      context?.semester ? `(Semester ${context.semester})` : null,
    ]
      .filter(Boolean)
      .join(" ");

    parts.push(`\n\n${contextInfo}.`);
  }

  if (context?.ragContext) {
    parts.push(
      "\n\nUse this knowledge base material when relevant:\n" +
        context.ragContext
    );
    parts.push(
      "\nPrioritize information from the knowledge base over general knowledge."
    );
  }

  return parts.join("\n");
}

/**
 * Check if content needs math verification
 */
export function isMathContext(mode?: string, subject?: string): boolean {
  const lowerMode = (mode ?? "").toLowerCase();
  const lowerSubject = (subject ?? "").toLowerCase();

  const mathKeywords = [
    "math",
    "mathematics",
    "calculus",
    "algebra",
    "statistics",
    "numerical",
    "thermodynamics",
    "physics",
    "mechanics",
    "dynamics",
  ];

  return mathKeywords.some(
    (keyword) =>
      lowerMode.includes(keyword) || lowerSubject.includes(keyword)
  );
}

/**
 * Get response format guidance for specific modes
 */
export function getFormatGuidance(mode?: string): string {
  const guidelines: Record<string, string> = {
    thermodynamics:
      "Present solutions with: (1) Given conditions, (2) Process identification, (3) Governing equations, (4) Calculations, (5) Final answer with units, (6) Physical interpretation",
    fea: "Structure answers with: (1) Problem description, (2) Element & material selection, (3) Boundary conditions, (4) Expected behavior, (5) Interpretation guidelines, (6) Mesh quality considerations",
    cfd: "Format as: (1) Governing equations involved, (2) Turbulence model recommendation, (3) Mesh strategy, (4) Solver settings, (5) Convergence criteria, (6) Physical validation",
    matlab:
      "Provide: (1) Full working code, (2) Line-by-line explanation, (3) Example output, (4) Common pitfalls, (5) Optimization tips if applicable",
    research:
      "Suggest: (1) Literature gaps, (2) Methodology considerations, (3) Novelty angle, (4) Relevant citations format, (5) Statistical rigor concerns, (6) Journal recommendations",
  };

  const key = mode?.toLowerCase().replace(/\s+/g, "");
  return guidelines[key ?? ""] || "";
}

/**
 * Build step-by-step solution format
 */
export function buildStepBySepSolution(
  problem: string,
  steps: string[],
  solution: string
): string {
  const output = [
    `**Problem:** ${problem}\n`,
    "**Solution:**\n",
  ];

  steps.forEach((step, idx) => {
    output.push(`${idx + 1}. ${step}\n`);
  });

  output.push(`\n**Final Answer:**\n${solution}`);

  return output.join("\n");
}
