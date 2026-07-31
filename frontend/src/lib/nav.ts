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
  { title: "F01 Website Foundation", to: "/website-foundation", icon: Globe, badge: "Core" },
  { title: "F02 Tracking & Forms", to: "/tracking", icon: Radar },
  { title: "F03 Search Landscape", to: "/search-knowledge", icon: BookOpen },
  { title: "F04 Google Search Console", to: "/search-console", icon: Search },
  { title: "F05 Business Intelligence", to: "/business-keyword-competitor", icon: Brain },
  { title: "F06 On-Page SEO", to: "/onpage-seo", icon: FileText },
  { title: "F07 Performance", to: "/performance", icon: Gauge },
  { title: "F08 SEO Audit", to: "/audit", icon: SearchCheck },
  { title: "F09 Mobile Readiness", to: "/mobile", icon: Smartphone },
  { title: "F10 Google Products", to: "/google-products", icon: Chrome },
  { title: "Reports", to: "/reports", icon: FileBarChart },
  { title: "Settings", to: "/settings", icon: Settings },
  { title: "Integrations", to: "/settings", icon: Settings },
];
