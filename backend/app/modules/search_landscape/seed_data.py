"""Governed seed catalog for the F03 Search Landscape Knowledge repository.

This module ships the Phase 1 catalog exactly as specified in the contract:

* 13 SERP features (Featured Snippets ... Breadcrumbs)
* Algorithm update history (Core Updates, Spam Updates, ...)
* 8 normalized search operators (site:, intitle:, ...)
* Governed knowledge items across the six categories
* 5 documentation sources
* Supported engines (Google, Bing, Yahoo, DuckDuckGo) and markets/devices

The sync pipeline imports this catalog and versions it. External documentation
URLs are stored for traceability; live fetching is best-effort.
"""
from datetime import datetime

# ---------------------------------------------------------------------------
# Supported engines / markets / devices
# ---------------------------------------------------------------------------

SUPPORTED_ENGINES = ["Google", "Bing", "Yahoo", "DuckDuckGo"]

MARKETS = ["Desktop", "Mobile", "Tablet"]

DEVICES = ["Desktop", "Mobile", "Tablet"]

# ---------------------------------------------------------------------------
# Documentation sources
# ---------------------------------------------------------------------------

SOURCES = [
    {
        "name": "Google Search Central Documentation",
        "url": "https://developers.google.com/search/docs",
        "category": "search_documentation",
    },
    {
        "name": "Google Search Quality Guidelines",
        "url": "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
        "category": "quality_guidelines",
    },
    {
        "name": "Google Search Documentation",
        "url": "https://developers.google.com/search",
        "category": "search_documentation",
    },
    {
        "name": "Bing Webmaster Documentation",
        "url": "https://www.bing.com/webmasters/help",
        "category": "webmaster_documentation",
    },
    {
        "name": "Official Search Engine Documentation",
        "url": "https://developers.google.com/search/docs",
        "category": "official_documentation",
    },
]

# ---------------------------------------------------------------------------
# SERP features
# ---------------------------------------------------------------------------

SERP_FEATURES = [
    {
        "name": "Featured Snippets",
        "description": "Selected search results that are featured on top of Google's organic results. Pulls a summarized answer and page link directly from a web page.",
        "supported": True,
        "documentation_url": "https://developers.google.com/search/docs/appearance/featured-snippets",
        "search_engines": ["Google", "Bing", "Yahoo", "DuckDuckGo"],
    },
    {
        "name": "AI Overview",
        "description": "Generative AI summary displayed at the top of the SERP that synthesizes an answer from multiple sources with supporting citations.",
        "supported": True,
        "documentation_url": "https://developers.google.com/search/docs/appearance/ai-overviews",
        "search_engines": ["Google"],
    },
    {
        "name": "Local Pack",
        "description": "Map + local business results shown for location-aware queries, typically with a map, business listings, ratings and contact info.",
        "supported": True,
        "documentation_url": "https://developers.google.com/search/docs/appearance/local-pack",
        "search_engines": ["Google", "Bing"],
    },
    {
        "name": "Knowledge Panel",
        "description": "Box on the right of the SERP summarizing facts about an entity pulled from the Knowledge Graph.",
        "supported": True,
        "documentation_url": "https://developers.google.com/search/docs/appearance/knowledge-panel",
        "search_engines": ["Google", "Bing"],
    },
    {
        "name": "People Also Ask",
        "description": "Accordion of related questions that expands to reveal answer snippets, each linking back to a source page.",
        "supported": True,
        "documentation_url": "https://developers.google.com/search/docs/appearance/structured-data/faqpage",
        "search_engines": ["Google", "Bing"],
    },
    {
        "name": "Image Pack",
        "description": "Horizontal strip of image results triggered for image-rich queries.",
        "supported": True,
        "documentation_url": "https://developers.google.com/search/docs/appearance/google-images",
        "search_engines": ["Google", "Bing", "DuckDuckGo"],
    },
    {
        "name": "Video Results",
        "description": "Dedicated video carousel or inline video result for video-oriented queries.",
        "supported": True,
        "documentation_url": "https://developers.google.com/search/docs/appearance/video",
        "search_engines": ["Google", "Bing"],
    },
    {
        "name": "Shopping Results",
        "description": "Product listings with price, image and merchant information shown for commercial queries.",
        "supported": True,
        "documentation_url": "https://developers.google.com/search/docs/appearance/shopping-listings",
        "search_engines": ["Google", "Bing"],
    },
    {
        "name": "News Results",
        "description": "News carousel or top stories block surfaced for fresh, news-worthy queries.",
        "supported": True,
        "documentation_url": "https://developers.google.com/search/docs/appearance/google-news",
        "search_engines": ["Google", "Bing"],
    },
    {
        "name": "FAQ Rich Results",
        "description": "Rich result that displays question-answer pairs from FAQPage structured data in the SERP.",
        "supported": True,
        "documentation_url": "https://developers.google.com/search/docs/appearance/structured-data/faqpage",
        "search_engines": ["Google"],
    },
    {
        "name": "Review Snippets",
        "description": "Star ratings and review summary shown with a result from Review structured data.",
        "supported": True,
        "documentation_url": "https://developers.google.com/search/docs/appearance/structured-data/review-snippet",
        "search_engines": ["Google"],
    },
    {
        "name": "Sitelinks",
        "description": "Additional navigation links under a result that help users move around the site.",
        "supported": True,
        "documentation_url": "https://developers.google.com/search/docs/appearance/sitelinks",
        "search_engines": ["Google", "Bing", "DuckDuckGo"],
    },
    {
        "name": "Breadcrumbs",
        "description": "Path hierarchy shown on a result built from BreadcrumbList structured data.",
        "supported": True,
        "documentation_url": "https://developers.google.com/search/docs/appearance/structured-data/breadcrumb",
        "search_engines": ["Google"],
    },
]

