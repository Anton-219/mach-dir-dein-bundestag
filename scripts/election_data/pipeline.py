from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

import numpy as np
import pandas as pd

from .models import VoteEntry


def _reconcile_to_total(values: np.ndarray, total: float, *, decimals: int = 10) -> np.ndarray:
    """Round modelled values while preserving their known source total."""

    rounded = np.round(np.asarray(values, dtype=float), decimals=decimals)
    residual = round(float(total) - float(rounded.sum()), decimals)
    if rounded.size:
        rounded[-1] = round(float(rounded[-1] + residual), decimals)
    return rounded


def distribute_district_votes(
    district_totals: pd.DataFrame,
    profiles: pd.DataFrame,
) -> list[VoteEntry]:
    """Expand official constituency/method totals into demographic VoteEntry rows."""

    profile_groups = {
        key: group.sort_values(["gender", "ageGroup"])
        for key, group in profiles.groupby(
            ["state", "voteType", "party", "electionMethod"], sort=False
        )
    }
    entries: list[VoteEntry] = []

    for row in district_totals.itertuples(index=False):
        key = (row.state, row.voteType, row.party, row.electionMethod)
        profile = profile_groups.get(key)
        if profile is None:
            raise KeyError(f"No fitted profile exists for {key}")

        shares = profile["share"].to_numpy(dtype=float)
        values = _reconcile_to_total(shares * float(row.votes), float(row.votes))

        for profile_row, votes in zip(profile.itertuples(index=False), values, strict=True):
            if votes == 0:
                continue
            entries.append(
                VoteEntry(
                    districtId=int(row.districtId),
                    state=str(row.state),
                    gender=profile_row.gender,
                    ageGroup=profile_row.ageGroup,
                    party=str(row.party),
                    voteType=row.voteType,
                    electionMethod=row.electionMethod,
                    votes=float(votes),
                )
            )
    return entries


def write_vote_entries(entries: list[VoteEntry], path: str | Path) -> Path:
    """Write compact UTF-8 JSON for one vote type."""

    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(
            [asdict(entry) for entry in entries],
            handle,
            ensure_ascii=False,
            separators=(",", ":"),
        )
    return output_path
