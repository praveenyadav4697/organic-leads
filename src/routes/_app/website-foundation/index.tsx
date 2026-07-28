import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/website-foundation/")({
  beforeLoad: () => {
    throw redirect({ to: "/website-foundation/overview" });
  },
});
