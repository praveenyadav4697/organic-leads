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
      { title: "F01 Website Foundation", to: "/website-foundation", badge: "Core" },
      { title: "F02 Tracking & Forms", to: "/tracking" },
      { title: "F03 Search Landscape", to: "/search-knowledge" },
      { title: "F04 Google Search Console", to: "/search-console" },
      { title: "F05 Business Intelligence", to: "/business-keyword-competitor" },
      { title: "F06 On-Page SEO", to: "/onpage-seo" },
      { title: "F07 Performance", to: "/performance" },
      { title: "F08 SEO Audit", to: "/audit" },
      { title: "F09 Mobile Readiness", to: "/mobile" },
      { title: "F10 Google Products", to: "/google-products" },
    ],
  },
  { title: "Reports", to: "/reports", icon: FileBarChart },
  { title: "Integrations", to: "/settings", icon: Settings },
  { title: "Settings", to: "/settings", icon: Settings },
];
