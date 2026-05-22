import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "./login";

export const Route = createFileRoute("/signup")({
  ssr: false,
  component: () => <AuthForm mode="signup" />,
  head: () => ({ meta: [{ title: "Sign up — Engineering AI" }] }),
});

