import { createFileRoute } from "@tanstack/react-router";
import { Terminal } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/search-operators")({
  head: () => ({ meta: [{ title: "Search Operators | Organic Leads" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="Search Operators"
      description="Master the operators that turn Google into the most powerful SEO research tool you own."
      summary="Search operators are special characters and prefixes that filter results in real time. Combine them to find guest post opportunities, audit indexation, mine competitor content, and discover technical issues — all without paid tools."
      sections={[
        {
          kind: "table",
          title: "Most useful operators",
          columns: ["Operator", "Purpose", "Example"],
          rows: [
            ["site:", "Restrict to a domain", "site:Organic Leads.io \"ai marketing\""],
            ["inurl:", "Match URL substring", "inurl:blog site:nytimes.com"],
            ["intitle:", "Match title substring", "intitle:guide intitle:free"],
            ["intext:", "Match body text", "intext:\"written by\" \"contact\""],
            ["filetype:", "Restrict to file types", "filetype:pdf marketing plan"],
            ["cache:", "View Google cache", "cache:Organic Leads.io"],
            ["related:", "Find similar sites", "related:hubspot.com"],
            ["\"\"", "Exact match", "\"core web vitals\""],
            ["-", "Exclude term", "seo -jobs"],
            ["OR / |", "Either term", "seo OR sem"],
            ["*", "Wildcard", "\"best * for marketers\""],
            ["..", "Number range", "iphone 200..300"],
            ["AROUND(n)", "Proximity", "\"content\" AROUND(3) \"marketing\""],
            ["before: / after:", "Date filter", "ai after:2024-01-01"],
            ["source:", "News source", "source:reuters ai"],
          ],
        },
        {
          kind: "cards",
          title: "Workflow combos",
          items: [
            { title: "Indexation check", description: "site:Organic Leads.io — compare to the count in Search Console." },
            { title: "Find guest post targets", description: "\"write for us\" intitle:marketing inurl:blog" },
            { title: "Mine competitor FAQs", description: "site:hubspot.com inurl:faq" },
            { title: "Detect thin content", description: "site:Organic Leads.io inurl:tag" },
            { title: "Find PDF lead magnets", description: "filetype:pdf marketing checklist" },
          ],
        },
        {
          kind: "code",
          title: "Tip · Stack operators like a power user",
          language: "operators",
          code: `(site:Organic Leads.io OR site:helix.ai) inurl:blog
  intitle:"ai marketing" -inurl:tag
  after:2025-01-01
  filetype:pdf OR filetype:docx`,
        },
      ]}
      bestPractices={[
        "Combine site: with intitle: / inurl: for surgical content audits.",
        "Use \"\" exact match to verify keyword cannibalization across your own site.",
        "Run filetype: searches for high-value lead magnets to download.",
        "Pipe operators together with OR / - to broaden or narrow queries.",
      ]}
      examples={[
        { query: "site:Organic Leads.io inurl:blog intitle:\"ai marketing\"", result: "Returns all blog posts on Organic Leads.io mentioning 'ai marketing'." },
        { query: "filetype:pdf \"marketing plan\" -site:w3.org", result: "Finds marketing plan PDFs across the web (excluding w3.org)." },
      ]}
    />
  );
}