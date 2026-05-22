import { generateEmbedding, generateEmbeddingsBatch } from "./gemini";
import { getSupabaseAdmin } from "./server/supabase-admin";

interface EmbeddingResult {
  chunkId: string;
  embedding: number[];
  success: boolean;
  error?: string;
}

/**
 * Generate embedding for a single chunk and store in database
 */
export async function embedChunk(
  chunkId: string,
  content: string,
  courseId: string,
  subjectId?: string
): Promise<EmbeddingResult> {
  try {
    const embedding = await generateEmbedding(content);

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("embeddings")
      .insert({
        chunk_id: chunkId,
        uploaded_file_id: chunkId, // Will be updated by caller
        course_id: courseId,
        subject_id: subjectId,
        embedding,
        model_name: "embedding-001",
      });

    if (error) {
      throw new Error(`Failed to store embedding: ${error.message}`);
    }

    return {
      chunkId,
      embedding,
      success: true,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to embed chunk ${chunkId}:`, errorMsg);
    return {
      chunkId,
      embedding: [],
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Generate embeddings for multiple chunks in batches
 */
export async function embedChunksBatch(
  chunks: Array<{
    id: string;
    content: string;
  }>,
  courseId: string,
  fileId: string,
  subjectId?: string,
  batchSize: number = 10
): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const contents = batch.map((c) => c.content);

    try {
      const embeddings = await generateEmbeddingsBatch(contents, {
        batchSize: 10,
      });

      const supabase = getSupabaseAdmin();
      const insertData = embeddings.map((emb, idx) => ({
        chunk_id: batch[idx].id,
        uploaded_file_id: fileId,
        course_id: courseId,
        subject_id: subjectId,
        embedding: emb,
        model_name: "embedding-001",
      }));

      const { error } = await supabase
        .from("embeddings")
        .insert(insertData);

      if (error) {
        throw new Error(`Failed to store batch embeddings: ${error.message}`);
      }

      results.push(
        ...batch.map((chunk, idx) => ({
          chunkId: chunk.id,
          embedding: embeddings[idx],
          success: true,
        }))
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to embed batch starting at ${i}:`, errorMsg);

      results.push(
        ...batch.map((chunk) => ({
          chunkId: chunk.id,
          embedding: [],
          success: false,
          error: errorMsg,
        }))
      );
    }
  }

  return results;
}

/**
 * Re-embed all chunks for a file
 */
export async function reembedFile(uploadedFileId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Get file details
  const { data: file, error: fileError } = await supabase
    .from("uploaded_files")
    .select("*")
    .eq("id", uploadedFileId)
    .single();

  if (fileError || !file) {
    throw new Error(`File not found: ${uploadedFileId}`);
  }

  // Delete old embeddings
  await supabase
    .from("embeddings")
    .delete()
    .eq("uploaded_file_id", uploadedFileId);

  // Get all chunks
  const { data: chunks, error: chunksError } = await supabase
    .from("knowledge_chunks")
    .select("id, content")
    .eq("uploaded_file_id", uploadedFileId)
    .order("chunk_index", { ascending: true });

  if (chunksError || !chunks) {
    throw new Error(`Failed to fetch chunks: ${chunksError?.message}`);
  }

  // Embed chunks
  await embedChunksBatch(chunks, file.course_id, uploadedFileId, file.subject_id);
}

/**
 * Clean embeddings after chunk deletion
 */
export async function deleteEmbeddingsForChunk(
  chunkId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("embeddings")
    .delete()
    .eq("chunk_id", chunkId);

  if (error) {
    console.error(`Failed to delete embedding for chunk ${chunkId}:`, error);
  }
}

/**
 * Get embedding statistics
 */
export async function getEmbeddingStats(
  courseId: string,
  subjectId?: string
): Promise<{
  totalChunks: number;
  embeddedChunks: number;
  missingEmbeddings: number;
}> {
  const supabase = getSupabaseAdmin();

  // Get total chunks
  let chunksQuery = supabase
    .from("knowledge_chunks")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  if (subjectId) {
    chunksQuery = chunksQuery.eq("subject_id", subjectId);
  }

  const { count: totalChunks } = await chunksQuery;

  // Get embedded chunks
  let embeddedQuery = supabase
    .from("embeddings")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  if (subjectId) {
    embeddedQuery = embeddedQuery.eq("subject_id", subjectId);
  }

  const { count: embeddedChunks } = await embeddedQuery;

  return {
    totalChunks: totalChunks || 0,
    embeddedChunks: embeddedChunks || 0,
    missingEmbeddings: (totalChunks || 0) - (embeddedChunks || 0),
  };
}
