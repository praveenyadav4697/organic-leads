"""AI engine for the On-Page SEO module.

Uses LangChain (``langchain-openai`` ``ChatOpenAI``) to:

  * generate natural-language recommendations from page audit data;
  * analyse content quality and surface issues the rules engine misses.

When no ``OPENAI_API_KEY`` is configured the engine **degrades gracefully**
to the deterministic rule-based :class:`RecommendationService`, so the
application never breaks because AI is unavailable.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger("app.modules.onpage_seo.ai")


def _is_available() -> bool:
    return settings.AI_ENGINE_ENABLED and bool(settings.OPENAI_API_KEY)


class AIService:
    """LangChain-backed content analysis + recommendation generation."""

    def __init__(self, model: Optional[str] = None) -> None:
        self._model = model or settings.AI_MODEL
        self._llm = None
        if _is_available():
            self._llm = self._build_llm()

    def _build_llm(self):
        try:
            from langchain_openai import ChatOpenAI

            return ChatOpenAI(
                model=self._model,
                temperature=settings.AI_TEMPERATURE,
                api_key=settings.OPENAI_API_KEY,
                max_retries=2,
                timeout=30,
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("LangChain unavailable (%s); AI engine degraded to rules", exc)
            self._llm = None
            return None

    @property
    def enabled(self) -> bool:
        return self._llm is not None

    # --- Recommendation generation --------------------------------------

    async def generate_recommendations(self, page_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Return ranked recommendations for a page.

        Uses the LLM when available; otherwise falls back to the rule-based
        engine so callers always get a result.
        """
        if not self.enabled:
            return self._fallback_recommendations(page_data)

        try:
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_core.output_parsers import JsonOutputParser

            prompt = ChatPromptTemplate.from_messages([
                ("system", (
                    "You are a senior SEO consultant. Given a page audit, return a JSON "
                    "array of recommendations. Each item must have exactly these keys: "
                    "title, description, priority (critical|high|medium|low), "
                    "difficulty (easy|moderate|hard), category, recommended_action."
                )),
                ("human", "Page audit data:\n{audit}"),
            ])
            chain = prompt | self._llm | JsonOutputParser()
            raw = await chain.ainvoke({"audit": _compact(page_data)})
            if not isinstance(raw, list):
                raise ValueError("LLM did not return a list of recommendations")
            return [r for r in raw if isinstance(r, dict) and r.get("title")]
        except Exception as exc:  # noqa: BLE001
            logger.warning("AI recommendation generation failed (%s); using rules", exc)
            return self._fallback_recommendations(page_data)

    def _fallback_recommendations(self, page_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        from app.modules.onpage_seo.recommendations import RecommendationService

        findings = page_data.get("findings") or []
        recs = RecommendationService.generate_from_findings(findings)
        prioritized = RecommendationService.prioritize(recs)
        return [r.as_dict() for r in prioritized]

    # --- Content analysis -------------------------------------------------

    async def analyze_content(self, text: str) -> Dict[str, Any]:
        """Return an LLM content-quality analysis (or a fallback summary)."""
        if not self.enabled or not text.strip():
            return {"quality": "unknown", "summary": "No content to analyse."}

        try:
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_core.output_parsers import JsonOutputParser

            prompt = ChatPromptTemplate.from_messages([
                ("system", (
                    "Analyse the following webpage content and return JSON with keys: "
                    "quality (excellent|good|fair|poor), word_count_assessment, "
                    "readability_assessment, strengths (array), weaknesses (array), "
                    "suggestions (array). Be concise and specific."
                )),
                ("human", "Content:\n{content}"),
            ])
            chain = prompt | self._llm | JsonOutputParser()
            return await chain.ainvoke({"content": text[:8000]})
        except Exception as exc:  # noqa: BLE001
            logger.warning("AI content analysis failed (%s); using fallback", exc)
            return self._fallback_content_analysis(text)

    @staticmethod
    def _fallback_content_analysis(text: str) -> Dict[str, Any]:
        from app.modules.onpage_seo.nlp import NLPService

        words = NLPService.word_count(text)
        grade = NLPService.flesch_kincaid_grade(text)
        keywords = NLPService.extract_keywords(text, 5)
        if words < 300:
            quality = "poor"
        elif words < 600 or grade > 12:
            quality = "fair"
        else:
            quality = "good"
        return {
            "quality": quality,
            "word_count_assessment": f"{words} words",
            "readability_assessment": f"Flesch-Kincaid grade {grade}",
            "strengths": [k["keyword"] for k in keywords[:3]],
            "weaknesses": ["thin content"] if words < 300 else [],
            "suggestions": ["Expand content"] if words < 300 else [],
        }


def _compact(data: Dict[str, Any], limit: int = 12000) -> str:
    """Flatten page data into a bounded JSON string for the prompt."""
    import json

    text = json.dumps(data, default=str)
    return text[:limit]
