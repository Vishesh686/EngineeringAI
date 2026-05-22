import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin, getUserFromBearer } from "@/lib/server/supabase-admin";
import { validatePDFFile, extractPDFMetadata } from "@/lib/pdf-processor";
import {
  updateFileStatus,
  queueChunksForEmbedding,
  recordFileUploadAudit,
} from "@/lib/server/gemini-admin";

export const Route = createFileRoute("/api/admin/upload-file")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const auth = await getUserFromBearer(authHeader);
        if (!auth) {
          return new Response("Unauthorized", { status: 401 });
        }

        const supabase = getSupabaseAdmin();

        // Check if user is admin
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", auth.user.id)
          .eq("role", "admin")
          .single();

        if (!userRole) {
          return new Response("Forbidden: Admin access required", {
            status: 403,
          });
        }

        try {
          // Parse multipart form data
          const formData = await request.formData();
          const file = formData.get("file") as File;
          const courseId = formData.get("courseId") as string;
          const subjectId = formData.get("subjectId") as string | null;
          const fileType = (formData.get("fileType") as string) || "pdf";
          const title = (formData.get("title") as string) || file.name;
          const semester = formData.get("semester")
            ? parseInt(formData.get("semester") as string)
            : null;
          const tags = formData.get("tags")
            ? (formData.get("tags") as string).split(",").map((t) => t.trim())
            : [];

          // Validate file
          if (!file) {
            return new Response("No file provided", { status: 400 });
          }

          const validation = validatePDFFile(file);
          if (!validation.valid) {
            return new Response(validation.error, { status: 400 });
          }

          // Validate course exists
          const { data: course } = await supabase
            .from("courses")
            .select("id")
            .eq("id", courseId)
            .single();

          if (!course) {
            return new Response("Course not found", { status: 404 });
          }

          // Validate subject exists if provided
          if (subjectId) {
            const { data: subject } = await supabase
              .from("subjects")
              .select("id")
              .eq("id", subjectId)
              .eq("course_id", courseId)
              .single();

            if (!subject) {
              return new Response("Subject not found or not in this course", {
                status: 404,
              });
            }
          }

          // Upload file to Supabase Storage
          const timestamp = Date.now();
          const fileName = `${timestamp}-${file.name}`;
          const storagePath = `courses/${courseId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("uploaded-pdfs")
            .upload(storagePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return new Response("Failed to upload file to storage", {
              status: 500,
            });
          }

          // Create database record
          const { data: uploadedFile, error: dbError } = await supabase
            .from("uploaded_files")
            .insert({
              course_id: courseId,
              subject_id: subjectId,
              file_name: file.name,
              file_type: fileType,
              file_path: storagePath,
              file_size: file.size,
              title,
              semester,
              tags,
              status: "pending",
              uploaded_by: auth.user.id,
            })
            .select()
            .single();

          if (dbError) {
            // Try to clean up storage upload
            await supabase.storage
              .from("uploaded-pdfs")
              .remove([storagePath]);

            console.error("Database error:", dbError);
            return new Response("Failed to create file record", {
              status: 500,
            });
          }

          // Record audit log
          await recordFileUploadAudit(uploadedFile.id, auth.user.id, "UPLOAD", {
            fileName: file.name,
            fileSize: file.size,
            courseId,
          });

          // Queue for processing (extract → chunk → embed)
          const { error: queueError } = await supabase
            .from("ingestion_queue")
            .insert([
              {
                uploaded_file_id: uploadedFile.id,
                task_type: "extract_text",
                status: "pending",
                priority: 0,
              },
            ]);

          if (queueError) {
            console.error("Queue error:", queueError);
          }

          return new Response(
            JSON.stringify({
              success: true,
              fileId: uploadedFile.id,
              status: uploadedFile.status,
              message: "File uploaded successfully. Processing will begin shortly.",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error("Upload error:", errorMsg);
          return new Response(
            JSON.stringify({ error: "Upload failed: " + errorMsg }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },

      // GET: List uploaded files
      GET: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const auth = await getUserFromBearer(authHeader);
        if (!auth) {
          return new Response("Unauthorized", { status: 401 });
        }

        const supabase = getSupabaseAdmin();

        // Check admin
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", auth.user.id)
          .eq("role", "admin")
          .single();

        if (!userRole) {
          return new Response("Forbidden: Admin access required", {
            status: 403,
          });
        }

        try {
          const url = new URL(request.url);
          const courseId = url.searchParams.get("courseId");
          const status = url.searchParams.get("status");

          let query = supabase
            .from("uploaded_files")
            .select("*, courses(name), subjects(name)")
            .order("created_at", { ascending: false });

          if (courseId) {
            query = query.eq("course_id", courseId);
          }

          if (status) {
            query = query.eq("status", status);
          }

          const { data, error } = await query;

          if (error) {
            return new Response("Failed to fetch files", { status: 500 });
          }

          return new Response(JSON.stringify({ files: data }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          return new Response(
            JSON.stringify({ error: "Failed to list files: " + errorMsg }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },

      // DELETE: Remove file
      DELETE: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const auth = await getUserFromBearer(authHeader);
        if (!auth) {
          return new Response("Unauthorized", { status: 401 });
        }

        const supabase = getSupabaseAdmin();

        // Check admin
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", auth.user.id)
          .eq("role", "admin")
          .single();

        if (!userRole) {
          return new Response("Forbidden: Admin access required", {
            status: 403,
          });
        }

        try {
          const { fileId } = (await request.json()) as { fileId: string };

          // Get file details
          const { data: file, error: fileError } = await supabase
            .from("uploaded_files")
            .select("*")
            .eq("id", fileId)
            .single();

          if (fileError || !file) {
            return new Response("File not found", { status: 404 });
          }

          // Delete from storage
          if (file.file_path) {
            await supabase.storage
              .from("uploaded-pdfs")
              .remove([file.file_path]);
          }

          // Delete from database (cascades to chunks, embeddings)
          const { error: deleteError } = await supabase
            .from("uploaded_files")
            .delete()
            .eq("id", fileId);

          if (deleteError) {
            return new Response("Failed to delete file", { status: 500 });
          }

          // Record audit
          await recordFileUploadAudit(fileId, auth.user.id, "DELETE", {
            fileName: file.file_name,
          });

          return new Response(
            JSON.stringify({ success: true, message: "File deleted" }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          return new Response(
            JSON.stringify({ error: "Delete failed: " + errorMsg }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
