"""Data freshness rules for the fantasy football ingestion pipeline."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Mapping

MAX_AGE_MINUTES: dict[str, int] = {
    "schedules": 24 * 60,
    "statistics": 6 * 60,
    "injuries": 60,
    "news": 30,
    "projections": 12 * 60,
    "fantasypros": 12 * 60,
    "nflverse": 6 * 60,
}


def parse_timestamp(value: str | datetime) -> datetime:
    """Parse an ISO timestamp and require timezone information."""
    timestamp = datetime.fromisoformat(value) if isinstance(value, str) else value
    if timestamp.tzinfo is None or timestamp.utcoffset() is None:
        raise ValueError("Timestamp must be timezone-aware")
    return timestamp.astimezone(timezone.utc)


def freshness_status(
    source: str,
    retrieved_at: str | datetime,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Return freshness metadata for one source snapshot."""
    if source not in MAX_AGE_MINUTES:
        raise ValueError(f"No freshness rule is defined for source: {source}")
    retrieved = parse_timestamp(retrieved_at)
    current = parse_timestamp(now or datetime.now(timezone.utc))
    if retrieved > current:
        raise ValueError(f"retrieved_at {retrieved.isoformat()} is in the future")
    age = current - retrieved
    max_age = timedelta(minutes=MAX_AGE_MINUTES[source])
    return {
        "source": source,
        "retrieved_at": retrieved.isoformat(),
        "checked_at": current.isoformat(),
        "age_minutes": age.total_seconds() / 60,
        "max_age_minutes": MAX_AGE_MINUTES[source],
        "stale": age > max_age,
    }


def evaluate_freshness(
    retrieved_at_by_source: Mapping[str, str | datetime],
    now: datetime | None = None,
) -> dict[str, dict[str, Any]]:
    """Evaluate all supplied source timestamps against configured rules."""
    return {
        source: freshness_status(source, timestamp, now)
        for source, timestamp in retrieved_at_by_source.items()
    }
