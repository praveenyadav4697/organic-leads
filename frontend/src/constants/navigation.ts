import {
  type LucideIcon,
  LayoutDashboard,
  Globe,
  Radar,
  BookOpen,
  Chrome,
  Gauge,
  Smartphone,
  FileText,
  FileBarChart,
  Settings,
} from "lucide-react";

export type NavChildren = {
  title: string;
  to: string;
  badge?: string;
};

export type NavItem = {
  title: string;
  icon?: LucideIcon;
  to?: string;
  badge?: string;
  isSection?: boolean;
  children?: NavChildren[];
};

export const navigation: NavItem[] = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard },
  {
    title: "Phase 1",
    isSection: true,
    children: [
      { title: "Website Foundation", to: "/website-foundation", badge: "Core" },
      { title: "Tracking & Forms", to: "/tracking" },
      { title: "Search Landscape", to: "/search-knowledge" },
      { title: "Google Search Console", to: "/search-console" },
      { title: "Business Intelligence", to: "/business-keyword-competitor" },
      { title: "On-Page SEO", to: "/onpage-seo" },
      { title: "Performance", to: "/performance" },
      { title: "SEO Audit", to: "/audit" },
      { title: "Mobile Readiness", to: "/mobile" },
      { title: "Google Products", to: "/google-products" },
    ],
  },
  { title: "Reports", to: "/reports", icon: FileBarChart },
  { title: "Integrations", to: "/settings", icon: Settings },
  { title: "Settings", to: "/settings", icon: Settings },
];
