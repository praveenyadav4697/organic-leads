"""Lightweight in-process metrics registry.

Provides counters, gauges, and histograms used by the monitoring
component (F04). Metrics are rendered in Prometheus text format so a
scraper (or the ``/api/v1/metrics`` endpoint) can ingest them without an
external agent.

Because the application runs a single event loop, an in-memory registry
guarded by a mutex is sufficient and avoids pulling in a heavy telemetry
SDK. Persistence/retention is out of scope — scrape-and-store.
"""
from __future__ import annotations

import threading
import time
from typing import Dict, Optional

_METRIC_PREFIX = "organic_leads"


class MetricsRegistry:
    """Thread-safe counters, gauges, and histograms."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._counters: Dict[str, float] = {}
        self._gauges: Dict[str, float] = {}
        self._histograms: Dict[str, Dict[str, float]] = {}  # name -> {bucket: count}
        self._labels: Dict[str, Dict[str, str]] = {}

    # --- Counter ---------------------------------------------------------

    def increment(self, name: str, value: float = 1.0, labels: Optional[Dict[str, str]] = None) -> None:
        key = self._key(name, labels)
        with self._lock:
            self._counters[key] = self._counters.get(key, 0.0) + value
            self._labels[key] = labels or {}

    def counter_value(self, name: str, labels: Optional[Dict[str, str]] = None) -> float:
        with self._lock:
            return self._counters.get(self._key(name, labels), 0.0)

    # --- Gauge -----------------------------------------------------------

    def set_gauge(self, name: str, value: float, labels: Optional[Dict[str, str]] = None) -> None:
        key = self._key(name, labels)
        with self._lock:
            self._gauges[key] = value
            self._labels[key] = labels or {}

    def gauge_value(self, name: str, labels: Optional[Dict[str, str]] = None) -> float:
        with self._lock:
            return self._gauges.get(self._key(name, labels), 0.0)

    # --- Histogram -------------------------------------------------------

    def observe(self, name: str, value: float, labels: Optional[Dict[str, str]] = None) -> None:
        key = self._key(name, labels)
        with self._lock:
            hist = self._histograms.setdefault(key, {"+Inf": 0.0})
            hist["+Inf"] += 1.0
            for bucket in (0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0):
                if value <= bucket:
                    hist[bucket] = hist.get(bucket, 0.0) + 1.0
            self._labels[key] = labels or {}

    # --- Timing helper ---------------------------------------------------

    def timed(self, name: str, labels: Optional[Dict[str, str]] = None):
        """Context manager that records wall-clock duration of a block."""

        class _Timer:
            def __init__(self, registry: "MetricsRegistry", metric: str, label_map: Optional[Dict[str, str]]):
                self.registry = registry
                self.metric = metric
                self.labels = label_map or {}
                self.start = 0.0

            def __enter__(self) -> "_Timer":
                self.start = time.perf_counter()
                return self

            def __exit__(self, *exc) -> None:
                elapsed = time.perf_counter() - self.start
                self.registry.observe(self.metric, elapsed, self.labels)

        return _Timer(self, name, labels)

    # --- Rendering -------------------------------------------------------

    def render_text(self) -> str:
        """Render all metrics in Prometheus text exposition format."""
        lines: list[str] = []
        with self._lock:
            for key, value in sorted(self._counters.items()):
                name, label_str = self._split_key(key)
                lines.append(f"# TYPE {_METRIC_PREFIX}_{name} counter")
                lines.append(f"{_METRIC_PREFIX}_{name}{label_str} {int(value)}")
            for key, value in sorted(self._gauges.items()):
                name, label_str = self._split_key(key)
                lines.append(f"# TYPE {_METRIC_PREFIX}_{name} gauge")
                lines.append(f"{_METRIC_PREFIX}_{name}{label_str} {value}")
            for key, hist in sorted(self._histograms.items()):
                name, label_str = self._split_key(key)
                lines.append(f"# TYPE {_METRIC_PREFIX}_{name}_seconds histogram")
                for bucket in sorted(float(b) for b in hist if b != "+Inf"):
                    lines.append(
                        f"{_METRIC_PREFIX}_{name}_seconds_bucket{{le=\"{bucket:g}\"{label_str.strip()[:-1] and (',' + label_str.strip()[1:-1])}}} {int(hist.get(bucket, 0.0))}"
                    )
                lines.append(f"{_METRIC_PREFIX}_{name}_seconds_bucket{{le=\"+Inf\"{label_str.strip()[:-1] and (',' + label_str.strip()[1:-1])}}} {int(hist['+Inf'])}")
                lines.append(f"{_METRIC_PREFIX}_{name}_seconds_sum {hist.get('_sum', 0.0)}")
                lines.append(f"{_METRIC_PREFIX}_{name}_seconds_count {int(hist['+Inf'])}")
        return "\n".join(lines) + "\n"

    # --- Internal helpers -------------------------------------------------

    @staticmethod
    def _key(name: str, labels: Optional[Dict[str, str]]) -> str:
        if not labels:
            return name
        label_str = ",".join(f"{k}={v}" for k, v in sorted(labels.items()))
        return f"{name} {{{label_str}}}"

    @staticmethod
    def _split_key(key: str):
        if "{" in key:
            name, label_block = key.split("{", 1)
            label_str = "{" + label_block
        else:
            name, label_str = key, ""
        return name, label_str


registry = MetricsRegistry()