# ---------------------------------------------------------------------------
# Algorithm updates
# ---------------------------------------------------------------------------

ALGORITHM_UPDATES = [
    {
        "name": "Core Update",
        "release_date": datetime(2024, 8, 1),
        "status": "completed",
        "summary": "Broad improvement to core ranking systems. Sites that lose visibility typically need substantive, people-first content improvements.",
        "priority": "critical",
        "documentation_url": "https://developers.google.com/search/blog/2024/08/core-update-august-2024",
    },
    {
        "name": "Spam Update",
        "release_date": datetime(2024, 6, 1),
        "status": "completed",
        "summary": "Improves ranking systems that identify scaled content abuse, expired domain abuse and site reputation abuse.",
        "priority": "high",
        "documentation_url": "https://developers.google.com/search/blog/2024/06/spam-updates-2024",
    },
    {
        "name": "Helpful Content Update",
        "release_date": datetime(2023, 9, 1),
        "status": "completed",
        "summary": "Rewards content created primarily for people, not for search engines. Site-wide classifier applies to first-party content.",
        "priority": "high",
        "documentation_url": "https://developers.google.com/search/blog/2023/09/september-2023-core-update",
    },
    {
        "name": "Product Reviews Update",
        "release_date": datetime(2023, 2, 1),
        "status": "completed",
        "summary": "Rewards in-depth, original product reviews that demonstrate first-hand expertise rather than thin, templated summaries.",
        "priority": "medium",
        "documentation_url": "https://developers.google.com/search/blog/2023/02/product-reviews-update",
    },
    {
        "name": "AI Overviews Expansion",
        "release_date": datetime(2024, 5, 1),
        "status": "rolling_out",
        "summary": "Expands generative AI answers across the SERP while preserving ranking for the cited sources.",
        "priority": "critical",
        "documentation_url": "https://developers.google.com/search/docs/appearance/ai-overviews",
    },
    {
        "name": "March 2024 Core Update",
        "release_date": datetime(2024, 3, 1),
        "status": "completed",
        "summary": "Multi-part core update focused on reducing low-quality, unoriginal content in search results.",
        "priority": "high",
        "documentation_url": "https://developers.google.com/search/blog/2024/03/core-update-march-2024",
    },
]

# ---------------------------------------------------------------------------
# Search operators
# ---------------------------------------------------------------------------

