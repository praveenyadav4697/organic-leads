import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/search-knowledge")({
  component: SearchKnowledgeLayout,
});

function SearchKnowledgeLayout() {
  return <Outlet />;
}