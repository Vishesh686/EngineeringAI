const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

export async function embedText(input: string): Promise<number[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");

  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: OPENAI_EMBEDDING_MODEL, input }),
  });

  if (!resp.ok) {
    throw new Error(`Embedding API failed: ${resp.status} ${await resp.text()}`);
  }

  const json = (await resp.json()) as { data?: Array<{ embedding: number[] }> };
  const embedding = json.data?.[0]?.embedding;
  if (!embedding) throw new Error("Embedding missing from response");
  return embedding;
}

export function chunkText(text: string, maxChars = 1800, overlap = 220): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(start + maxChars, normalized.length);
    if (end < normalized.length) {
      const softBreak = normalized.lastIndexOf("\n", end);
      if (softBreak > start + 500) end = softBreak;
    }
    const piece = normalized.slice(start, end).trim();
    if (piece) chunks.push(piece);
    start = Math.max(end - overlap, end);
  }

  return chunks;
}
