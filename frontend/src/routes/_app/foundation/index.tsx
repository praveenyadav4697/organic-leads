import { createFileRoute } from "@tanstack/react-router";
import FoundationPage from "@/pages/Foundation";

export const Route = createFileRoute("/_app/foundation/")({
  component: FoundationPage,
});