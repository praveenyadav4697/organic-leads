import {
  Gauge,
  Sparkles,
  Server,
  Palette,
  Layers,
  Plug,
  ImageIcon,
  FormInput,
  Monitor,
  Activity,
  ShieldCheck,
  LockKeyhole,
  Package,
  type LucideIcon,
} from "lucide-react";

export interface SubNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export const foundationSubNav: SubNavItem[] = [
  { to: "/website-foundation/overview", label: "Overview", icon: Gauge },
  { to: "/website-foundation/wizard", label: "Wizard", icon: Sparkles, badge: "New" },
  { to: "/website-foundation/wordpress", label: "WordPress", icon: Server },
  { to: "/website-foundation/themes", label: "Themes", icon: Palette },
  { to: "/website-foundation/plugins", label: "Plugins", icon: Plug },
  { to: "/website-foundation/brand", label: "Brand Assets", icon: ImageIcon },
  { to: "/website-foundation/forms", label: "Forms", icon: FormInput },
  { to: "/website-foundation/responsive", label: "Responsive", icon: Monitor },
  { to: "/website-foundation/performance", label: "Performance", icon: Activity },
  { to: "/website-foundation/ssl", label: "SSL & Hosting", icon: LockKeyhole },
  { to: "/website-foundation/inventory", label: "Inventory", icon: Package },
];
