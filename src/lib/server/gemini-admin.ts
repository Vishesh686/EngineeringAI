import "server-only";

import { getSupabaseAdmin } from "./supabase-admin";

/**
 * Initialize course and subject structure
 */
export async function initializeCourses(): Promise<void> {
  const supabase = getSupabaseAdmin();

  const branches = [
    {
      name: "mechanical",
      displayName: "Mechanical Engineering",
      color: "#FF6B35",
      icon: "⚙️",
    },
    {
      name: "aerospace",
      displayName: "Aerospace Engineering",
      color: "#004E89",
      icon: "✈️",
    },
    {
      name: "civil",
      displayName: "Civil Engineering",
      color: "#8B4513",
      icon: "🏗️",
    },
    {
      name: "chemical",
      displayName: "Chemical Engineering",
      color: "#FFB703",
      icon: "⚗️",
    },
    {
      name: "cse",
      displayName: "Computer Science & Engineering",
      color: "#1F77E1",
      icon: "💻",
    },
    {
      name: "ece",
      displayName: "Electronics & Communication",
      color: "#FF006E",
      icon: "📡",
    },
    {
      name: "biotechnology",
      displayName: "Biotechnology",
      color: "#06A77D",
      icon: "🧬",
    },
  ];

  for (const branch of branches) {
    const { error } = await supabase
      .from("courses")
      .upsert(
        {
          name: branch.name,
          display_name: branch.displayName,
          color: branch.color,
          icon: branch.icon,
        },
        { onConflict: "name" }
      );

    if (error) {
      console.error(`Failed to upsert course ${branch.name}:`, error);
    }
  }
}

/**
 * Create subjects for a course
 */
export async function createSubjects(
  courseName: string,
  subjects: Array<{ name: string; displayName: string; semester?: number }>
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Get course ID
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("name", courseName)
    .single();

  if (!course) {
    throw new Error(`Course ${courseName} not found`);
  }

  for (const subject of subjects) {
    const { error } = await supabase.from("subjects").insert({
      course_id: course.id,
      name: subject.name,
      display_name: subject.displayName,
      semester: subject.semester,
    });

    if (error && !error.message.includes("duplicate")) {
      console.error(`Failed to create subject ${subject.name}:`, error);
    }
  }
}

/**
 * Update file processing status
 */
export async function updateFileStatus(
  fileId: string,
  status: "pending" | "processing" | "completed" | "failed",
  errorMessage?: string
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabase
    .from("uploaded_files")
    .update(updateData)
    .eq("id", fileId);

  if (error) {
    console.error(`Failed to update file status:`, error);
  }
}

/**
 * Add chunks to ingestion queue
 */
export async function queueChunksForEmbedding(
  fileId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Get chunks for this file
  const { data: chunks, error: chunksError } = await supabase
    .from("knowledge_chunks")
    .select("id")
    .eq("uploaded_file_id", fileId);

  if (chunksError || !chunks) {
    throw new Error(`Failed to fetch chunks: ${chunksError?.message}`);
  }

  // Create queue entries
  const queueEntries = chunks.map((chunk) => ({
    uploaded_file_id: fileId,
    task_type: "embed",
    status: "pending",
    priority: 0,
  }));

  if (queueEntries.length > 0) {
    const { error } = await supabase
      .from("ingestion_queue")
      .insert(queueEntries);

    if (error) {
      throw new Error(`Failed to queue chunks: ${error.message}`);
    }
  }
}

/**
 * Get pending ingestion tasks
 */
export async function getPendingTasks(
  limit: number = 10
): Promise<
  Array<{
    id: string;
    fileId: string;
    taskType: string;
    attemptCount: number;
  }>
> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("ingestion_queue")
    .select("id, uploaded_file_id, task_type, attempt_count")
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch pending tasks:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    fileId: row.uploaded_file_id,
    taskType: row.task_type,
    attemptCount: row.attempt_count,
  }));
}

/**
 * Record file upload audit
 */
export async function recordFileUploadAudit(
  fileId: string,
  userId: string,
  action: string,
  metadata?: any
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Could create an audit_logs table in the future
  console.log(`[AUDIT] ${action} - File: ${fileId}, User: ${userId}`, metadata);
}

/**
 * Get file processing statistics
 */
export async function getFileProcessingStats(): Promise<{
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}> {
  const supabase = getSupabaseAdmin();

  const { data: allFiles } = await supabase
    .from("uploaded_files")
    .select("status", { count: "exact" });

  const stats = {
    total: allFiles?.length || 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  allFiles?.forEach((file: any) => {
    if (file.status === "pending") stats.pending++;
    else if (file.status === "processing") stats.processing++;
    else if (file.status === "completed") stats.completed++;
    else if (file.status === "failed") stats.failed++;
  });

  return stats;
}

/**
 * Get admin dashboard statistics
 */
export async function getDashboardStats(): Promise<{
  totalFiles: number;
  totalChunks: number;
  totalEmbeddings: number;
  failedFiles: number;
  pendingTasks: number;
}> {
  const supabase = getSupabaseAdmin();

  const [filesResult, chunksResult, embeddingsResult, tasksResult] =
    await Promise.all([
      supabase
        .from("uploaded_files")
        .select("id", { count: "exact" }),
      supabase
        .from("knowledge_chunks")
        .select("id", { count: "exact" }),
      supabase
        .from("embeddings")
        .select("id", { count: "exact" }),
      supabase
        .from("ingestion_queue")
        .select("id", { count: "exact" })
        .eq("status", "pending"),
    ]);

  const failedFilesResult = await supabase
    .from("uploaded_files")
    .select("id", { count: "exact" })
    .eq("status", "failed");

  return {
    totalFiles: filesResult.count || 0,
    totalChunks: chunksResult.count || 0,
    totalEmbeddings: embeddingsResult.count || 0,
    failedFiles: failedFilesResult.count || 0,
    pendingTasks: tasksResult.count || 0,
  };
}
