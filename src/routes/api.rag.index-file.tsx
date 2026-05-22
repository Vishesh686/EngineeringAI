import { PDFParse } from "pdf-parse";
import { createFileRoute } from "@tanstack/react-router";
import { chunkText, embedText } from "@/lib/server/embeddings";
import { getSupabaseAdmin, getUserFromBearer } from "@/lib/server/supabase-admin";

async function extractText(name: string, mimeType: string | null, bytes: Uint8Array): Promise<string> {
  if ((mimeType || "").includes("pdf") || name.toLowerCase().endsWith(".pdf")) {
    // Dynamically import pdf-parse only when needed on the server
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: Buffer.from(bytes) });
    const textResult = await parser.getText();
    await parser.destroy();
    return typeof textResult === "string" ? textResult : textResult.text;
  }
  return Buffer.from(bytes).toString("utf-8");
}

export const Route = createFileRoute("/api/rag/index-file")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await getUserFromBearer(request.headers.get("authorization"));
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const { fileId } = (await request.json()) as { fileId?: string };
        if (!fileId) return new Response("fileId required", { status: 400 });

        const supabase = getSupabaseAdmin();
        const { data: file, error } = await supabase
          .from("uploaded_files")
          .select("id,name,mime_type,storage_path")
          .eq("id", fileId)
          .eq("user_id", auth.user.id)
          .maybeSingle();
        if (error || !file) return new Response("File not found", { status: 404 });

        const download = await supabase.storage.from("uploads").download(file.storage_path);
        if (download.error || !download.data) return new Response(download.error?.message ?? "Download failed", { status: 500 });

        const bytes = new Uint8Array(await download.data.arrayBuffer());
        const rawText = await extractTextFromFile(file.name, file.mime_type, bytes);
        const chunks = chunkText(rawText);
        if (chunks.length === 0) return new Response("No extractable text", { status: 400 });

        const { data: doc, error: docError } = await supabase
          .from("rag_documents")
          .insert({
            user_id: auth.user.id,
            uploaded_file_id: file.id,
            title: file.name,
            mime_type: file.mime_type,
            chunk_count: chunks.length,
          })
          .select("id")
          .single();
        if (docError || !doc) return new Response(docError?.message ?? "doc create failed", { status: 500 });

        for (let i = 0; i < chunks.length; i++) {
          const embedding = await embedText(chunks[i]);
          const { error: chunkError } = await supabase.from("document_chunks").insert({
            document_id: doc.id,
            user_id: auth.user.id,
            chunk_index: i,
            content: chunks[i],
            token_estimate: Math.ceil(chunks[i].length / 4),
            embedding,
          });
          if (chunkError) return new Response(chunkError.message, { status: 500 });
        }

        await supabase.from("notifications").insert({
          user_id: auth.user.id,
          kind: "upload_processed",
          title: "Document indexed",
          body: `${file.name} indexed with ${chunks.length} chunks.`,
        });

        return Response.json({ ok: true, chunks: chunks.length });
      },
    },
  },
});
