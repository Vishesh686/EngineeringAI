import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Initialize Gemini client (server-side only)
let geminiInstance: GoogleGenerativeAI | null = null;

function initializeGemini(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not set. Please configure it in your .env file."
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

// Lazy initialization - only create when needed
export function getGeminiInstance(): GoogleGenerativeAI {
  if (!geminiInstance) {
    geminiInstance = initializeGemini();
  }
  return geminiInstance;
}

// Get model instance with safety settings
export function getGeminiModel(modelName: string = "gemini-1.5-flash") {
  const client = getGeminiInstance();
  return client.getGenerativeModel({
    model: modelName,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });
}

// Helper for text generation
export async function generateText(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
  }
) {
  const model = getGeminiModel(options?.model);

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxOutputTokens ?? 2048,
    },
  });

  const response = result.response;
  return response.text();
}

// Helper for streaming text generation
export async function streamText(
  messages: Array<{ role: string; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    systemPrompt?: string;
  }
) {
  const model = getGeminiModel(options?.model);

  // Convert messages to Gemini format
  const contents = messages.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  // Add system prompt as first user message if provided
  if (options?.systemPrompt) {
    contents.unshift({
      role: "user",
      parts: [{ text: options.systemPrompt }],
    });
    contents.splice(1, 0, {
      role: "model",
      parts: [{ text: "I understand. I will follow these instructions." }],
    });
  }

  const stream = await model.generateContentStream({
    contents,
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxOutputTokens ?? 2048,
    },
  });

  return stream;
}

// Helper for embeddings (text-only, no images)
export async function generateEmbedding(text: string) {
  const client = getGeminiInstance();
  const embeddingModel = client.getGenerativeModel({
    model: "embedding-001",
  });

  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

// Batch embeddings with error handling
export async function generateEmbeddingsBatch(
  texts: string[],
  options?: { batchSize?: number }
) {
  const batchSize = options?.batchSize ?? 10;
  const embeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(generateEmbedding));
    embeddings.push(...batchResults);
  }

  return embeddings;
}

// Config validation for production
export function validateGeminiConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!process.env.GEMINI_API_KEY) {
    errors.push("GEMINI_API_KEY is not set");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
