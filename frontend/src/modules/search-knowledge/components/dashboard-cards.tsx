import { motion } from "framer-motion";
import {
  Target,
  BookOpen,
  Brain,
  Eye,
  Sparkles,
  Layers,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { StatCard } from "@/modules/search-knowledge/components/stat-cards";
import type { KnowledgeOverview } from "@/modules/search-knowledge/types";

interface DashboardCardsProps {
  data: KnowledgeOverview;
  isLoading: boolean;
}

export function DashboardCards({ data, isLoading }: DashboardCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <div className="h-3 w-24 bg-muted rounded mb-3" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Entities",
      value: data.totalEntities,
      icon: Target,
      hint: "Discovered entities",
      intent: "primary" as const,
    },
    {
      label: "Indexed Topics",
      value: data.indexedTopics,
      icon: BookOpen,
      hint: "Active topics",
      intent: "primary" as const,
    },
    {
      label: "Semantic Score",
      value: data.semanticScore,
      unit: "%",
      icon: Brain,
      hint: "Content understanding",
      intent: "success" as const,
    },
    {
      label: "Search Visibility",
      value: data.searchVisibility,
      unit: "%",
      icon: Eye,
      hint: "SERP visibility",
      intent: "primary" as const,
    },
    {
      label: "AI Confidence",
      value: data.aiConfidence,
      unit: "%",
      icon: Sparkles,
      hint: "AI analysis confidence",
      intent: "info" as const,
    },
    {
      label: "Knowledge Coverage",
      value: data.knowledgeCoverage,
      unit: "%",
      icon: Layers,
      hint: "Topic coverage",
      intent: "success" as const,
    },
    {
      label: "Missing Entities",
      value: data.missingEntities,
      icon: AlertTriangle,
      hint: "Entities to discover",
      intent: data.missingEntities > 0 ? "warning" as const : "success" as const,
    },
    {
      label: "Last Scan",
      value: data.lastScan ? new Date(data.lastScan).toLocaleDateString() : "N/A",
      icon: Clock,
      hint: data.knowledgeGrowth !== undefined ? `${data.knowledgeGrowth > 0 ? "+" : ""}${data.knowledgeGrowth}% growth` : undefined,
      intent: "primary" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
        >
          <StatCard {...card} />
        </motion.div>
      ))}
    </div>
  );
}