// Server-side only PDF extraction utility
// This file should ONLY be imported on the server, never during SSR build

async function getPDFParser(): Promise<any> {
  // Use a variable to prevent static analysis from finding the import
  const moduleName = "pdf-parse";
  return import(moduleName);
}

export async function extractTextFromFile(
  name: string,
  mimeType: string | null,
  bytes: Uint8Array
): Promise<string> {
  // Only attempt PDF parsing for PDF files
  if ((mimeType || "").includes("pdf") || name.toLowerCase().endsWith(".pdf")) {
    try {
      // Dynamic import - only loads when actually needed at runtime
      // This prevents DOMMatrix errors during SSR/build phase
      const module = await getPDFParser();
      const { PDFParse } = module;
      const parser = new PDFParse({ data: Buffer.from(bytes) });
      const textResult = await parser.getText();
      await parser.destroy();
      return typeof textResult === "string" ? textResult : textResult.text;
    } catch (error) {
      console.error("PDF parsing failed:", error);
      // Fallback to treating as text file
      return Buffer.from(bytes).toString("utf-8");
    }
  }

  // For non-PDF files, decode as UTF-8 text
  return Buffer.from(bytes).toString("utf-8");
}
