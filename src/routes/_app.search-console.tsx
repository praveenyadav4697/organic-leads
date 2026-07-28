import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/search-console")({
  component: SearchConsoleLayout,
});

function SearchConsoleLayout() {
  return <Outlet />;
}