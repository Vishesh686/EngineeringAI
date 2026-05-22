import { streamText } from "./gemini";

type ChatMessage = { role: string; content: string };

export function getAiConfig() {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const lovableKey = process.env.LOVABLE_API_KEY?.trim();

  // Prefer Gemini if available
  if (geminiKey) {
    return {
      provider: "gemini" as const,
      model: "gemini-1.5-flash",
    };
  }

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
    return new Response(
      JSON.stringify({
        error: "No AI API key configured (GEMINI_API_KEY, OPENAI_API_KEY, or LOVABLE_API_KEY)",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Use Gemini if configured
  if (config.provider === "gemini") {
    return handleGeminiRequest(options);
  }

  // Fallback to OpenAI or Lovable gateway
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

async function handleGeminiRequest(options: {
  messages: ChatMessage[];
  stream: boolean;
}) {
  try {
    const stream = await streamText(options.messages, {
      model: "gemini-1.5-flash",
    });

    if (!options.stream) {
      // Non-streaming response
      let fullText = "";
      for await (const chunk of stream.stream) {
        fullText += chunk.text();
      }

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: { content: fullText },
              delta: { content: fullText },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Streaming response - convert to OpenAI format
    const encoder = new TextEncoder();
    let buffer = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.stream) {
            const text = chunk.text();
            if (text) {
              // Format as OpenAI SSE
              const sseChunk = `data: ${JSON.stringify({
                choices: [{ delta: { content: text } }],
              })}\n\n`;
              controller.enqueue(encoder.encode(sseChunk));
            }
          }
          // Send done marker
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
