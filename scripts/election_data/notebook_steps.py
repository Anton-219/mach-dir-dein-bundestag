from __future__ import annotations

from typing import Iterable

import numpy as np
import pandas as pd

from .btw2021 import (
    canonical_party_name,
    normalize_age_group,
    normalize_gender,
    normalize_method,
    normalize_state,
    normalize_vote_type,
)
from .models import VoteType


STATISTIC_METADATA_COLUMNS = {
    "Land",
    "Erst-/Zweitstimme",
    "Geschlecht",
    "Geburtsjahresgruppe",
    "Summe",
    "Ungültig",
    "ungueltig",
    "gültig",
    "Gueltig",
    "Bezirksart",
    "Art der Stimmabgabe",
    "Wahlart",
    "Urne/Brief",
    "Stimmabgabe",
}

METHOD_COLUMN_CANDIDATES = (
    "Bezirksart",
    "Art der Stimmabgabe",
    "Wahlart",
    "Urne/Brief",
    "Stimmabgabe",
)


def require_columns(frame: pd.DataFrame, required: set[str], *, label: str) -> None:
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"{label} is missing required columns: {sorted(missing)}")


def numeric_votes(series: pd.Series) -> pd.Series:
    cleaned = series.astype(str).str.strip().replace({"": "0", "-": "0"})
    values = pd.to_numeric(cleaned, errors="coerce")
    if values.isna().any():
        examples = cleaned[values.isna()].head(10).tolist()
        raise ValueError(f"Non-numeric vote values encountered: {examples}")
    return values.astype(float)


def inspect_district_rows(frame: pd.DataFrame) -> pd.DataFrame:
    """Show which source rows have a usable constituency number."""

    require_columns(frame, {"Wahlkreis", "Land", "Bezirksart"}, label="District CSV")
    raw = frame["Wahlkreis"].astype(str).str.strip()
    parsed = pd.to_numeric(raw, errors="coerce")
    whole_number = parsed.notna() & np.isclose(parsed % 1, 0)
    missing = raw.str.lower().isin({"", "nan", "none", "<na>"})

    status = pd.Series("usable", index=frame.index, dtype="object")
    status.loc[missing] = "missing"
    status.loc[~missing & ~whole_number] = "invalid"

    visible = [
        column
        for column in ("Wahlkreis", "Land", "Gemeinde Name", "Wahlbezirk", "Bezirksart")
        if column in frame.columns
    ]
    result = frame.loc[:, visible].copy()
    result.insert(0, "sourceRow", frame.index)
    result["districtIdCandidate"] = parsed.where(whole_number).astype("Int64")
    result["status"] = status
    return result


def select_usable_district_rows(
    frame: pd.DataFrame,
    diagnostics: pd.DataFrame | None = None,
) -> pd.DataFrame:
    """Remove shown empty/footer rows and reject unexplained text values."""

    diagnostics = inspect_district_rows(frame) if diagnostics is None else diagnostics
    invalid = diagnostics[diagnostics["status"] == "invalid"]
    if not invalid.empty:
        raise ValueError(
            "Non-empty, non-numeric Wahlkreis values remain. Inspect these rows: "
            f"{invalid.head(10).to_dict(orient='records')}"
        )
    indexes = diagnostics.loc[diagnostics["status"] == "usable", "sourceRow"]
    return frame.loc[indexes].copy()


def normalize_district_rows(frame: pd.DataFrame) -> pd.DataFrame:
    """Add the normalized fields used by all later calculations."""

    require_columns(frame, {"Wahlkreis", "Land", "Bezirksart"}, label="District CSV")
    result = frame.copy()
    district_ids = pd.to_numeric(result["Wahlkreis"], errors="coerce")
    if district_ids.isna().any():
        raise ValueError(
            "Wahlkreis still contains missing values. Run inspect_district_rows() "
            "and select_usable_district_rows() before normalization."
        )
    result["districtId"] = district_ids.astype(int)
    result["state"] = result["Land"].map(normalize_state)
    if result["state"].isna().any():
        rows = result.loc[result["state"].isna(), ["Wahlkreis", "Land"]].head(10)
        raise ValueError(f"Unexpected summary state rows: {rows.to_dict(orient='records')}")
    result["electionMethod"] = result["Bezirksart"].map(normalize_method)
    return result


