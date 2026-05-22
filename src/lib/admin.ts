import { supabase } from "@/integrations/supabase/client";

/** Returns true if the signed-in user has the admin role. */
export async function currentUserIsAdmin(): Promise<boolean> {
  const { data: rpcResult, error: rpcError } = await supabase.rpc("current_user_is_admin");
  if (!rpcError && rpcResult === true) return true;

  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return false;

  const { data: row, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("[admin] role check failed", error.message, { userId });
    return false;
  }

  return Boolean(row);
}
