import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RefreshCw, Download, Calendar } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";

export type ConsolePageProps = {
  title: string;
  eyebrow?: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function ConsolePage({ title, eyebrow, description, actions, children }: ConsolePageProps) {
  return (
    <div>
      <PageHeader
        eyebrow={eyebrow ?? "Search Console · Phase 1"}
        title={title}
        description={description}
        actions={
          <>
            {actions}
            <Button variant="outline" className="rounded-xl h-10">
              <RefreshCw className="size-4" /> Sync now
            </Button>
            <Button className="rounded-xl h-10 gradient-primary text-white border-0 shadow-[var(--shadow-glow)]">
              <Download className="size-4" /> Export
            </Button>
          </>
        }
      />
      {children}
    </div>
  );
}

export function ConsoleFilters({ defaultRange = "28d" }: { defaultRange?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 mb-6"
    >
      <div className="relative">
        <Calendar className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input defaultValue={`Last ${defaultRange}`} className="pl-9 rounded-xl h-10 w-[180px]" />
      </div>
      {["7d", "28d", "3m", "12m", "Compare"].map((t, i) => (
        <button
          key={t}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
            i === 1
              ? "bg-card border-primary/40 text-foreground"
              : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          {t}
        </button>
      ))}
      <select className="px-3 py-1.5 rounded-xl text-xs border border-border bg-card">
        <option>All countries</option>
        <option>United States</option>
        <option>India</option>
        <option>United Kingdom</option>
      </select>
      <select className="px-3 py-1.5 rounded-xl text-xs border border-border bg-card">
        <option>All devices</option>
        <option>Desktop</option>
        <option>Mobile</option>
        <option>Tablet</option>
      </select>
      <Input placeholder="Filter by query, page…" className="rounded-xl h-10 flex-1 min-w-[180px]" />
    </motion.div>
  );
}

export function ConsoleTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: { cells: (string | ReactNode)[]; status?: string }[];
}) {
  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-widest text-muted-foreground sticky top-0 z-10">
            <tr>
              {columns.map((c, i) => (
                <th key={i} className="text-left px-4 py-3 font-medium">
                  {c}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-muted/30 transition">
                {r.cells.map((c, j) => (
                  <td key={j} className={j === 0 ? "px-4 py-3 font-medium" : "px-4 py-3 text-muted-foreground"}>
                    {c}
                  </td>
                ))}
                {r.status && (
                  <td className="px-4 py-3 text-right">
                    <StatusBadge status={r.status} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TrendChart({ data, label }: { data: { d: string; v: number }[]; label: string }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Area type="monotone" dataKey="v" stroke="var(--color-primary)" fill={`url(#grad-${label})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarCompare({
  data,
}: {
  data: { name: string; a: number; b: number }[];
}) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Bar dataKey="a" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="b" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineCompare({ data }: { data: { d: string; a: number; b: number }[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Line type="monotone" dataKey="a" stroke="var(--color-primary)" strokeWidth={2.4} dot={false} />
          <Line type="monotone" dataKey="b" stroke="var(--color-accent)" strokeWidth={2.4} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}