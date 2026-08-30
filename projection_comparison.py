"""Compare normalized projection records and optional actual results."""

from __future__ import annotations

import argparse
import json
import math
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable


def load_records(path: Path) -> list[dict[str, Any]]:
    """Load projection records from an adapter or model output file."""
    payload = json.loads(path.read_text(encoding="utf-8"))
    records = payload.get("projections", payload)
    if not isinstance(records, list):
        raise ValueError(f"{path} does not contain a projections list")
    return [record for record in records if isinstance(record, dict)]


def _key(record: dict[str, Any]) -> tuple[str, int, int]:
    return str(record["player_id"]), int(record["season"]), int(record["week"])


def _index_records(records: list[dict[str, Any]], source: str) -> dict[tuple[str, int, int], dict[str, Any]]:
    indexed: dict[tuple[str, int, int], dict[str, Any]] = {}
    duplicates: list[tuple[str, int, int]] = []
    for record in records:
        key = _key(record)
        if key in indexed:
            duplicates.append(key)
        indexed[key] = record
    if duplicates:
        formatted = ", ".join(
            f"{player_id}/{season}/week-{week}"
            for player_id, season, week in sorted(set(duplicates))
        )
        raise ValueError(f"Duplicate {source} projection records: {formatted}")
    return indexed


def _points(record: dict[str, Any]) -> float | None:
    projection = record.get("projection", record)
    value = projection.get("fantasy_points") if isinstance(projection, dict) else None
    try:
        return None if value is None else float(value)
    except (TypeError, ValueError):
        return None


def _mean(values: Iterable[float]) -> float | None:
    values = list(values)
    return sum(values) / len(values) if values else None


def _correlation(left: list[float], right: list[float]) -> float | None:
    if len(left) < 2:
        return None
    left_mean = sum(left) / len(left)
    right_mean = sum(right) / len(right)
    left_delta = [value - left_mean for value in left]
    right_delta = [value - right_mean for value in right]
    denominator = math.sqrt(
        sum(value * value for value in left_delta)
        * sum(value * value for value in right_delta)
    )
    return None if denominator == 0 else sum(a * b for a, b in zip(left_delta, right_delta)) / denominator


def metric_summary(predicted: list[float | None], actual: list[float | None]) -> dict[str, Any]:
    """Calculate forecast error and calibration metrics for paired points."""
    if len(predicted) != len(actual):
        raise ValueError("Predicted and actual values must have equal lengths")
    filtered = [
        (prediction, result)
        for prediction, result in zip(predicted, actual)
        if prediction is not None and result is not None
    ]
    if not filtered:
        return {
            "count": 0,
            "mae": None,
            "rmse": None,
            "bias": None,
            "correlation": None,
            "mean_predicted": None,
            "mean_actual": None,
            "calibration_ratio": None,
        }

    predicted_values = [prediction for prediction, _ in filtered]
    actual_values = [result for _, result in filtered]
    errors = [prediction - result for prediction, result in filtered]
    mean_actual = _mean(actual_values)
    return {
        "count": len(predicted_values),
        "mae": _mean(abs(error) for error in errors),
        "rmse": math.sqrt(_mean(error * error for error in errors) or 0),
        "bias": _mean(errors),
        "correlation": _correlation(predicted_values, actual_values),
        "mean_predicted": _mean(predicted_values),
        "mean_actual": mean_actual,
        "calibration_ratio": None if not mean_actual else _mean(predicted_values) / mean_actual,
    }


def _grouped_summary(
    pairs: list[dict[str, Any]],
    predicted_field: str,
    actual_field: str,
    group_field: str,
) -> dict[str, dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for pair in pairs:
        grouped[str(pair[group_field])].append(pair)
    return {
        group: metric_summary(
            [pair[predicted_field] for pair in group_pairs],
            [pair[actual_field] for pair in group_pairs],
        )
        for group, group_pairs in sorted(grouped.items())
    }


def compare_records(
    fantasypros: list[dict[str, Any]],
    internal: list[dict[str, Any]],
    actual: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Compare common player-week records without joining by display name."""
    fantasypros_by_key = _index_records(fantasypros, "FantasyPros")
    internal_by_key = _index_records(internal, "internal")
    common_keys = sorted(fantasypros_by_key.keys() & internal_by_key.keys())

    pairs: list[dict[str, Any]] = []
    for key in common_keys:
        fantasypros_record = fantasypros_by_key[key]
        internal_record = internal_by_key[key]
        fantasypros_points = _points(fantasypros_record)
        internal_points = _points(internal_record)
        if fantasypros_points is None or internal_points is None:
            continue
        pairs.append(
            {
                "player_id": key[0],
                "season": key[1],
                "week": key[2],
                "position": fantasypros_record.get("position", internal_record.get("position")),
                "fantasypros_points": fantasypros_points,
                "internal_points": internal_points,
                "difference": internal_points - fantasypros_points,
            }
        )

    result: dict[str, Any] = {
        "paired_players": len(pairs),
        "fantasypros_vs_internal": metric_summary(
            [pair["fantasypros_points"] for pair in pairs],
            [pair["internal_points"] for pair in pairs],
        ),
        "fantasypros_vs_internal_by_position": _grouped_summary(
            pairs, "fantasypros_points", "internal_points", "position"
        ),
        "fantasypros_vs_internal_by_week": _grouped_summary(
            pairs, "fantasypros_points", "internal_points", "week"
        ),
        "pairs": pairs,
    }
    if actual is not None:
        actual_by_key = _index_records(actual, "actual")
        actual_pairs = [
            pair
            for pair in pairs
            if (pair["player_id"], pair["season"], pair["week"]) in actual_by_key
            and _points(actual_by_key[(pair["player_id"], pair["season"], pair["week"])]) is not None
        ]
        fantasypros_values = [pair["fantasypros_points"] for pair in actual_pairs]
        internal_values = [pair["internal_points"] for pair in actual_pairs]
        actual_values = [_points(actual_by_key[(pair["player_id"], pair["season"], pair["week"])]) for pair in actual_pairs]
        result["actual_comparisons"] = {
            "paired_players": len(actual_values),
            "fantasypros": metric_summary(fantasypros_values, actual_values),
            "internal": metric_summary(internal_values, actual_values),
            "fantasypros_by_position": _grouped_summary(
                [
                    {**pair, "actual_points": _points(actual_by_key[(pair["player_id"], pair["season"], pair["week"])])}
                    for pair in actual_pairs
                ],
                "fantasypros_points",
                "actual_points",
                "position",
            ),
            "internal_by_position": _grouped_summary(
                [
                    {**pair, "actual_points": _points(actual_by_key[(pair["player_id"], pair["season"], pair["week"])])}
                    for pair in actual_pairs
                ],
                "internal_points",
                "actual_points",
                "position",
            ),
        }
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fantasypros", type=Path, required=True)
    parser.add_argument("--internal", type=Path, required=True)
    parser.add_argument("--actual", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    comparison = compare_records(
        load_records(args.fantasypros),
        load_records(args.internal),
        load_records(args.actual) if args.actual else None,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(comparison, indent=2, sort_keys=True), encoding="utf-8")
    print(f"Paired projection records: {comparison['paired_players']}")
    print(f"Saved comparison: {args.output}")


if __name__ == "__main__":
    main()
