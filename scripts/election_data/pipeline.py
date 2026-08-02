from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

import numpy as np
import pandas as pd

from .btw2021 import (
    load_district_method_totals,
    load_federal_method_seed,
    load_state_demographic_profiles,
)
from .models import PreparationResult, ValidationReport, VoteEntry
from .profiles import build_state_method_profiles
from .validation import validate_vote_entries


def _reconcile_to_total(values: np.ndarray, total: float, *, decimals: int = 10) -> np.ndarray:
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


def prepare_btw2021_vote_entries(
    *,
    district_results_csv: str | Path,
    state_demographics_csv: str | Path,
    output_directory: str | Path | None = None,
    federal_method_demographics_csv: str | Path | None = None,
) -> PreparationResult:
    """Run the complete local-file preparation pipeline for Bundestag 2021."""

    district_totals = load_district_method_totals(district_results_csv)
    demographic_profiles = load_state_demographic_profiles(state_demographics_csv)
    federal_seed = (
        load_federal_method_seed(federal_method_demographics_csv)
        if federal_method_demographics_csv is not None
        else None
    )
    profiles = build_state_method_profiles(
        district_totals,
        demographic_profiles,
        federal_seed,
    )
    all_entries = distribute_district_votes(district_totals, profiles)

    validation = validate_vote_entries(
        all_entries,
        district_totals,
        profiles,
    )
    first_votes = [entry for entry in all_entries if entry.voteType == "1"]
    second_votes = [entry for entry in all_entries if entry.voteType == "2"]

    first_path: Path | None = None
    second_path: Path | None = None
    if output_directory is not None:
        output = Path(output_directory)
        first_path = write_vote_entries(first_votes, output / "first_votes.json")
        second_path = write_vote_entries(second_votes, output / "second_votes.json")

    return PreparationResult(
        firstVotes=first_votes,
        secondVotes=second_votes,
        districtTotals=district_totals,
        profiles=profiles,
        validation=ValidationReport(
            entryCount=validation.entryCount,
            sourceGroupCount=validation.sourceGroupCount,
            maxDistrictMethodError=validation.maxDistrictMethodError,
            maxStateDemographicError=validation.maxStateDemographicError,
        ),
        firstVotesPath=first_path,
        secondVotesPath=second_path,
    )
