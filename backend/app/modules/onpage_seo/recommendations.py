"""Recommendation engine for the On-Page SEO module.

Converts audit findings into ranked, actionable recommendations:

  * **scoring** — a numeric score derived from severity × impact;
  * **prioritization** — recommendations sorted by score, then by effort
    (difficulty);
  * **aggregation** — recommendations grouped by category so the dashboard
    can render "content issues", "technical issues", etc.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict, List

logger = logging.getLogger("app.modules.onpage_seo.recommendations")

_SEVERITY_WEIGHTS = {
    "critical": 100,
    "high": 60,
    "medium": 30,
    "low": 10,
}

_DIFFICULTY_WEIGHTS = {
    "easy": 1.0,
    "moderate": 0.7,
    "hard": 0.4,
}

_IMPACT_WEIGHTS = {
    "high": 1.0,
    "medium": 0.6,
    "low": 0.2,
}

_CATEGORY_LABELS = {
    "meta-tags": "Meta tags",
    "headings": "Headings",
    "content": "Content quality",
    "images": "Images",
    "internal-links": "Internal links",
    "external-links": "External links",
    "canonical": "Canonical URLs",
    "robots": "Robots",
    "sitemap": "Sitemap",
    "schema": "Structured data",
    "answer-readiness": "Answer readiness",
}


@dataclass
class ScoredRecommendation:
    title: str
    description: str
    category: str
    priority: str
    impact: str
    difficulty: str
    score: float
    recommended_action: str

    def as_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "priority": self.priority,
            "impact": self.impact,
            "difficulty": self.difficulty,
            "score": round(self.score, 2),
            "recommended_action": self.recommended_action,
        }


class RecommendationService:
    """Deterministic, rule-based recommendation generator."""

    @staticmethod
    def score_severity(severity: str) -> int:
        return _SEVERITY_WEIGHTS.get(severity, 0)

    @staticmethod
    def score_difficulty(difficulty: str) -> float:
        return _DIFFICULTY_WEIGHTS.get(difficulty, 0.5)

    @classmethod
    def compute_score(cls, severity: str, difficulty: str, impact: float = 1.0) -> float:
        """Score = severity weight × impact × difficulty effort multiplier.

        Higher effort (hard) reduces the effective score so easy wins are
        prioritised first at equal severity.
        """
        return cls.score_severity(severity) * impact * cls.score_difficulty(difficulty)

    @classmethod
    def generate_from_findings(cls, findings: List[Dict[str, Any]]) -> List[ScoredRecommendation]:
        """Build scored recommendations from audit-finding dicts.

        Each finding may carry ``severity``, ``category``, ``message``,
        ``recommendation``, ``check_name``. Unknown categories fall back to
        "general".
        """
        recs: List[ScoredRecommendation] = []
        for f in findings:
            severity = f.get("severity", "low")
            category = f.get("category", "general")
            difficulty = _difficulty_for(category, severity)
            impact_label = _impact_for(severity)
            impact_weight = _IMPACT_WEIGHTS.get(impact_label, 0.5)

            title = f.get("title") or _title_for(f.get("check_name"), category)
            description = f.get("message") or title
            action = f.get("recommendation") or _action_for(category)

            recs.append(ScoredRecommendation(
                title=title,
                description=description,
                category=category,
                priority=_priority_for(severity),
                impact=impact_label,
                difficulty=difficulty,
                score=cls.compute_score(severity, difficulty, impact_weight),
                recommended_action=action,
            ))
        return recs

    @staticmethod
    def prioritize(recommendations: List[ScoredRecommendation]) -> List[ScoredRecommendation]:
        """Sort by score descending, then difficulty ascending."""
        return sorted(
            recommendations,
            key=lambda r: (-r.score, _DIFFICULTY_WEIGHTS.get(r.difficulty, 0.5), r.title),
        )

    @staticmethod
    def aggregate_by_category(recommendations: List[ScoredRecommendation]) -> List[Dict[str, Any]]:
        """Group recommendations by category with counts and aggregate score."""
        groups: Dict[str, List[ScoredRecommendation]] = {}
        for rec in recommendations:
            groups.setdefault(rec.category, []).append(rec)

        aggregated = []
        for category, items in sorted(groups.items(), key=lambda kv: -len(kv[1])):
            aggregated.append({
                "category": category,
                "label": _CATEGORY_LABELS.get(category, category.replace("_", " ").title()),
                "count": len(items),
                "total_score": round(sum(i.score for i in items), 2),
                "critical_count": sum(1 for i in items if i.priority == "critical"),
            })
        return aggregated


def _difficulty_for(category: str, severity: str) -> str:
    if severity in ("critical", "high"):
        if category in ("content", "images"):
            return "moderate"
        return "easy"
    if category in ("schema", "answer-readiness"):
        return "moderate"
    return "easy"


def _impact_for(severity: str) -> str:
    return {
        "critical": "high",
        "high": "high",
        "medium": "medium",
        "low": "low",
    }.get(severity, "low")


def _priority_for(severity: str) -> str:
    return severity if severity in ("critical", "high", "medium", "low") else "low"


def _title_for(check_name: str, category: str) -> str:
    if check_name:
        return check_name.replace("_", " ").replace("-", " ").title()
    return f"Improve {_CATEGORY_LABELS.get(category, category)}"


def _action_for(category: str) -> str:
    return {
        "meta-tags": "Write unique, keyword-aligned titles and meta descriptions.",
        "headings": "Use a single H1 and a clear heading hierarchy.",
        "content": "Expand content to at least 300 words and improve readability.",
        "images": "Add descriptive alt text and compress images.",
        "internal-links": "Add descriptive internal links and fix broken ones.",
        "external-links": "Fix or remove broken external links.",
        "canonical": "Ensure canonical URLs are valid and self-referential.",
        "robots": "Review robots directives and remove blocking rules.",
        "sitemap": "Submit the page in your XML sitemap.",
        "schema": "Add valid structured data markup.",
        "answer-readiness": "Structure content to answer common questions directly.",
    }.get(category, "Review and fix the flagged issue.")