SEARCH_OPERATORS = [
    {
        "operator": "site:",
        "purpose": "Restrict results to a single domain or subdomain.",
        "example": "site:example.com performance",
        "supported": True,
        "search_engines": ["Google", "Bing", "DuckDuckGo"],
        "notes": "Most reliable when combined with a keyword. Google requires no space after the colon.",
    },
    {
        "operator": "intitle:",
        "purpose": "Return only pages with the term in the HTML title tag.",
        "example": "intitle:organic leads",
        "supported": True,
        "search_engines": ["Google", "Bing"],
        "notes": "For an exact phrase use intitle:\"exact phrase\".",
    },
    {
        "operator": "inurl:",
        "purpose": "Return only pages with the term in the URL path.",
        "example": "inurl:blog seo",
        "supported": True,
        "search_engines": ["Google", "Bing"],
        "notes": "Useful for discovering indexable sections of a site.",
    },
    {
        "operator": "filetype:",
        "purpose": "Return only files of a given type (pdf, docx, xlsx, ...).",
        "example": "whitepaper filetype:pdf",
        "supported": True,
        "search_engines": ["Google", "Bing"],
        "notes": "Useful for finding downloadable documents.",
    },
    {
        "operator": "cache:",
        "purpose": "Show the cached version of a URL.",
        "example": "cache:example.com",
        "supported": True,
        "search_engines": ["Google"],
        "notes": "Deprecated for public use in many regions; may be discontinued.",
    },
    {
        "operator": "related:",
        "purpose": "Find pages Google considers related to the given URL.",
        "example": "related:example.com",
        "supported": True,
        "search_engines": ["Google"],
        "notes": "Useful for competitor discovery.",
    },
    {
        "operator": "before:",
        "purpose": "Return only pages published before a date (YYYY-MM-DD).",
        "example": "seo news before:2024-01-01",
        "supported": True,
        "search_engines": ["Google"],
        "notes": "Combines with after: to build a date range.",
    },
    {
        "operator": "after:",
        "purpose": "Return only pages published after a date (YYYY-MM-DD).",
        "example": "seo news after:2024-01-01",
        "supported": True,
        "search_engines": ["Google"],
        "notes": "Combines with before: to build a date range.",
    },
]

# ---------------------------------------------------------------------------
# Governed knowledge items
# ---------------------------------------------------------------------------

