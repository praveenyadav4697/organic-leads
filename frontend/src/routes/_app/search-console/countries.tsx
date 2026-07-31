import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { ConsolePage, ConsoleFilters } from "@/components/search-console-page";

export const Route = createFileRoute("/_app/search-console/countries")({
  head: () => ({ meta: [{ title: "Countries | Organic Leads" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage title="Countries" description="Geographic performance — clicks, impressions, CTR, and position.">
      <ConsoleFilters />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-3">Top 10 countries</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { c: "USA", v: 14200 },
              { c: "India", v: 6800 },
              { c: "UK", v: 3200 },
              { c: "Canada", v: 1800 },
              { c: "Germany", v: 1500 },
              { c: "Brazil", v: 1240 },
              { c: "Australia", v: 980 },
              { c: "France", v: 720 },
              { c: "Japan", v: 540 },
              { c: "Spain", v: 410 },
            ]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="c" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={70} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="v" fill="var(--color-primary)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ConsolePage>
  );
}