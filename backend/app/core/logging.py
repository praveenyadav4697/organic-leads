"""Logging setup with structured (JSON) output and correlation IDs.

Implements the F04 logging requirements:

  * **Structured logging** — when ``LOG_FORMAT=json`` (or ``DEBUG=false``
    and ``LOG_JSON=true``), records are emitted as JSON lines via
    ``python-json-logger`` so they can be shipped to a log aggregator.
  * **Correlation IDs** — a :class:`logging.Filter` pulls the current
    request's correlation ID out of the ``correlation_id`` contextvar and
    attaches it to every record, so a single request can be traced across
    modules and background jobs.
  * **Audit logging** — a dedicated ``audit`` logger (``app.audit``) is
    surfaced so compliance/audit trails can be routed separately.
"""
from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

from app.core.config import settings


class CorrelationIdFilter(logging.Filter):
    """Inject the current correlation ID into every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        from app.core.correlation import get_correlation_id

        record.correlation_id = get_correlation_id() or "-"
        return True


def _json_formatter() -> logging.Formatter:
    from pythonjsonlogger import jsonlogger

    class _JsonFormatter(jsonlogger.JsonFormatter):
        def add_fields(self, log_record, record, message_dict):
            super().add_fields(log_record, record, message_dict)
            log_record["level"] = record.levelname
            log_record["logger"] = record.name
            if getattr(record, "correlation_id", None):
                log_record["correlation_id"] = record.correlation_id

    return _JsonFormatter(
        "%(asctime)s %(levelname)s %(name)s %(correlation_id)s %(message)s"
    )


def _text_formatter() -> logging.Formatter:
    return logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - [%(correlation_id)s] %(message)s"
    )


def setup_logging() -> None:
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    use_json = os.environ.get("LOG_JSON", "1").lower() in ("1", "true", "yes", "on")
    formatter = _json_formatter() if use_json else _text_formatter()

    root = logging.getLogger()
    root.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)

    # Remove any handlers configured by a previous setup_logging() call.
    for handler in list(root.handlers):
        root.removeHandler(handler)

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    stream_handler.addFilter(CorrelationIdFilter())

    file_handler = logging.FileHandler(log_dir / "app.log")
    file_handler.setFormatter(formatter)
    file_handler.addFilter(CorrelationIdFilter())

    root.addHandler(stream_handler)
    root.addHandler(file_handler)

    # Keep SQLAlchemy's engine log quiet unless DEBUG is on.
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.DEBUG if settings.DEBUG else logging.WARNING
    )

    # Dedicated audit logger — same handlers, distinct name so routing is possible.
    audit_logger = logging.getLogger("app.audit")
    audit_logger.setLevel(logging.INFO)
    audit_logger.propagate = True
