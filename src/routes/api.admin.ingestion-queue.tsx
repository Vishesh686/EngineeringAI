import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin, getUserFromBearer } from "@/lib/server/supabase-admin";
import {
  getPendingTasks,
  getDashboardStats,
  getFileProcessingStats,
} from "@/lib/server/gemini-admin";

export const Route = createFileRoute("/api/admin/ingestion-queue")({
  server: {
    handlers: {
      // GET: Fetch queue status and statistics
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
          const view = url.searchParams.get("view") || "summary";

          if (view === "summary") {
            // Get summary statistics
            const [pendingTasks, stats] = await Promise.all([
              getPendingTasks(5),
              getDashboardStats(),
            ]);

            return new Response(
              JSON.stringify({
                summary: {
                  totalFiles: stats.totalFiles,
                  totalChunks: stats.totalChunks,
                  totalEmbeddings: stats.totalEmbeddings,
                  failedFiles: stats.failedFiles,
                  pendingTasks: stats.pendingTasks,
                },
                nextTasks: pendingTasks,
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          if (view === "queue") {
            // Get full queue details
            const limit = url.searchParams.get("limit")
              ? parseInt(url.searchParams.get("limit") as string)
              : 50;
            const status = url.searchParams.get("status");

            let query = supabase
              .from("ingestion_queue")
              .select(
                "*, uploaded_files(file_name, title, status, created_at)"
              )
              .order("priority", { ascending: false })
              .order("created_at", { ascending: true })
              .limit(limit);

            if (status) {
              query = query.eq("status", status);
            }

            const { data, error } = await query;

            if (error) {
              return new Response("Failed to fetch queue", { status: 500 });
            }

            return new Response(JSON.stringify({ queue: data }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (view === "file-stats") {
            // Get file processing statistics
            const stats = await getFileProcessingStats();

            return new Response(JSON.stringify(stats), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response("Invalid view parameter", { status: 400 });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          return new Response(
            JSON.stringify({
              error: "Failed to fetch ingestion status: " + errorMsg,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },

      // POST: Manually trigger processing for a task
      POST: async ({ request }) => {
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
          const { action, taskId, priority } = (await request.json()) as {
            action: "retry" | "reprioritize" | "cancel";
            taskId: string;
            priority?: number;
          };

          if (action === "retry") {
            // Reset task to pending for retry
            const { error } = await supabase
              .from("ingestion_queue")
              .update({
                status: "pending",
                attempt_count: 0,
                error_message: null,
                started_at: null,
                completed_at: null,
              })
              .eq("id", taskId);

            if (error) {
              return new Response("Failed to retry task", { status: 500 });
            }

            return new Response(
              JSON.stringify({
                success: true,
                message: "Task queued for retry",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          if (action === "reprioritize") {
            if (priority === undefined) {
              return new Response("Priority parameter required", {
                status: 400,
              });
            }

            const { error } = await supabase
              .from("ingestion_queue")
              .update({ priority })
              .eq("id", taskId);

            if (error) {
              return new Response("Failed to update priority", { status: 500 });
            }

            return new Response(
              JSON.stringify({
                success: true,
                message: "Task priority updated",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          if (action === "cancel") {
            // Mark task as failed
            const { error } = await supabase
              .from("ingestion_queue")
              .update({
                status: "failed",
                error_message: "Manually cancelled by admin",
              })
              .eq("id", taskId);

            if (error) {
              return new Response("Failed to cancel task", { status: 500 });
            }

            return new Response(
              JSON.stringify({
                success: true,
                message: "Task cancelled",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          return new Response("Invalid action", { status: 400 });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          return new Response(
            JSON.stringify({ error: "Action failed: " + errorMsg }),
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
