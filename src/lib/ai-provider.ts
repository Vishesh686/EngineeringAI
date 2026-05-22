type ChatMessage = { role: string; content: string };

export function getAiConfig() {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const lovableKey = process.env.LOVABLE_API_KEY?.trim();

  if (openaiKey) {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      provider: "openai" as const,
    };
  }

  if (lovableKey) {
    return {
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      apiKey: lovableKey,
      model: process.env.LOVABLE_AI_MODEL?.trim() || "google/gemini-3-flash-preview",
      provider: "lovable" as const,
    };
  }

  return null;
}

export async function chatCompletionRequest(options: {
  messages: ChatMessage[];
  stream: boolean;
}) {
  const config = getAiConfig();
  if (!config) {
    return new Response(JSON.stringify({ error: "No AI API key configured (OPENAI_API_KEY or LOVABLE_API_KEY)" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      stream: options.stream,
      messages: options.messages,
    }),
  });
}