def district_party_columns(frame: pd.DataFrame, prefix: str) -> list[str]:
    excluded = {"gültige", "ungültige", "gueltige", "ungueltige"}
    columns = [
        column
        for column in frame.columns
        if column.startswith(prefix)
        and column[len(prefix):].strip().lower() not in excluded
    ]
    if not columns:
        raise ValueError(f"No party columns found for prefix {prefix!r}")
    return columns


def reshape_polling_district_votes(
    frame: pd.DataFrame,
    *,
    prefix: str,
    vote_type: VoteType,
) -> pd.DataFrame:
    """Convert wide party columns to one row per source row and party."""

    party_columns = district_party_columns(frame, prefix)
    votes = frame.loc[:, party_columns].copy()
    for column in party_columns:
        votes[column] = numeric_votes(votes[column])
    votes.columns = [canonical_party_name(column[len(prefix):]) for column in party_columns]
    votes = votes.T.groupby(level=0).sum().T

    identifiers = frame.loc[:, ["districtId", "state", "electionMethod"]].copy()
    identifiers["sourceRow"] = frame.index
    long = pd.concat([identifiers, votes], axis=1).melt(
        id_vars=["sourceRow", "districtId", "state", "electionMethod"],
        var_name="party",
        value_name="votes",
    )
    long["voteType"] = vote_type
    return long[
        [
            "sourceRow",
            "districtId",
            "state",
            "party",
            "voteType",
            "electionMethod",
            "votes",
        ]
    ]


def aggregate_to_constituencies(polling_district_votes: pd.DataFrame) -> pd.DataFrame:
    """Aggregate Wahlbezirke to the constituency granularity used by the app."""

    result = (
        polling_district_votes.groupby(
            ["districtId", "state", "party", "voteType", "electionMethod"],
            as_index=False,
            sort=True,
        )["votes"]
        .sum()
    )
    return result[result["votes"] > 0].reset_index(drop=True)


def normalize_state_statistic_rows(frame: pd.DataFrame) -> pd.DataFrame:
    """Normalize dimensions but keep summary rows visible for inspection."""

    required = {"Land", "Erst-/Zweitstimme", "Geschlecht", "Geburtsjahresgruppe"}
    require_columns(frame, required, label="State statistics CSV")
    result = frame.copy()
    result["state"] = result["Land"].map(normalize_state)
    result["voteType"] = result["Erst-/Zweitstimme"].map(normalize_vote_type)
    result["gender"] = result["Geschlecht"].map(normalize_gender)
    result["ageGroup"] = result["Geburtsjahresgruppe"].map(normalize_age_group)
    return result


def select_state_statistic_detail_rows(frame: pd.DataFrame) -> pd.DataFrame:
    dimensions = ["state", "voteType", "gender", "ageGroup"]
    require_columns(frame, set(dimensions), label="Normalized state statistics")
    return frame.loc[frame[dimensions].notna().all(axis=1)].copy()


def statistic_party_columns(
    frame: pd.DataFrame,
    *,
    extra_metadata: Iterable[str] = (),
) -> list[str]:
    excluded = STATISTIC_METADATA_COLUMNS | set(extra_metadata)
    return [column for column in frame.columns if column not in excluded]


