import {
  LayoutDashboard,
  Globe,
  Building2,
  KeyRound,
  Users2,
  Search,
  Gauge,
  Smartphone,
  Radar,
  Chrome,
  FileBarChart,
  Settings,
  BookOpen,
  Brain,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
};

export const navItems: NavItem[] = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard },
  { title: "Website Foundation", to: "/website-foundation", icon: Globe },
  { title: "Business Profile", to: "/business-profile", icon: Building2 },
  { title: "Keyword Intelligence", to: "/keywords", icon: KeyRound, badge: "AI" },
  { title: "Competitor Analysis", to: "/competitors", icon: Users2 },
  { title: "SEO Analyzer", to: "/seo-analyzer", icon: Search },
  { title: "Performance", to: "/performance", icon: Gauge },
  { title: "Mobile Readiness", to: "/mobile", icon: Smartphone },
  { title: "Tracking Center", to: "/tracking", icon: Radar },
  { title: "Google Products", to: "/google-products", icon: Chrome },
  { title: "Search Console", to: "/search-console", icon: Search, badge: "New" },
  { title: "Search Knowledge", to: "/search-knowledge", icon: BookOpen, badge: "New" },
  { title: "Business Intelligence", to: "/business-keyword-competitor", icon: Brain },
  { title: "On-Page SEO", to: "/onpage-seo", icon: FileText },
  { title: "Reports", to: "/reports", icon: FileBarChart },
  { title: "Settings", to: "/settings", icon: Settings },
];
