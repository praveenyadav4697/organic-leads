import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Search,
  LayoutGrid,
  TrendingUp,
  History,
  Terminal,
  Compass,
  Star,
  PanelTop,
  Brain,
  HelpCircle,
  Image as ImageIcon,
  Video,
  MapPin,
  ShoppingBag,
  Newspaper,
  Bot,
  Mic,
  Sparkles as SparklesIcon,
} from "lucide-react";

export const Route = createFileRoute("/_app/search-knowledge/")({
  head: () => ({
    meta: [
      { title: "Search Knowledge — Nebula" },
      {
        name: "description",
        content:
          "Enterprise-grade reference for Google's search ecosystem — SERP layout, ranking factors, AI search, rich results, knowledge graph, and more.",
      },
    ],
  }),
  component: SearchKnowledgeOverview,
});

const topics = [
  { slug: "google-search-architecture", title: "Google Search Architecture", description: "Crawling, indexing, ranking, serving — the full pipeline.", icon: Search },
  { slug: "serp-layout", title: "SERP Layout", description: "How the results page is composed in 2026.", icon: LayoutGrid },
  { slug: "google-ranking-factors", title: "Google Ranking Factors", description: "Signals that move the needle — and the ones that don't.", icon: TrendingUp },
  { slug: "google-algorithm-updates", title: "Algorithm Updates", description: "Panda, Penguin, Helpful Content, Gemini — full timeline.", icon: History },
  { slug: "search-operators", title: "Search Operators", description: "Master 40+ operators for research and audit.", icon: Terminal },
  { slug: "search-intent", title: "Search Intent", description: "Informational, navigational, commercial, transactional.", icon: Compass },
  { slug: "rich-results", title: "Rich Results", description: "Schema-driven SERP features that win CTR.", icon: Star },
  { slug: "featured-snippets", title: "Featured Snippets", description: "Position zero — and how to capture it.", icon: PanelTop },
  { slug: "knowledge-graph", title: "Knowledge Graph", description: "Entities, panels, and brand authority.", icon: Brain },
  { slug: "people-also-ask", title: "People Also Ask", description: "Mine question graphs to dominate topics.", icon: HelpCircle },
  { slug: "image-search", title: "Image Search", description: "Visual SERP, Google Lens, and image SEO.", icon: ImageIcon },
  { slug: "video-search", title: "Video Search", description: "YouTube, Shorts, web video carousels.", icon: Video },
  { slug: "local-search", title: "Local Search", description: "Map pack, GBP, local intent signals.", icon: MapPin },
  { slug: "shopping-search", title: "Shopping Search", description: "Merchant Center, free listings, Shopping ads.", icon: ShoppingBag },
  { slug: "news-search", title: "News Search", description: "Top Stories, Discover, news SEO.", icon: Newspaper },
  { slug: "ai-search-overview", title: "AI Search Overview", description: "SGE, Gemini answers, AI Mode, citations.", icon: Bot },
  { slug: "voice-search", title: "Voice Search", description: "Conversational queries, position zero, schema.", icon: Mic },
  { slug: "future-trends", title: "Future Trends", description: "Multimodal, agents, and zero-click endgames.", icon: SparklesIcon },
];

function SearchKnowledgeOverview() {
  return (
    <div>
      <PageHeader
        eyebrow="Knowledge Base · Phase 1"
        title="Search Knowledge"
        description="The entire modern Google search universe — distilled, structured, and kept current by Nebula Copilot."
        actions={
          <Button className="rounded-xl h-10 gradient-primary text-white border-0 shadow-[var(--shadow-glow)]">
            <Sparkles className="size-4" /> Refresh with AI
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {topics.map((t, i) => (
          <motion.div
            key={t.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link
              to={`/search-knowledge/${t.slug}` as never}
              className="block rounded-2xl border border-border bg-card p-5 card-hover group"
            >
              <div className="flex items-start gap-3">
                <div className="size-11 rounded-xl gradient-primary grid place-items-center shrink-0 shadow-[var(--shadow-glow)]">
                  <t.icon className="size-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    {t.title}
                    <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.description}</div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/8 via-card to-accent/8 p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-9 rounded-xl gradient-primary grid place-items-center">
            <BookOpen className="size-4 text-white" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Curated by</div>
            <div className="text-sm font-semibold">Nebula Knowledge Engine</div>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground max-w-3xl">
          Every reference card below is generated from verified public sources, refreshed weekly, and cross-checked
          against the live SERP behavior we observe across 4M+ keywords. Use these pages as the canonical SEO
          knowledge base for your team, your AI agents, and your clients.
        </p>
      </div>
    </div>
  );
}