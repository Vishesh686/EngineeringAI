import { createFileRoute } from "@tanstack/react-router";
import { chatCompletionRequest } from "@/lib/ai-provider";
import { getSupabaseAdmin, getUserFromBearer } from "@/lib/server/supabase-admin";
import {
  getSystemPrompt,
  buildSystemMessage,
  isMathContext as checkMathContext,
} from "@/lib/prompts";
import {
  searchKnowledgeBase,
  buildRagContext,
  extractSources,
} from "@/lib/rag";

const CREDITS_PER_CHAT = 10;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const auth = await getUserFromBearer(authHeader);
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const {
          messages,
          mode,
          branch,
          subject,
          courseId,
          subjectId,
        } = (await request.json()) as {
          messages: Array<{ role: string; content: string }>;
          mode?: string;
          branch?: string;
          subject?: string;
          courseId?: string;
          subjectId?: string;
        };

        const supabase = getSupabaseAdmin();

        // Check prompt balance
        const { data: profile } = await supabase
          .from("profiles")
          .select("free_prompts")
          .eq("id", auth.user.id)
          .single();

        if (!profile || profile.free_prompts <= 0) {
          return new Response("Insufficient prompts. Please upgrade or watch ads for more.", {
            status: 402,
          });
        }

        // Get system prompt
        const basePrompt = getSystemPrompt(branch, subject || mode);

        // Try RAG search with vector DB first
        let ragContext = "";
        let sources = [];
        if (courseId) {
          try {
            const chunks = await searchKnowledgeBase(
              messages[messages.length - 1]?.content || "",
              courseId,
              subjectId,
              {
                limit: 8,
                similarityThreshold: 0.65,
              }
            );

            if (chunks.length > 0) {
              ragContext = buildRagContext(chunks);
              sources = chunks;
            }
          } catch (err) {
            console.error("RAG search error:", err);
            // Fallback to legacy KB search
          }
        }

        // Build final system message
        const system = buildSystemMessage(basePrompt, {
          branch,
          subject: subject || mode,
          ragContext,
        });

        // Deduct prompt
        const { error: deductError } = await supabase
          .from("profiles")
          .update({ free_prompts: profile.free_prompts - 1 })
          .eq("id", auth.user.id);

        if (deductError) {
          console.error("Failed to deduct prompt:", deductError);
        }

        // Log usage
        await supabase
          .from("ai_usage")
          .insert({
            user_id: auth.user.id,
            request_type: "chat",
            course_id: courseId,
            subject_id: subjectId,
            api_provider: "gemini",
            model_used: "gemini-1.5-flash",
          });

        // Check if math mode
        const mathMode = checkMathContext(mode, subject);

        if (mathMode) {
          const draftResp = await chatCompletionRequest({
            stream: false,
            messages: [
              {
                role: "system",
                content:
                  system +
                  "\n\nFor math/physics problems: (1) Show given information, (2) Identify applicable formulas/laws, (3) Solve step-by-step with units, (4) Box the final answer.",
              },
              ...messages,
            ],
          });

          if (!draftResp.ok) {
            const text = await draftResp.text();
            return new Response(text, { status: draftResp.status });
          }

          const draftJson = (await draftResp.json()) as any;
          const draft = draftJson?.choices?.[0]?.message?.content ?? "";
          const userProblem =
            [...messages].reverse().find((m) => m.role === "user")?.content ??
            "";

          const verifyResp = await chatCompletionRequest({
            stream: false,
            messages: [
              {
                role: "system",
                content:
                  "You are a strict solution verifier. Independently recompute, check for errors (arithmetic, algebra, sign, units), then output corrected solution with numbered steps and boxed final answer.",
              },
              {
                role: "user",
                content: `Problem:\n${userProblem}\n\nProposed solution:\n${draft}`,
              },
            ],
          });

          if (!verifyResp.ok) {
            const text = await verifyResp.text();
            return new Response(text, { status: verifyResp.status });
          }

          const verifyJson = (await verifyResp.json()) as any;
          const verified = verifyJson?.choices?.[0]?.message?.content ?? draft;
          const sourcesStr = sources.length > 0 ? `\n\n${extractSources(sources)}` : "";
          const sseContent = verified + sourcesStr;
          const sse = `data: ${JSON.stringify({
            choices: [{ delta: { content: sseContent } }],
          })}\n\ndata: [DONE]\n\n`;

          return new Response(sse, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
            },
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

        // Add sources to stream if available
        if (sources.length === 0) {
          return new Response(upstream.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
            },
          });
        }

        // Append sources to streaming response
        const encoder = new TextEncoder();
        const sourceStr = extractSources(sources);
        const sourcesEvent = `data: ${JSON.stringify({
          choices: [{ delta: { content: `\n\n${sourceStr}` } }],
        })}\n\n`;

        const transformStream = new TransformStream({
          async transform(chunk: any, controller: any) {
            controller.enqueue(chunk);
          },
          async flush(controller: any) {
            controller.enqueue(encoder.encode(sourcesEvent));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          },
        });

        return new Response(
          (upstream.body as ReadableStream<Uint8Array>).pipeThrough(
            transformStream
          ),
          {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
            },
          }
        );
      },
    },
  },
});

