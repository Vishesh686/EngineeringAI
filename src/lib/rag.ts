import { generateEmbedding } from "./gemini";
import { getSupabaseAdmin } from "./server/supabase-admin";

export interface RetrievedChunk {
  id: string;
  content: string;
  fileName: string;
  courseName: string;
  subjectName?: string;
  similarity: number;
  metadata?: any;
}

/**
 * Search knowledge base for chunks similar to a query
 */
export async function searchKnowledgeBase(
  query: string,
  courseId: string,
  subjectId?: string,
  options?: {
    limit?: number;
    similarityThreshold?: number;
  }
): Promise<RetrievedChunk[]> {
  const limit = options?.limit ?? 10;
  const threshold = options?.similarityThreshold ?? 0.7;

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Search similar chunks
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc(
      "search_similar_chunks",
      {
        query_embedding: queryEmbedding,
        search_course_id: courseId,
        search_subject_id: subjectId,
        limit_results: limit,
        similarity_threshold: threshold,
      }
    );

    if (error) {
      console.error("Vector search failed:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      content: row.content,
      fileName: row.file_name,
      courseName: row.course_name,
      subjectName: row.subject_name,
      similarity: row.similarity,
      metadata: row.metadata,
    }));
  } catch (err) {
    console.error("Knowledge base search error:", err);
    return [];
  }
}

/**
 * Fallback: Search existing course knowledge base (non-vector)
 */
export async function searchCourseKnowledgeBase(
  courseId: string,
  subjectId?: string
): Promise<
  Array<{
    id: string;
    title: string;
    content: string;
    source_url?: string;
  }>
> {
  const supabase = getSupabaseAdmin();

  // Query existing course_knowledge_base table
  let query = supabase
    .from("course_knowledge_base")
    .select("id, title, content, source_url");

  // Map courseId UUID to branch name if needed
  // This assumes courseId can be matched to branch_name
  // Adjust based on your schema

  if (subjectId) {
    query = query.eq("subject_name", subjectId);
  }

  const { data } = await query.limit(6);

  return (
    data?.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      source_url: row.source_url,
    })) || []
  );
}

/**
 * Build rich context from retrieved chunks for RAG
 */
export function buildRagContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "";
  }

  const contextLines = [
    "=== Knowledge Base Context (from uploaded materials) ===\n",
  ];

  chunks.forEach((chunk, idx) => {
    const similarity = (chunk.similarity * 100).toFixed(1);
    contextLines.push(
      `[${idx + 1}] From "${chunk.fileName}" (${chunk.courseName}${chunk.subjectName ? ` > ${chunk.subjectName}` : ""}) - Relevance: ${similarity}%`
    );
    contextLines.push(chunk.content.slice(0, 500)); // Truncate for context
    contextLines.push("---\n");
  });

  return contextLines.join("\n");
}

/**
 * Build system prompt with RAG context
 */
export function buildRagPrompt(
  basePrompt: string,
  context: string,
  options?: {
    citeSources?: boolean;
    emphasizeContext?: boolean;
  }
): string {
  const parts = [basePrompt];

  if (context) {
    parts.push("\n" + context);

    if (options?.citeSources) {
      parts.push(
        "\nWhen using information from the provided context, cite the source document."
      );
    }

    if (options?.emphasizeContext) {
      parts.push(
        "\nPrioritize information from the provided knowledge base over general knowledge."
      );
    }
  }

  return parts.join("\n");
}

/**
 * Extract and format sources from chunks
 */
export function extractSources(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "";
  }

  const uniqueSources = Array.from(
    new Map(chunks.map((c) => [c.fileName, c])).values()
  );

  const sourceLines = ["**Sources:**"];
  uniqueSources.forEach((chunk, idx) => {
    sourceLines.push(`${idx + 1}. ${chunk.fileName} (${chunk.courseName})`);
  });

  return sourceLines.join("\n");
}

/**
 * Hybrid search: combine vector search with keyword search
 */
export async function hybridSearch(
  query: string,
  courseId: string,
  subjectId?: string,
  options?: {
    limit?: number;
    vectorWeight?: number;
    keywordWeight?: number;
  }
): Promise<RetrievedChunk[]> {
  const vectorWeight = options?.vectorWeight ?? 0.7;
  const keywordWeight = options?.keywordWeight ?? 0.3;
  const limit = options?.limit ?? 10;

  // Vector search
  const vectorResults = await searchKnowledgeBase(query, courseId, subjectId, {
    limit: limit * 2, // Get more results to blend
  });

  // Simple keyword search (could be enhanced)
  const allChunks = vectorResults;

  // Score by query term matches
  const queryTerms = query.toLowerCase().split(/\s+/);
  const scoredChunks = allChunks.map((chunk) => {
    const keywordScore =
      queryTerms.filter((term) =>
        chunk.content.toLowerCase().includes(term)
      ).length / queryTerms.length;

    return {
      ...chunk,
      similarity:
        chunk.similarity * vectorWeight + keywordScore * keywordWeight,
    };
  });

  // Sort and limit
  return scoredChunks.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}
