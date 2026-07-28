import { createFileRoute } from "@tanstack/react-router";
import { ConsolePage, ConsoleTable } from "@/components/search-console-page";

export const Route = createFileRoute("/_app/search-console/links")({
  head: () => ({ meta: [{ title: "Links Report — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage title="Links" description="Internal and external link distribution from Google's link graph.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { l: "External links", v: "12,408" },
          { l: "Internal links", v: "84,612" },
          { l: "Referring domains", v: "1,284" },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
            <div className="text-2xl font-semibold mt-2">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-3">Top external linked pages</div>
          <ConsoleTable
            columns={["Page", "Domains", "Backlinks"]}
            rows={[
              { cells: ["/ai-marketing-automation", "412", "2,180"] },
              { cells: ["/pricing", "184", "612"] },
              { cells: ["/enterprise-seo-platform", "302", "1,420"] },
              { cells: ["/blog/cwv-guide", "94", "412"] },
            ]}
          />
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-3">Top linking sites</div>
          <ConsoleTable
            columns={["Domain", "Links", "DA"]}
            rows={[
              { cells: ["techcrunch.com", "48", "93"] },
              { cells: ["searchengineland.com", "32", "88"] },
              { cells: ["moz.com", "24", "90"] },
              { cells: ["wired.com", "18", "92"] },
            ]}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-3">Top internal linked pages</div>
        <ConsoleTable
          columns={["Page", "Internal links", "Unique"]}
          rows={[
            { cells: ["/", "1,284", "1,284"] },
            { cells: ["/pricing", "284", "212"] },
            { cells: ["/blog", "198", "162"] },
            { cells: ["/contact", "84", "72"] },
          ]}
        />
      </div>
    </ConsolePage>
  );
}