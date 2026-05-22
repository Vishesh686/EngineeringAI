import { supabase } from "@/integrations/supabase/client";

/** True when the user finished onboarding (branch saved on profile). */
export function hasCompletedOnboarding(
  engineeringDomain: string | null | undefined,
): boolean {
  return Boolean(engineeringDomain?.trim());
}

/** Where to send a signed-in user: onboarding for new users, chat for returning users. */
export async function resolveAuthenticatedPath(): Promise<
  "/app/onboarding" | "/app/chat"
> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return "/app/chat";

  const { data: profile } = await supabase
    .from("profiles")
    .select("engineering_domain")
    .eq("id", session.user.id)
    .maybeSingle();

  return hasCompletedOnboarding(profile?.engineering_domain)
    ? "/app/chat"
    : "/app/onboarding";
}