KNOWLEDGE_ITEMS = [
    # ranking_signals
    {
        "category": "ranking_signals",
        "title": "E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)",
        "content": "Google uses E-E-A-T as a framework to evaluate page quality. Strong signals include clear authorship, first-hand experience, accurate factual content, and a trustworthy site-level reputation.",
        "summary": "Quality-rater framework for page quality; not a direct ranking system but shapes core systems.",
        "references": {"docs": "https://developers.google.com/search/docs/fundamentals/creating-helpful-content"},
        "priority": "critical",
        "requires_approval": True,
    },
    {
        "category": "ranking_signals",
        "title": "Topical relevance & content matching",
        "content": "Ranking systems match queries to pages by topical relevance, using content, links and user behavior. Thin or off-topic content is at a structural disadvantage.",
        "summary": "Relevance is the primary matching signal.",
        "references": {},
        "priority": "high",
        "requires_approval": False,
    },
    {
        "category": "ranking_signals",
        "title": "Backlink authority",
        "content": "Links from authoritative, topically-related sites pass relevance and trust. Link quantity alone is not a quality signal; relevance and editorial placement matter more.",
        "summary": "Links remain a core authority signal.",
        "references": {"docs": "https://developers.google.com/search/docs/fundamentals/backlinks"},
        "priority": "high",
        "requires_approval": True,
    },
    # indexing_rules
    {
        "category": "indexing_rules",
        "title": "Googlebot uses a single mobile-first crawl budget",
        "content": "Google indexes the mobile version of a page. The mobile crawl budget and render capacity are shared across a site, so server response times and render-blocking resources affect indexation.",
        "summary": "Mobile-first indexing means the mobile experience is the indexing baseline.",
        "references": {"docs": "https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-first-indexing"},
        "priority": "critical",
        "requires_approval": False,
    },
    {
        "category": "indexing_rules",
        "title": "Canonicalization determines the indexed URL",
        "content": "When duplicate content exists, Google selects one canonical URL to index. Explicit canonical tags, internal links and sitemaps all signal the preferred URL.",
        "summary": "Use self-referencing canonicals and consistent internal links.",
        "references": {"docs": "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls"},
        "priority": "high",
        "requires_approval": False,
    },
    # crawling_rules
    {
        "category": "crawling_rules",
        "title": "Robots.txt controls crawl permission, not indexation",
        "content": "robots.txt blocks crawling of disallowed paths; it does not block indexation of URLs that are already known. Use noindex meta for indexation control.",
        "summary": "robots.txt = crawl permission; noindex = indexation control.",
        "references": {"docs": "https://developers.google.com/search/docs/crawling-indexing/robots/intro"},
        "priority": "high",
        "requires_approval": False,
    },
    {
        "category": "crawling_rules",
        "title": "Crawl budget applies to very large sites",
        "content": "For sites with many URLs, crawl demand and crawl capacity determine how quickly Googlebot discovers content. Healthy response codes and internal linking improve crawl efficiency.",
        "summary": "Crawl budget matters mainly for large sites (1M+ URLs).",
        "references": {"docs": "https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget"},
        "priority": "medium",
        "requires_approval": True,
    },
    # structured_data
    {
        "category": "structured_data",
        "title": "Schema.org structured data enables rich results",
        "content": "JSON-LD is Google's preferred structured data format. Supported types (Article, FAQPage, BreadcrumbList, Product, Review, Event, Organization) can enable rich results.",
        "summary": "Use JSON-LD; validate with the Rich Results Test.",
        "references": {"docs": "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data"},
        "priority": "high",
        "requires_approval": False,
    },
    {
        "category": "structured_data",
        "title": "Structured data must reflect visible content",
        "content": "Google treats markup that hides or exaggerates content as spam. Rich-result eligibility requires the markup to match what a user can see on the page.",
        "summary": "No hidden or promotional markup.",
        "references": {"docs": "https://developers.google.com/search/docs/appearance/structured-data/structured-data-policies"},
        "priority": "high",
        "requires_approval": True,
    },
    # search_architecture
    {
        "category": "search_architecture",
        "title": "Search features are rendered per query and market",
        "content": "The SERP is composed from ranked results plus search features. Which features appear depends on query intent, market, device and the search engine.",
        "summary": "SERP composition is dynamic and market/device-specific.",
        "references": {},
        "priority": "medium",
        "requires_approval": False,
    },
    {
        "category": "search_architecture",
        "title": "International targeting: hreflang + language",
        "content": "For multi-language/multi-region sites, hreflang annotations tell engines which URL serves which language and region. Correct implementation prevents the wrong variant from being indexed.",
        "summary": "hreflang drives language/region targeting.",
        "references": {"docs": "https://developers.google.com/search/docs/specialty/international/localized-versions"},
        "priority": "medium",
        "requires_approval": False,
    },
    # algorithm_knowledge
    {
        "category": "algorithm_knowledge",
        "title": "Core updates reward sustained quality improvements",
        "content": "Recovery from a core update requires improving overall page quality, not short-term fixes. Evaluations are typically measured across the site over weeks.",
        "summary": "Recovery guidance: focus on people-first content improvements.",
        "references": {"docs": "https://developers.google.com/search/blog/2024/08/core-update-august-2024"},
        "priority": "high",
        "requires_approval": True,
    },
    {
        "category": "algorithm_knowledge",
        "title": "Spam policies: scaled content abuse",
        "content": "Producing content at scale primarily for search engines violates spam policies. Sites that pivot from low-value to high-quality content can regain ranking.",
        "summary": "Scaled content abuse is a manual-action and algorithm signal.",
        "references": {"docs": "https://developers.google.com/search/docs/essentials/spam-policies"},
        "priority": "high",
        "requires_approval": True,
    },
]
