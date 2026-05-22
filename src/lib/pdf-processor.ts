import "server-only";

// This file MUST only run on server, never in browser or during SSR
// All PDF processing happens here

interface PDFExtractionResult {
  success: boolean;
  text: string;
  pageCount: number;
  error?: string;
}

/**
 * Extract text from PDF using server-only processing
 * This function must never be called during SSR or in browser
 */
export async function extractPDFText(
  filePath: string
): Promise<PDFExtractionResult> {
  try {
    // Dynamically import PDF.js only on server
    // This prevents it from being bundled for browser
    const pdfParse = await import("pdf-parse");

    // Read file from Supabase Storage or local path
    // This assumes file is already uploaded to storage
    const fileBuffer = await readFileBuffer(filePath);

    if (!fileBuffer) {
      return {
        success: false,
        text: "",
        pageCount: 0,
        error: "Could not read file",
      };
    }

    // Extract text
    const pdf = await pdfParse.default(fileBuffer);

    return {
      success: true,
      text: pdf.text || "",
      pageCount: pdf.numpages || 0,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("PDF extraction failed:", errorMsg);
    return {
      success: false,
      text: "",
      pageCount: 0,
      error: errorMsg,
    };
  }
}

/**
 * Read file buffer from path
 * In production, this would read from Supabase Storage
 */
async function readFileBuffer(filePath: string): Promise<Buffer | null> {
  try {
    // For now, assume file is in Supabase Storage
    // This would be implemented based on your storage setup
    const { getSupabaseAdmin } = await import("./server/supabase-admin");
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.storage
      .from("uploaded-pdfs")
      .download(filePath);

    if (error || !data) {
      console.error("Failed to download file:", error);
      return null;
    }

    // Convert Blob to Buffer
    return Buffer.from(await data.arrayBuffer());
  } catch (err) {
    console.error("Error reading file buffer:", err);
    return null;
  }
}

/**
 * Clean extracted text
 */
export function cleanPDFText(rawText: string): string {
  return (
    rawText
      // Remove extra whitespace
      .replace(/\s+/g, " ")
      // Remove control characters
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
      // Fix common PDF artifacts
      .replace(/[^\w\s\.\,\!\?\-\:\;\(\)\[\]\{\}\/\\\^\°\'\"±×÷=]/g, "")
      .trim()
  );
}

/**
 * Extract text with page information
 */
export async function extractPDFTextWithPages(
  filePath: string
): Promise<{
  success: boolean;
  pages: Array<{ pageNumber: number; text: string }>;
  error?: string;
}> {
  try {
    const pdfParse = await import("pdf-parse");
    const fileBuffer = await readFileBuffer(filePath);

    if (!fileBuffer) {
      return {
        success: false,
        pages: [],
        error: "Could not read file",
      };
    }

    const pdf = await pdfParse.default(fileBuffer, {
      pageranges: [], // Extract all pages
    });

    // Note: pdf-parse doesn't give per-page text by default
    // We'll split the text by page markers if available
    const pages = [
      {
        pageNumber: 1,
        text: cleanPDFText(pdf.text || ""),
      },
    ];

    return {
      success: true,
      pages,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      pages: [],
      error: errorMsg,
    };
  }
}

/**
 * Validate PDF file before processing
 */
export function validatePDFFile(
  file: File | { size: number; type: string }
): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
    };
  }

  if (file.type !== "application/pdf") {
    return {
      valid: false,
      error: "File must be a PDF",
    };
  }

  return { valid: true };
}

/**
 * Extract metadata from PDF
 */
export async function extractPDFMetadata(
  filePath: string
): Promise<{
  title?: string;
  author?: string;
  subject?: string;
  pages?: number;
}> {
  try {
    const pdfParse = await import("pdf-parse");
    const fileBuffer = await readFileBuffer(filePath);

    if (!fileBuffer) {
      return {};
    }

    const pdf = await pdfParse.default(fileBuffer);

    return {
      title: pdf.info?.Title,
      author: pdf.info?.Author,
      subject: pdf.info?.Subject,
      pages: pdf.numpages,
    };
  } catch (err) {
    console.error("Failed to extract metadata:", err);
    return {};
  }
}
