import {
  type LucideIcon,
  LayoutDashboard,
  FileBarChart,
  Settings,
  Globe,
  Radar,
  BookOpen,
  Chrome,
  Brain,
  FileText,
  Gauge,
  Search,
  Smartphone,
  SearchCheck,
} from "lucide-react";

export type NavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
};

export const navItems: NavItem[] = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard },
  { title: "Website Foundation", to: "/website-foundation", icon: Globe, badge: "Core" },
  { title: "Tracking & Forms", to: "/tracking-foundation", icon: Radar },
  { title: "Search Landscape", to: "/search-knowledge", icon: BookOpen },
  { title: "Google Search Console", to: "/search-console", icon: Search },
  { title: "Business Intelligence", to: "/business-keyword-competitor", icon: Brain },
  { title: "On-Page SEO", to: "/onpage-seo", icon: FileText },
  { title: "Performance", to: "/performance", icon: Gauge },
  { title: "SEO Audit", to: "/audit", icon: SearchCheck },
  { title: "Mobile Readiness", to: "/mobile", icon: Smartphone },
  { title: "Google Products", to: "/google-products", icon: Chrome },
  { title: "Reports", to: "/reports", icon: FileBarChart },
  { title: "Settings", to: "/settings", icon: Settings },
  { title: "Integrations", to: "/settings", icon: Settings },
];
