import pytest

from fantasypros_client import FantasyProsClient
from projection_comparison import metric_summary


class _DummyResponse:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return b'{"players": []}'


def test_metric_summary_ignores_missing_actual_values():
    summary = metric_summary([10.0, 20.0], [15.0, None])

    assert summary["count"] == 1
    assert summary["mean_predicted"] == 10.0
    assert summary["mean_actual"] == 15.0


def test_weekly_projections_warns_for_unused_scoring_argument(monkeypatch):
    client = FantasyProsClient(api_key="test-key")
    monkeypatch.setattr(client, "_get", lambda *args, **kwargs: {"players": []})

    with pytest.warns(UserWarning, match="does not affect the request"):
        client.weekly_projections(2025, 1, scoring="PPR")


def test_identity_matcher_requires_explicit_live_fetch_flag():
    from identity_matcher import _resolve_fantasypros_payload

    with pytest.raises(ValueError, match="explicit opt-in"):
        _resolve_fantasypros_payload(load_from_disk=None, live_fetch=False)


def test_identity_matcher_accepts_disk_payload():
    from identity_matcher import _resolve_fantasypros_payload

    payload = {"players": [{"fpid": 101, "position": "QB"}]}

    assert _resolve_fantasypros_payload(load_from_disk=payload, live_fetch=False) == payload
