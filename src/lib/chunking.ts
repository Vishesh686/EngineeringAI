/**
 * Intelligent text chunking system
 * Optimized for Gemini context window and engineering content
 */

export interface Chunk {
  index: number;
  content: string;
  startPosition: number;
  endPosition: number;
  tokenEstimate: number;
}

// Target chunk size optimized for Gemini
const CHUNK_SIZE_TARGET = 800; // tokens
const CHUNK_OVERLAP = 100; // tokens
const MIN_CHUNK_SIZE = 200; // tokens

/**
 * Estimate token count (rough approximation)
 * 1 token ≈ 4 characters for English
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text into chunks while preserving paragraph boundaries
 */
export function chunkText(
  text: string,
  options?: {
    chunkSize?: number;
    overlap?: number;
    preserveParagraphs?: boolean;
  }
): Chunk[] {
  const chunkSize = options?.chunkSize ?? CHUNK_SIZE_TARGET;
  const overlap = options?.overlap ?? CHUNK_OVERLAP;
  const preserveParagraphs = options?.preserveParagraphs ?? true;

  // Clean text
  let cleanedText = text
    .replace(/\s+/g, " ")
    .replace(/[\n\r]+/g, "\n")
    .trim();

  const chunks: Chunk[] = [];
  let currentIndex = 0;
  let chunkCount = 0;

  while (currentIndex < cleanedText.length) {
    const endIndex = Math.min(
      currentIndex + estimateTokensToChars(chunkSize),
      cleanedText.length
    );

    let chunkText = cleanedText.substring(currentIndex, endIndex);

    // Try to find a good break point (paragraph or sentence)
    if (preserveParagraphs && endIndex < cleanedText.length) {
      // Look for paragraph break
      const paragraphBreak = chunkText.lastIndexOf("\n\n");
      if (paragraphBreak > chunkSize * 0.7) {
        // 70% of target size
        chunkText = chunkText.substring(0, paragraphBreak);
      } else {
        // Look for sentence break
        const sentenceBreak = chunkText.lastIndexOf(". ");
        if (sentenceBreak > chunkSize * 0.6) {
          chunkText = chunkText.substring(0, sentenceBreak + 1);
        }
      }
    }

    // Trim chunk
    chunkText = chunkText.trim();

    // Only keep chunk if it meets minimum size
    if (estimateTokens(chunkText) >= MIN_CHUNK_SIZE) {
      chunks.push({
        index: chunkCount,
        content: chunkText,
        startPosition: currentIndex,
        endPosition: currentIndex + chunkText.length,
        tokenEstimate: estimateTokens(chunkText),
      });

      chunkCount++;
    }

    // Move to next chunk (with overlap)
    const overlapChars = estimateTokensToChars(overlap);
    const nextStart = currentIndex + chunkText.length - overlapChars;
    currentIndex = Math.max(nextStart, currentIndex + chunkText.length);

    if (currentIndex >= cleanedText.length) break;
  }

  return chunks;
}

/**
 * Split text by sections (headers)
 * Useful for structured documents
 */
export function chunkBySection(
  text: string,
  options?: {
    headerPatterns?: string[];
  }
): Chunk[] {
  const headerPatterns = options?.headerPatterns ?? [
    /^#+\s+/m, // Markdown headers
    /^[A-Z][A-Z\s]+$/m, // ALL CAPS headers
    /^\d+\.\s+/m, // Numbered sections
  ];

  const sections: Chunk[] = [];
  const lines = text.split("\n");
  let currentSection = "";
  let sectionStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeader = headerPatterns.some((pattern) => pattern.test(line));

    if (isHeader && currentSection.trim()) {
      // Save previous section
      sections.push({
        index: sections.length,
        content: currentSection.trim(),
        startPosition: sectionStart,
        endPosition: sectionStart + currentSection.length,
        tokenEstimate: estimateTokens(currentSection),
      });

      currentSection = line + "\n";
      sectionStart = text.indexOf(line);
    } else {
      currentSection += line + "\n";
    }
  }

  // Add final section
  if (currentSection.trim()) {
    sections.push({
      index: sections.length,
      content: currentSection.trim(),
      startPosition: sectionStart,
      endPosition: sectionStart + currentSection.length,
      tokenEstimate: estimateTokens(currentSection),
    });
  }

  // If sections are too large, split them
  const finalChunks: Chunk[] = [];
  let globalIndex = 0;

  for (const section of sections) {
    if (section.tokenEstimate > CHUNK_SIZE_TARGET * 1.5) {
      // Section too large, split it
      const subchunks = chunkText(section.content, {
        chunkSize: CHUNK_SIZE_TARGET,
        preserveParagraphs: true,
      });

      for (const subchunk of subchunks) {
        finalChunks.push({
          ...subchunk,
          index: globalIndex++,
        });
      }
    } else {
      finalChunks.push({
        ...section,
        index: globalIndex++,
      });
    }
  }

  return finalChunks;
}

/**
 * Chunk with awareness of mathematical content
 */
export function chunkWithMathPreservation(text: string): Chunk[] {
  // Split on math boundaries ($$...$$ or $...$)
  const mathRegex = /\$\$[\s\S]*?\$\$|\$[^\$]*?\$/g;
  const mathBlocks = text.match(mathRegex) || [];

  // Replace math blocks with placeholders
  let workingText = text;
  const placeholders: Record<string, string> = {};

  mathBlocks.forEach((block, idx) => {
    const placeholder = `__MATH_${idx}__`;
    placeholders[placeholder] = block;
    workingText = workingText.replace(block, placeholder);
  });

  // Chunk the text
  let chunks = chunkText(workingText);

  // Restore math blocks
  chunks = chunks.map((chunk) => {
    let restored = chunk.content;
    Object.entries(placeholders).forEach(([placeholder, block]) => {
      restored = restored.replace(placeholder, block);
    });

    return {
      ...chunk,
      content: restored,
      tokenEstimate: estimateTokens(restored),
    };
  });

  return chunks;
}

/**
 * Convert token estimate to character count
 */
function estimateTokensToChars(tokens: number): number {
  return tokens * 4; // Average 4 chars per token
}

/**
 * Merge small chunks with neighbors
 */
export function mergeSmallChunks(chunks: Chunk[]): Chunk[] {
  const merged: Chunk[] = [];
  let currentMerged = chunks[0];

  for (let i = 1; i < chunks.length; i++) {
    const nextChunk = chunks[i];
    const mergedTokens =
      currentMerged.tokenEstimate + nextChunk.tokenEstimate;

    if (mergedTokens <= CHUNK_SIZE_TARGET * 1.2) {
      // Merge
      currentMerged = {
        ...currentMerged,
        content: currentMerged.content + "\n\n" + nextChunk.content,
        endPosition: nextChunk.endPosition,
        tokenEstimate: mergedTokens,
      };
    } else {
      // Save current and start new
      merged.push(currentMerged);
      currentMerged = nextChunk;
    }
  }

  merged.push(currentMerged);

  // Re-index
  return merged.map((chunk, idx) => ({
    ...chunk,
    index: idx,
  }));
}

/**
 * Get chunk statistics
 */
export function getChunkStatistics(chunks: Chunk[]) {
  return {
    totalChunks: chunks.length,
    totalTokens: chunks.reduce((sum, c) => sum + c.tokenEstimate, 0),
    avgTokensPerChunk: Math.round(
      chunks.reduce((sum, c) => sum + c.tokenEstimate, 0) / chunks.length
    ),
    minTokens: Math.min(...chunks.map((c) => c.tokenEstimate)),
    maxTokens: Math.max(...chunks.map((c) => c.tokenEstimate)),
  };
}
