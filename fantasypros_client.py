"""Read FantasyPros NFL projections and metadata."""

from __future__ import annotations

import json
import os
import warnings
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE_URL = "https://api.fantasypros.com/public/v2/json"


class FantasyProsClient:
    """Small read-only client for the FantasyPros public API."""

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or os.environ.get("FANTASYPROS_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Set FANTASYPROS_API_KEY before using the FantasyPros client"
            )

    def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        query = f"?{urlencode(params)}" if params else ""
        request = Request(
            f"{BASE_URL}{path}{query}",
            headers={
                "User-Agent": "FantasyFootball/1.0",
                "x-api-key": self.api_key,
            },
        )
        try:
            with urlopen(request, timeout=30) as response:
                return json.load(response)
        except HTTPError as error:
            response_body = error.read().decode("utf-8", errors="replace").strip()
            detail = f": {response_body[:500]}" if response_body else ""
            raise RuntimeError(
                f"FantasyPros returned HTTP {error.code} for {path}{detail}"
            ) from error
        except URLError as error:
            raise RuntimeError(
                f"Unable to reach FantasyPros for {path}: {error.reason}"
            ) from error

    def weekly_projections(
        self,
        season: int,
        week: int,
        position: str = "ALL",
        scoring: str = "PPR",
        player_ids: list[int] | None = None,
    ) -> dict[str, Any]:
        """Fetch weekly projections and return the provider response unchanged.

        The documented NFL projections endpoint does not accept a scoring
        parameter. It returns projected stats with the provider's scoring
        metadata, so scoring must be applied by the caller when needed.
        """
        if scoring is not None:
            warnings.warn(
                "The FantasyPros scoring argument does not affect the request; the underlying API does not accept it and the adapter recalculates points locally.",
                UserWarning,
                stacklevel=2,
            )
        params: dict[str, Any] = {
            "position": position,
            "week": week,
        }
        if player_ids:
            params["players"] = ":".join(str(player_id) for player_id in player_ids)
        return self._get(f"/nfl/{season}/projections", params)

    def players(self) -> dict[str, Any]:
        """Fetch FantasyPros player metadata and external ID mappings."""
        return self._get("/nfl/players")

    def injuries(self, season: int, week: int) -> dict[str, Any]:
        """Fetch NFL injury and practice-report data."""
        return self._get("/nfl/injuries", {"year": season, "week": week})


if __name__ == "__main__":
    print("FantasyPros client ready; set FANTASYPROS_API_KEY to make requests.")
