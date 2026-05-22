import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin, getUserFromBearer } from "@/lib/server/supabase-admin";
import { ENGINEERING_BRANCHES } from "@/lib/engineering";

async function ensureAdmin(authHeader: string | null) {
  const auth = await getUserFromBearer(authHeader);
  if (!auth) return { error: new Response("Unauthorized", { status: 401 }) };
  const supabase = getSupabaseAdmin();
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) return { error: new Response("Forbidden", { status: 403 }) };
  return { auth, supabase };
}

export const Route = createFileRoute("/api/admin/content")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const verified = await ensureAdmin(request.headers.get("authorization"));
        if ("error" in verified) return verified.error;
        const { supabase } = verified;

        const [subjects, knowledge] = await Promise.all([
          supabase.from("branch_subjects").select("id,branch_id,subject_id,branches(name),subjects(name)").limit(2000),
          supabase.from("course_knowledge_base").select("id,branch_name,subject_name,content_type,title,content,source_url,created_at").order("created_at", { ascending: false }).limit(400),
        ]);

        if (subjects.error) return new Response(subjects.error.message, { status: 500 });
        if (knowledge.error) return new Response(knowledge.error.message, { status: 500 });

        const mappedSubjects = (subjects.data ?? []).map((row: any) => ({
          id: row.id,
          branch: row.branches?.name ?? "Unknown",
          subject: row.subjects?.name ?? "Unknown",
        }));

        return Response.json({
          branches: ENGINEERING_BRANCHES,
          branchSubjects: mappedSubjects,
          knowledge: knowledge.data ?? [],
        });
      },

      POST: async ({ request }) => {
        const verified = await ensureAdmin(request.headers.get("authorization"));
        if ("error" in verified) return verified.error;
        const { auth, supabase } = verified;
        const body = (await request.json()) as
          | { action: "add_subject"; branch: string; subject: string }
          | { action: "add_knowledge"; branch: string; subject: string; contentType: string; title: string; content: string; sourceUrl?: string };

        if (body.action === "add_subject") {
          if (!body.branch?.trim() || !body.subject?.trim()) return new Response("Branch and subject required", { status: 400 });

          const { data: branchRow, error: branchErr } = await supabase
            .from("branches")
            .upsert({ name: body.branch.trim() }, { onConflict: "name" })
            .select("id")
            .single();
          if (branchErr) return new Response(branchErr.message, { status: 500 });

          const { data: subjectRow, error: subjectErr } = await supabase
            .from("subjects")
            .upsert({ name: body.subject.trim(), category: "btech" }, { onConflict: "name,category" })
            .select("id")
            .single();
          if (subjectErr) return new Response(subjectErr.message, { status: 500 });

          const { error: mapErr } = await supabase.from("branch_subjects").upsert({
            branch_id: branchRow.id,
            subject_id: subjectRow.id,
          }, { onConflict: "branch_id,subject_id" });
          if (mapErr) return new Response(mapErr.message, { status: 500 });
          return Response.json({ ok: true });
        }

        if (body.action === "add_knowledge") {
          if (!body.branch?.trim() || !body.subject?.trim() || !body.title?.trim() || !body.content?.trim()) {
            return new Response("Missing required fields", { status: 400 });
          }
          const { error } = await supabase.from("course_knowledge_base").insert({
            branch_name: body.branch.trim(),
            subject_name: body.subject.trim(),
            content_type: (body.contentType || "details").trim(),
            title: body.title.trim(),
            content: body.content.trim(),
            source_url: body.sourceUrl?.trim() || null,
            created_by: auth.user.id,
          });
          if (error) return new Response(error.message, { status: 500 });
          return Response.json({ ok: true });
        }

        return new Response("Invalid action", { status: 400 });
      },
    },
  },
});
