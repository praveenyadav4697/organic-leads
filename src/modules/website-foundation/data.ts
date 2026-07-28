import type { Website } from "./types";

export function websiteQuickStats(site: Website) {
  return {
    plugins: [
      { n: "Rank Math SEO", v: "v1.0.220", s: "good" as const },
      { n: "WP Rocket", v: "v3.16", s: "good" as const },
      { n: "Elementor Pro", v: "v3.24", s: "warn" as const },
      { n: "Wordfence", v: "v7.11", s: "good" as const },
      { n: "MonsterInsights", v: "v8.27", s: "good" as const },
    ],
    backups: [
      { date: "Today 03:00 UTC", size: "2.4 GB" },
      { date: "Yesterday 03:00 UTC", size: "2.3 GB" },
      { date: "2 days ago", size: "2.3 GB" },
      { date: "3 days ago", size: "2.2 GB" },
    ],
    deployments: [
      { v: "v3.12.0", t: "2h ago", a: "Ava Kepler", m: "Add CWV optimization" },
      { v: "v3.11.4", t: "1d ago", a: "Marcus Lane", m: "Hotfix: cookie banner" },
      { v: "v3.11.3", t: "3d ago", a: "CI", m: "Security patches" },
      { v: "v3.11.2", t: "5d ago", a: "Ivy Sun", m: "Refactor blog index" },
    ],
    audit: [
      { t: "SEO Audit · 87/100", s: "good" as const, when: "Today" },
      { t: "Performance · 92/100", s: "good" as const, when: "Today" },
      { t: "Security · A+", s: "good" as const, when: "Yesterday" },
      { t: "Accessibility · 92/100", s: "warn" as const, when: "2d ago" },
    ],
  };
}
