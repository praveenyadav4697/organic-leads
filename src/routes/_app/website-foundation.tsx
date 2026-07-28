import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Play } from "lucide-react";
import { foundationSubNav } from "@/modules/website-foundation/nav";
import { FoundationSubNav } from "@/modules/website-foundation/components/foundation-subnav";

export const Route = createFileRoute("/_app/website-foundation")({
  head: () => ({ meta: [{ title: "Website Foundation — Nebula" }] }),
  component: WebsiteFoundationLayout,
});

function WebsiteFoundationLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isIndex = pathname === "/website-foundation" || pathname === "/website-foundation/";
  const resolveActive = (it: { to: string }) => isIndex ? it.to === "/website-foundation/overview" : pathname.startsWith(it.to);

  return (
    <div>
      <PageHeader
        eyebrow="Section 1"
        title="Website Foundation"
        description="Register, monitor, and audit every property in your digital footprint from one enterprise control center."
        actions={
          <>
            <Button variant="outline" className="rounded-xl h-10">
              <Play className="size-4" /> Run audit
            </Button>
            <Button className="rounded-xl h-10 gradient-primary text-white border-0 shadow-[var(--shadow-glow)]">
              <Plus className="size-4" /> Add website
            </Button>
          </>
        }
      />
      <FoundationSubNav
        items={foundationSubNav}
        activePath={pathname}
        resolveActive={resolveActive}
        brandLabel="Website Foundation"
      />
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