def reshape_state_statistic_votes(frame: pd.DataFrame) -> pd.DataFrame:
    """Convert the published statistical party columns to long absolute values."""

    party_columns = statistic_party_columns(
        frame,
        extra_metadata={"state", "voteType", "gender", "ageGroup"},
    )
    values = frame.loc[:, party_columns].copy()
    for column in party_columns:
        values[column] = numeric_votes(values[column])
    values.columns = [canonical_party_name(column) for column in party_columns]
    values = values.T.groupby(level=0).sum().T

    long = pd.concat(
        [frame[["state", "voteType", "gender", "ageGroup"]], values],
        axis=1,
    ).melt(
        id_vars=["state", "voteType", "gender", "ageGroup"],
        var_name="party",
        value_name="statisticVotes",
    )
    return (
        long.groupby(
            ["state", "voteType", "party", "gender", "ageGroup"],
            as_index=False,
            sort=True,
        )["statisticVotes"]
        .sum()
    )


def calculate_demographic_profiles(statistic_votes: pd.DataFrame) -> pd.DataFrame:
    """Use the rounded statistics as percentages, not as official totals."""

    totals = statistic_votes.groupby(
        ["state", "voteType", "party"]
    )["statisticVotes"].transform("sum")
    result = statistic_votes.loc[totals > 0].copy()
    result["statisticTotal"] = totals.loc[totals > 0]
    result["share"] = result["statisticVotes"] / result["statisticTotal"]
    return result.reset_index(drop=True)


def find_method_column(frame: pd.DataFrame) -> str:
    for candidate in METHOD_COLUMN_CANDIDATES:
        if candidate in frame.columns:
            return candidate
    raise ValueError(
        "No election-method column found. Expected one of: "
        + ", ".join(METHOD_COLUMN_CANDIDATES)
    )


def normalize_optional_method(value: object):
    text = str(value).strip().lower()
    if text in {"", "nan", "summe", "gesamt", "zusammen", "insgesamt"}:
        return None
    return normalize_method(value)


def normalize_federal_method_rows(frame: pd.DataFrame) -> pd.DataFrame:
    method_column = find_method_column(frame)
    required = {"Erst-/Zweitstimme", "Geschlecht", "Geburtsjahresgruppe"}
    require_columns(frame, required, label="Federal method statistics CSV")
    result = frame.copy()
    result["voteType"] = result["Erst-/Zweitstimme"].map(normalize_vote_type)
    result["gender"] = result["Geschlecht"].map(normalize_gender)
    result["ageGroup"] = result["Geburtsjahresgruppe"].map(normalize_age_group)
    result["electionMethod"] = result[method_column].map(normalize_optional_method)
    return result


def select_federal_method_detail_rows(frame: pd.DataFrame) -> pd.DataFrame:
    dimensions = ["voteType", "gender", "ageGroup", "electionMethod"]
    return frame.loc[frame[dimensions].notna().all(axis=1)].copy()


def reshape_federal_method_votes(frame: pd.DataFrame) -> pd.DataFrame:
    party_columns = statistic_party_columns(
        frame,
        extra_metadata={"voteType", "gender", "ageGroup", "electionMethod", "state"},
    )
    values = frame.loc[:, party_columns].copy()
    for column in party_columns:
        values[column] = numeric_votes(values[column])
    values.columns = [canonical_party_name(column) for column in party_columns]
    values = values.T.groupby(level=0).sum().T

    long = pd.concat(
        [frame[["voteType", "gender", "ageGroup", "electionMethod"]], values],
        axis=1,
    ).melt(
        id_vars=["voteType", "gender", "ageGroup", "electionMethod"],
        var_name="party",
        value_name="seedVotes",
    )
    return (
        long.groupby(
            ["voteType", "party", "gender", "ageGroup", "electionMethod"],
            as_index=False,
            sort=True,
        )["seedVotes"]
        .sum()
    )


def calculate_federal_method_weights(seed_votes: pd.DataFrame) -> pd.DataFrame:
    totals = seed_votes.groupby(["voteType", "party"])["seedVotes"].transform("sum")
    result = seed_votes.loc[totals > 0].copy()
    result["seedTotal"] = totals.loc[totals > 0]
    result["weight"] = result["seedVotes"] / result["seedTotal"]
    return result.reset_index(drop=True)
