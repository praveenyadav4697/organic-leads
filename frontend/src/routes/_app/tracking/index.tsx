import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/tracking/")({
  head: () => ({ meta: [{ title: "Tracking Center | Organic Leads" }] }),
  component: () => {
    useEffect(() => {
      window.location.href = "/tracking-foundation";
    }, []);
    return null;
  },
});
