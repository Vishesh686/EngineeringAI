import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, File as FileIcon, Trash2, FolderOpen, Download, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/app/files")({
  component: FilesPage,
  head: () => ({ meta: [{ title: "Files — Engineering AI" }] }),
});

type Row = {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

function FilesPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<Row[]>([]);
  const [uploading, setUploading] = useState(false);
  const [indexingId, setIndexingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("uploaded_files")
      .select("*")
      .order("created_at", { ascending: false });
    setFiles((data ?? []) as Row[]);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("uploads").upload(path, file);
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("uploaded_files").insert({
        user_id: user.id,
        name: file.name,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (dbErr) throw dbErr;
      toast.success("Uploaded");
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const onDelete = async (row: Row) => {
    await supabase.storage.from("uploads").remove([row.storage_path]);
    await supabase.from("uploaded_files").delete().eq("id", row.id);
    load();
  };

  const onDownload = async (row: Row) => {
    const { data, error } = await supabase.storage.from("uploads").createSignedUrl(row.storage_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  const onIndex = async (row: Row) => {
    setIndexingId(row.id);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch("/api/rag/index-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ fileId: row.id }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const json = await resp.json();
      toast.success(`Indexed ${json.chunks} chunks`);
    } catch (e: any) {
      toast.error(e.message ?? "Indexing failed");
    } finally {
      setIndexingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
          <FolderOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold">Files</h1>
          <p className="text-sm text-muted-foreground">Upload PDFs, CAD exports, datasheets, simulation results.</p>
        </div>
        <label>
          <Input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
          <Button asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
            <span><Upload className="mr-2 h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}</span>
          </Button>
        </label>
      </div>

      {files.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            <FolderOpen className="mx-auto mb-3 h-10 w-10 opacity-50" />
            No files yet. Upload your first document to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {files.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <FileIcon className="h-5 w-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{f.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {f.mime_type || "file"} · {f.size_bytes ? (f.size_bytes / 1024).toFixed(1) + " KB" : ""} · {new Date(f.created_at).toLocaleString()}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onDownload(f)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onIndex(f)} disabled={indexingId === f.id}>
                  <Brain className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(f)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

