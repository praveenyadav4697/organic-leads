"""robots.txt processing for the On-Page SEO crawler.

Parses robots.txt into per-user-agent allow/disallow rule groups plus
global directives (``Sitemap:``, ``Crawl-delay:``), and evaluates whether a
URL may be crawled for a given user agent (standard longest-match rules).

The parser is defensive — malformed lines are skipped, and if robots.txt is
unreachable the crawler defaults to *allow all* (per RFC, a 404 means no
restrictions).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from urllib.parse import urlparse

import httpx

logger = logging.getLogger("app.modules.onpage_seo.crawler.robots")

_DEFAULT_USER_AGENT = "*"


@dataclass
class RobotsRule:
    path: str
    is_allow: bool


@dataclass
class UserAgentGroup:
    agents: List[str]
    rules: List[RobotsRule]
    crawl_delay: Optional[float] = None


@dataclass
class RobotsTxt:
    groups: List[UserAgentGroup] = field(default_factory=list)
    sitemaps: List[str] = field(default_factory=list)
    default_crawl_delay: Optional[float] = None

    def group_for(self, user_agent: str) -> Optional[UserAgentGroup]:
        """Return the most specific rule group for ``user_agent``."""
        ua = user_agent.lower()
        best: Optional[UserAgentGroup] = None
        best_score = -1
        for group in self.groups:
            for agent in group.agents:
                a = agent.lower().strip("*")
                if not a:  # wildcard "*"
                    if best_score < 0:
                        best_score = 0
                        best = group
                    continue
                if a in ua and len(a) > best_score:
                    best_score = len(a)
                    best = group
        return best

    def is_allowed(self, url: str, user_agent: str) -> bool:
        """Return True if ``url`` may be crawled for ``user_agent``.

        Applies the longest-matching-rule semantics of the original spec:
        the longest rule that matches a URL wins, and an empty rule means
        allow.
        """
        group = self.group_for(user_agent)
        if group is None:
            return True
        path = urlparse(url).path or "/"

        best: Optional[RobotsRule] = None
        best_len = -1
        for rule in group.rules:
            if _path_matches(rule.path, path):
                if len(rule.path) > best_len:
                    best_len = len(rule.path)
                    best = rule
        if best is None:
            return True
        return best.is_allow

    def crawl_delay_for(self, user_agent: str) -> Optional[float]:
        group = self.group_for(user_agent)
        if group is not None and group.crawl_delay is not None:
            return group.crawl_delay
        return self.default_crawl_delay


def _path_matches(pattern: str, path: str) -> bool:
    """Match a robots.txt path pattern against a URL path (RFC 9309 subset).

    ``*`` matches any sequence of characters; a trailing ``$`` anchors the
    pattern to the end of the path.
    """
    if not pattern:
        return True
    anchored = pattern.endswith("$")
    p = pattern[:-1] if anchored else pattern
    if not p:
        return True

    if "*" in p:
        matched = _glob_match(p, path)
        if not matched:
            return False
        if anchored:
            return path.endswith(p.rstrip("*"))
        return True

    if anchored:
        return path == p
    return path.startswith(p)


def _glob_match(pattern: str, text: str) -> bool:
    """Simple ``*`` glob match (no ``?``), used for robots patterns."""
    # Iterative two-pointer glob matcher.
    p, t = 0, 0
    star = -1
    mark = 0
    while t < len(text):
        if p < len(pattern) and (pattern[p] == text[t]):
            p += 1
            t += 1
        elif p < len(pattern) and pattern[p] == "*":
            star = p
            mark = t
            p += 1
        elif star != -1:
            p = star + 1
            mark += 1
            t = mark
        else:
            return False
    while p < len(pattern) and pattern[p] == "*":
        p += 1
    return p == len(pattern)


class RobotsService:
    """Fetch + parse robots.txt and evaluate crawl permissions."""

    DEFAULT_USER_AGENT = "organic-leads-seo-crawler"

    @staticmethod
    def parse(text: str) -> RobotsTxt:
        robots = RobotsTxt()
        current_group: Optional[UserAgentGroup] = None
        seen_agents: set[str] = set()

        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if ":" not in line:
                continue
            key, _, value = line.partition(":")
            key = key.strip().lower()
            value = value.strip()

            if key == "user-agent":
                agent = value.lower()
                if agent == _DEFAULT_USER_AGENT or agent:
                    if current_group is not None and agent not in seen_agents:
                        current_group.agents.append(agent)
                        seen_agents.add(agent)
                    else:
                        current_group = UserAgentGroup(agents=[agent], rules=[])
                        robots.groups.append(current_group)
                        seen_agents.add(agent)
            elif key == "allow":
                if current_group is not None:
                    current_group.rules.append(RobotsRule(path=value, is_allow=True))
            elif key == "disallow":
                if current_group is not None:
                    current_group.rules.append(RobotsRule(path=value, is_allow=not value))
            elif key == "crawl-delay":
                try:
                    delay = float(value)
                except ValueError:
                    continue
                if current_group is not None:
                    current_group.crawl_delay = delay
                elif robots.default_crawl_delay is None:
                    robots.default_crawl_delay = delay
            elif key == "sitemap":
                robots.sitemaps.append(value)

        return robots

    @staticmethod
    async def fetch(client: httpx.AsyncClient, site_url: str) -> RobotsTxt:
        """Fetch ``/robots.txt`` and parse it. Unreachable -> allow-all."""
        robots_url = site_url.rstrip("/") + "/robots.txt"
        try:
            resp = await client.get(robots_url)
            if resp.status_code == 200:
                return RobotsService.parse(resp.text)
        except httpx.HTTPError as exc:
            logger.warning("robots.txt fetch error for %s: %s", robots_url, exc)
        except Exception as exc:  # noqa: BLE001
            logger.warning("robots.txt parse error for %s: %s", robots_url, exc)
        # RFC: a missing/unreachable robots.txt means no restrictions.
        return RobotsTxt()
