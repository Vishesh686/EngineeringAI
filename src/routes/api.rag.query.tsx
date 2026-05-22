import { createFileRoute } from "@tanstack/react-router";
import { embedText } from "@/lib/server/embeddings";
import { getSupabaseAdmin, getUserFromBearer } from "@/lib/server/supabase-admin";

export const Route = createFileRoute("/api/rag/query")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await getUserFromBearer(request.headers.get("authorization"));
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const { query, topK } = (await request.json()) as { query?: string; topK?: number };
        if (!query?.trim()) return new Response("query required", { status: 400 });

        const embedding = await embedText(query);
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.rpc("match_document_chunks", {
          query_embedding: embedding,
          match_count: topK ?? 5,
          filter_user_id: auth.user.id,
        });

        if (error) return new Response(error.message, { status: 500 });
        return Response.json({ matches: data ?? [] });
      },
    },
  },
});
