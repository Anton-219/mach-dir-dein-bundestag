from __future__ import annotations

import re
from pathlib import Path

import pandas as pd

from .btw2021 import (
    canonical_party_name as canonical_party_name_2021,
    normalize_state,
    normalize_vote_type,
    read_local_csv,
)
from .models import AgeGroup, Gender, VoteType
from .notebook_steps import numeric_votes, require_columns

BTW2025_AGE_GROUPS: tuple[AgeGroup, ...] = (
    "18-24",
    "25-34",
    "35-44",
    "45-59",
    "60-69",
    "70+",
)

_DISTRICT_VOTE_SUFFIXES: dict[VoteType, str] = {
    "1": " - Erststimmen",
    "2": " - Zweitstimmen",
}

_PARTY_ALIASES_2025 = {
    "Die Linke": "DIE LINKE",
}


def _clean_text(value: object) -> str:
    return re.sub(r"\s+", " ", str(value).replace("\ufeff", "")).strip()


def canonical_party_name(value: object) -> str:
    name = canonical_party_name_2021(value)
    return _PARTY_ALIASES_2025.get(name, name)


def normalize_gender(value: object) -> Gender | None:
    """Map the published 2025 gender categories to the app's two-value field.

    The internal value ``m`` represents the source category ``m|d|o`` and must
    therefore not be interpreted as exclusively male.
    """

    gender = _clean_text(value).lower().replace(" ", "")
    if gender in {
        "m",
        "m|d|o",
        "m/d/o",
        "m,d,o",
        "männlich|divers|ohneangabe",
        "maennlich|divers|ohneangabe",
    }:
        return "m"
    if gender in {"w", "weiblich", "frau", "frauen"}:
        return "w"
    if gender in {"summe", "gesamt", "insgesamt", "nan", ""}:
        return None
    raise ValueError(f"Unknown 2025 gender value: {value!r}")


def _normalize_age_label(value: object) -> str:
    label = _clean_text(value)
    label = label.replace("≤", "<=").replace("—", "-").replace("–", "-")
    label = re.sub(r"\s*-\s*", "-", label)
    label = re.sub(r"\s*<=\s*", "<=", label)
    return label


def normalize_age_group(value: object) -> AgeGroup | None:
    """Convert the published 2025 birth-year cohorts to election-age labels."""

    label = _normalize_age_label(value)
    mapping: dict[str, AgeGroup] = {
        "18-24": "18-24",
        "25-34": "25-34",
        "35-44": "35-44",
        "45-59": "45-59",
        "60-69": "60-69",
        "70+": "70+",
        "2001-2007": "18-24",
        "1991-2000": "25-34",
        "1981-1990": "35-44",
        "1966-1980": "45-59",
        "1956-1965": "60-69",
        "<=1955": "70+",
        "bis 1955": "70+",
        "1955 und früher": "70+",
        "1955 und frueher": "70+",
    }
    if label in mapping:
        return mapping[label]
    if label.lower() in {"summe", "gesamt", "insgesamt", "nan", ""}:
        return None
    raise ValueError(f"Unknown 2025 age-group value: {value!r}")


def _find_polling_district_header_row(path: Path) -> int:
    with path.open("r", encoding="utf-8-sig") as handle:
        for row_number, line in enumerate(handle):
            columns = line.rstrip("\r\n").split(";")
            if len(columns) >= 2 and columns[0] == "Wahlkreis" and columns[1] == "Land":
                return row_number
    raise ValueError(
        "Could not find the polling-district header row beginning with "
        "'Wahlkreis;Land'."
    )


def _drop_empty_trailing_columns(frame: pd.DataFrame) -> pd.DataFrame:
    visible = [
        column
        for column in frame.columns
        if str(column).strip() and not str(column).startswith("Unnamed:")
    ]
    return frame.loc[:, visible].copy()


def read_polling_district_csv(path: str | Path) -> pd.DataFrame:
    """Read the official 2025 polling-district file below its metadata preamble."""

    csv_path = Path(path)
    if not csv_path.is_file():
        raise FileNotFoundError(f"CSV input does not exist: {csv_path}")
    header_row = _find_polling_district_header_row(csv_path)
    frame = pd.read_csv(
        csv_path,
        sep=";",
        encoding="utf-8-sig",
        skiprows=header_row,
        dtype=str,
        keep_default_na=False,
        low_memory=False,
    )
    return _drop_empty_trailing_columns(frame)


def read_representative_statistics_csv(path: str | Path) -> pd.DataFrame:
    """Read the 2025 representative statistics while ignoring ``#`` comments."""

    return _drop_empty_trailing_columns(read_local_csv(path, comment="#"))


def normalize_state_statistic_rows(frame: pd.DataFrame) -> pd.DataFrame:
    """Normalize 2025 statistic dimensions while retaining summary rows."""

    required = {"Land", "Erst-/Zweitstimme", "Geschlecht", "Geburtsjahresgruppe"}
    require_columns(frame, required, label="2025 state statistics CSV")
    result = frame.copy()
    result["state"] = result["Land"].map(normalize_state)
    result["voteType"] = result["Erst-/Zweitstimme"].map(normalize_vote_type)
    result["gender"] = result["Geschlecht"].map(normalize_gender)
    result["ageGroup"] = result["Geburtsjahresgruppe"].map(normalize_age_group)
    return result


def district_party_columns(frame: pd.DataFrame, vote_type: VoteType) -> list[str]:
    """Return party columns for the 2025 ``<party> - ...stimmen`` layout."""

    suffix = _DISTRICT_VOTE_SUFFIXES[vote_type]
    excluded = {"Ungültige", "Gültige"}
    columns = []
    for column in frame.columns:
        cleaned = _clean_text(column)
        if not cleaned.endswith(suffix):
            continue
        party_name = cleaned[: -len(suffix)].strip()
        if party_name not in excluded:
            columns.append(column)
    if not columns:
        raise ValueError(
            f"No 2025 party columns found for vote type {vote_type!r} "
            f"and suffix {suffix!r}"
        )
    return columns


def reshape_polling_district_votes(
    frame: pd.DataFrame,
    *,
    vote_type: VoteType,
) -> pd.DataFrame:
    """Convert 2025 party columns to one row per polling district and party."""

    require_columns(
        frame,
        {"districtId", "state", "electionMethod"},
        label="Normalized 2025 district CSV",
    )
    party_columns = district_party_columns(frame, vote_type)
    suffix = _DISTRICT_VOTE_SUFFIXES[vote_type]

    votes = frame.loc[:, party_columns].copy()
    for column in party_columns:
        votes[column] = numeric_votes(votes[column])
    votes.columns = [
        canonical_party_name(_clean_text(column)[: -len(suffix)])
        for column in party_columns
    ]
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
