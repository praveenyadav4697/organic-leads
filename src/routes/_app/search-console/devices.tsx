import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { ConsolePage, ConsoleFilters } from "@/components/search-console-page";

export const Route = createFileRoute("/_app/search-console/devices")({
  head: () => ({ meta: [{ title: "Devices — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage title="Devices" description="Performance breakdown across desktop, mobile, and tablet.">
      <ConsoleFilters />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-3">Clicks by device</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { d: "Desktop", c: 9420, i: 184000 },
              { d: "Mobile", c: 13210, i: 264000 },
              { d: "Tablet", c: 2200, i: 34600 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="c" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="i" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ConsolePage>
  );
}