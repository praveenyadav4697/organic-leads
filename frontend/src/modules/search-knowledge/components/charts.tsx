import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import type { SearchTrend, Topic, Keyword, IntentDistribution } from "@/modules/search-knowledge/types";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))",
];

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg text-xs">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="flex items-center gap-2">
            <span className="size-2 rounded-full shrink-0" style={{ background: entry.color }} />
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function KnowledgeGrowthChart({ data }: { data: SearchTrend[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="grad-growth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="volume" stroke="hsl(var(--primary))" fill="url(#grad-growth)" strokeWidth={2} name="Volume" />
          <Area type="monotone" dataKey="growth" stroke="hsl(var(--accent))" fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="Growth" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopicDistributionChart({ data }: { data: Topic[] }) {
  const chartData = data.slice(0, 10).map((t) => ({ name: t.name, count: t.articles }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EntityCategoriesChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KeywordIntentChart({ data }: { data: IntentDistribution }) {
  const chartData = [
    { name: "Informational", value: data.informational, fill: "hsl(var(--chart-1))" },
    { name: "Navigational", value: data.navigational, fill: "hsl(var(--chart-2))" },
    { name: "Commercial", value: data.commercial, fill: "hsl(var(--chart-3))" },
    { name: "Transactional", value: data.transactional, fill: "hsl(var(--chart-4))" },
    { name: "Question", value: data.questionBased, fill: "hsl(var(--chart-5))" },
  ];
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
          <Radar dataKey="value" name="Volume" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KeywordTrendChart({ data }: { data: Keyword[] }) {
  const chartData = data.slice(0, 20).map((k) => ({
    name: k.keyword.length > 20 ? k.keyword.slice(0, 20) + "…" : k.keyword,
    volume: k.volume,
    ranking: k.ranking,
  }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={60} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} yAxisId="left" />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} yAxisId="right" orientation="right" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} yAxisId="left" name="Volume" />
          <Bar dataKey="ranking" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} yAxisId="right" name="Ranking" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CoverageHeatmap({ data }: { data: { topic: string; coverage: number }[] }) {
  const maxCoverage = Math.max(...data.map((d) => d.coverage), 1);
  return (
    <div className="space-y-2">
      {data.slice(0, 12).map((item) => (
        <div key={item.topic} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-32 truncate">{item.topic}</span>
          <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.coverage / maxCoverage) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                item.coverage >= 80 ? "bg-success" : item.coverage >= 50 ? "bg-warning" : "bg-destructive",
              )}
            />
          </div>
          <span className="text-xs font-medium w-10 text-right">{item.coverage}%</span>
        </div>
      ))}
    </div>
  );
}