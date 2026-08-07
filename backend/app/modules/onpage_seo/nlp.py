"""NLP engine for the On-Page SEO module.

Provides dependency-free text analysis used by the audit pipeline:

  * **readability** — Flesch Reading Ease and Flesch–Kincaid grade level;
  * **keyword extraction** — frequency-based with English stopword filtering;
  * **topic extraction** — top N keywords grouped as page topics;
  * **semantic similarity** — cosine similarity over character n-grams
    (robust to tokenisation differences, no external model required);
  * **duplicate content detection** — normalised similarity between two
    bodies of text.

Every method is a pure function of its inputs, which keeps the engine easy
to unit test and safe to run in the crawl pipeline.
"""
from __future__ import annotations

import math
import re
from collections import Counter
from typing import Dict, List, Tuple

logger = None  # kept for parity; module is pure

_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has",
    "he", "in", "is", "it", "its", "of", "on", "that", "the", "to", "was",
    "were", "will", "with", "i", "you", "your", "we", "our", "they", "them",
    "this", "these", "those", "but", "not", "or", "so", "if", "can", "could",
    "should", "would", "do", "does", "did", "have", "had", "about", "into",
    "than", "then", "there", "their", "more", "most", "all", "any", "each",
    "other", "some", "such", "only", "own", "same", "very", "just", "because",
    "until", "while", "over", "under", "again", "further", "once", "here",
    "when", "where", "why", "how", "also", "new", "now",
}

_WORD_RE = re.compile(r"[a-zA-Z]+(?:['-][a-zA-Z]+)*")
_SENTENCE_RE = re.compile(r"[.!?]+")
_SYLLABLE_RE = re.compile(r"[aeiouyAEIOUY]+")


class NLPService:
    """Stateless text-analysis engine."""

    # --- Readability -----------------------------------------------------

    @staticmethod
    def word_count(text: str) -> int:
        return len(_WORD_RE.findall(text))

    @staticmethod
    def syllable_count(word: str) -> int:
        if not word:
            return 0
        lowered = word.lower()
        if len(lowered) <= 3:
            return 1
        syllables = len(_SYLLABLE_RE.findall(lowered))
        # Subtract a syllable for silent trailing 'e'.
        if lowered.endswith("e") and not lowered.endswith("le"):
            syllables -= 1
        return max(1, syllables)

    @classmethod
    def flesch_reading_ease(cls, text: str) -> float:
        """Flesch Reading Ease score (0–100; higher = easier)."""
        words = cls.word_count(text)
        if words == 0:
            return 0.0
        sentences = max(1, len(_SENTENCE_RE.findall(text.strip())) or 1)
        total_syllables = sum(cls.syllable_count(w) for w in _WORD_RE.findall(text))
        score = 206.835 - 1.015 * (words / sentences) - 84.6 * (total_syllables / words)
        return round(max(0.0, min(100.0, score)), 2)

    @classmethod
    def flesch_kincaid_grade(cls, text: str) -> float:
        """Flesch–Kincaid grade level (US school grade; lower = easier)."""
        words = cls.word_count(text)
        if words == 0:
            return 0.0
        sentences = max(1, len(_SENTENCE_RE.findall(text.strip())) or 1)
        total_syllables = sum(cls.syllable_count(w) for w in _WORD_RE.findall(text))
        grade = 0.39 * (words / sentences) + 11.8 * (total_syllables / words) - 15.59
        return round(max(0.0, grade), 2)

    @classmethod
    def analyze_readability(cls, text: str) -> Dict[str, float]:
        """Full readability summary used by the audit pipeline."""
        return {
            "flesch_reading_ease": cls.flesch_reading_ease(text),
            "flesch_kincaid_grade": cls.flesch_kincaid_grade(text),
        }

    @classmethod
    def grade_label(cls, grade: float) -> str:
        """Map a Flesch–Kincaid grade to a coarse label."""
        if grade <= 6:
            return "easy"
        if grade <= 9:
            return "moderate"
        return "hard"

    # --- Keyword / topic extraction --------------------------------------

    @classmethod
    def extract_keywords(cls, text: str, top_n: int = 10) -> List[Dict[str, object]]:
        """Frequency-based keyword extraction with stopword filtering."""
        words = [w.lower() for w in _WORD_RE.findall(text)]
        filtered = [w for w in words if w not in _STOPWORDS and len(w) > 2]
        counts = Counter(filtered)
        total = len(filtered) or 1
        results = []
        for word, count in counts.most_common(top_n):
            results.append({
                "keyword": word,
                "occurrences": count,
                "density": round(count / total * 100, 2),
            })
        return results

    @classmethod
    def extract_topics(cls, text: str, top_n: int = 5) -> List[str]:
        """Top keywords treated as the page's topics."""
        keywords = cls.extract_keywords(text, top_n)
        return [k["keyword"] for k in keywords]

    # --- Semantic similarity / duplicate content -------------------------

    @staticmethod
    def _ngrams(text: str, n: int = 3) -> Counter:
        normalized = re.sub(r"\s+", " ", text.lower()).strip()
        if not normalized:
            return Counter()
        tokens = normalized.split()
        grams = [token[i : i + n] for token in tokens for i in range(len(token) - n + 1)]
        # Add word-level bigrams for topical signal.
        grams.extend(f"{a} {b}" for a, b in zip(tokens, tokens[1:]))
        return Counter(grams)

    @classmethod
    def cosine_similarity(cls, text_a: str, text_b: str) -> float:
        """Cosine similarity over character n-grams + word bigrams (0–1)."""
        a = cls._ngrams(text_a)
        b = cls._ngrams(text_b)
        if not a or not b:
            return 0.0
        dot = sum((a & b).values())
        norm_a = math.sqrt(sum(v * v for v in a.values()))
        norm_b = math.sqrt(sum(v * v for v in b.values()))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return round(dot / (norm_a * norm_b), 4)

    @classmethod
    def is_duplicate_content(cls, text_a: str, text_b: str, threshold: float = 0.85) -> bool:
        """Return True when two bodies of text are near-duplicates."""
        return cls.cosine_similarity(text_a, text_b) >= threshold
