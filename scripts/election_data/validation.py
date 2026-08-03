from __future__ import annotations

from dataclasses import asdict

import pandas as pd

from .models import ValidationReport, VoteEntry


def entries_to_frame(entries: list[VoteEntry]) -> pd.DataFrame:
    return pd.DataFrame.from_records(asdict(entry) for entry in entries)


def validate_vote_entries(
    entries: list[VoteEntry],
    district_totals: pd.DataFrame,
    profiles: pd.DataFrame,
    *,
    tolerance: float = 1e-6,
) -> ValidationReport:
    if not entries:
        raise ValueError("No vote entries were generated")

    frame = entries_to_frame(entries)
    if frame["votes"].isna().any() or (frame["votes"] < 0).any():
        raise ValueError("Generated entries contain invalid vote values")

    keys = ["districtId", "state", "party", "voteType", "electionMethod"]
    actual = frame.groupby(keys, as_index=False)["votes"].sum()
    expected = district_totals.loc[:, keys + ["votes"]].copy()
    comparison = expected.merge(actual, on=keys, how="outer", suffixes=("Expected", "Actual"))
    comparison = comparison.fillna(0.0)
    comparison["error"] = (
        comparison["votesExpected"] - comparison["votesActual"]
    ).abs()
    max_district_error = float(comparison["error"].max())
    if max_district_error > tolerance:
        worst = comparison.sort_values("error", ascending=False).head(5)
        raise AssertionError(
            "District/method totals are not preserved. Worst rows:\n"
            + worst.to_string(index=False)
        )

    state_keys = ["state", "party", "voteType", "gender", "ageGroup"]
    actual_state = frame.groupby(state_keys, as_index=False)["votes"].sum()
    expected_state = (
        profiles.groupby(state_keys, as_index=False)["fittedStateVotes"].sum()
    )
    state_comparison = expected_state.merge(actual_state, on=state_keys, how="outer")
    state_comparison = state_comparison.fillna(0.0)
    state_comparison["error"] = (
        state_comparison["fittedStateVotes"] - state_comparison["votes"]
    ).abs()
    max_state_error = float(state_comparison["error"].max())
    if max_state_error > tolerance:
        worst = state_comparison.sort_values("error", ascending=False).head(5)
        raise AssertionError(
            "State demographic margins are not preserved. Worst rows:\n"
            + worst.to_string(index=False)
        )

    return ValidationReport(
        entryCount=len(entries),
        sourceGroupCount=len(expected),
        maxDistrictMethodError=max_district_error,
        maxStateDemographicError=max_state_error,
    )
