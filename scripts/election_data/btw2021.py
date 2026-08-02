from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable

import pandas as pd

from .models import AgeGroup, ElectionMethod, Gender, VoteType

STATE_CODE_TO_NAME = {
    "01": "Schleswig-Holstein",
    "02": "Hamburg",
    "03": "Niedersachsen",
    "04": "Bremen",
    "05": "Nordrhein-Westfalen",
    "06": "Hessen",
    "07": "Rheinland-Pfalz",
    "08": "Baden-Württemberg",
    "09": "Bayern",
    "10": "Saarland",
    "11": "Berlin",
    "12": "Brandenburg",
    "13": "Mecklenburg-Vorpommern",
    "14": "Sachsen",
    "15": "Sachsen-Anhalt",
    "16": "Thüringen",
}

STATE_ABBREVIATION_TO_NAME = {
    "SH": "Schleswig-Holstein",
    "HH": "Hamburg",
    "NI": "Niedersachsen",
    "HB": "Bremen",
    "NW": "Nordrhein-Westfalen",
    "HE": "Hessen",
    "RP": "Rheinland-Pfalz",
    "BW": "Baden-Württemberg",
    "BY": "Bayern",
    "SL": "Saarland",
    "BE": "Berlin",
    "BB": "Brandenburg",
    "MV": "Mecklenburg-Vorpommern",
    "SN": "Sachsen",
    "ST": "Sachsen-Anhalt",
    "TH": "Thüringen",
}

APP_AGE_GROUPS: tuple[AgeGroup, ...] = (
    "18-24",
    "25-34",
    "35-44",
    "45-54",
    "55-64",
    "65+",
)
APP_GENDERS: tuple[Gender, ...] = ("m", "w")
APP_METHODS: tuple[ElectionMethod, ...] = ("in-person", "postal")

_METADATA_COLUMNS = {
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
}

_PARTY_ALIASES = {
    "BÜNDNIS 90/DIE GRÜNEN": "GRÜNE",
    "BÜNDNIS90/DIE GRÜNEN": "GRÜNE",
    "KlimalisteBW": "Klimaliste BW",
    "Bündnis21": "BÜNDNIS21",
    "III. Weg": "III. Weg",
}


def _clean_text(value: object) -> str:
    return re.sub(r"\s+", " ", str(value).replace("\ufeff", "")).strip()


def canonical_party_name(value: object) -> str:
    name = _clean_text(value)
    if name.lower().startswith("dar. "):
        name = name[5:].strip()
    if name.lower() in {"other", "sonstige"}:
        return "Sonstige"
    return _PARTY_ALIASES.get(name, name)


def normalize_state(value: object) -> str | None:
    state = _clean_text(value)
    if state in {"Bund", "Bundesgebiet", "Deutschland", "Summe", "BE-O", "BE-W"}:
        return None
    if state in STATE_CODE_TO_NAME:
        return STATE_CODE_TO_NAME[state]
    if state.zfill(2) in STATE_CODE_TO_NAME and state.isdigit():
        return STATE_CODE_TO_NAME[state.zfill(2)]
    if state in STATE_ABBREVIATION_TO_NAME:
        return STATE_ABBREVIATION_TO_NAME[state]
    if state in STATE_CODE_TO_NAME.values():
        return state
    raise ValueError(f"Unknown state value: {value!r}")


def normalize_gender(value: object) -> Gender | None:
    gender = _clean_text(value).lower()
    if gender in {"m", "männlich", "maennlich", "männer", "maenner"}:
        return "m"
    if gender in {"w", "weiblich", "frauen", "frau"}:
        return "w"
    if gender in {"summe", "gesamt", "insgesamt", "nan", ""}:
        return None
    raise ValueError(f"Unknown gender value: {value!r}")


def _normalize_age_label(value: object) -> str:
    label = _clean_text(value)
    label = label.replace("—", "-").replace("–", "-")
    return re.sub(r"\s*-\s*", "-", label)


def normalize_age_group(value: object) -> AgeGroup | None:
    label = _normalize_age_label(value)
    mapping: dict[str, AgeGroup] = {
        "18-24": "18-24",
        "25-34": "25-34",
        "35-44": "35-44",
        "45-54": "45-54",
        "55-64": "55-64",
        "65+": "65+",
        "1997-2003": "18-24",
        "1987-1996": "25-34",
        "1977-1986": "35-44",
        "1962-1976": "45-54",
        "1952-1961": "55-64",
        "1951 und früher": "65+",
        "1951 und frueher": "65+",
    }
    if label in mapping:
        return mapping[label]
    if label.lower() in {"summe", "gesamt", "insgesamt", "nan", ""}:
        return None
    raise ValueError(f"Unknown age-group value: {value!r}")


def normalize_vote_type(value: object) -> VoteType | None:
    text = _clean_text(value).upper()
    if text in {"1", "E", "ERSTSTIMME"}:
        return "1"
    if text in {"2", "Z", "ZWEITSTIMME"}:
        return "2"
    if text in {"SUMME", "GESAMT", "", "NAN"}:
        return None
    raise ValueError(f"Unknown vote-type value: {value!r}")


def normalize_method(value: object) -> ElectionMethod:
    method = _clean_text(value).lower()
    if method in {"5", "brief", "briefwahl", "postal"}:
        return "postal"
    if method in {
        "0",
        "6",
        "8",
        "urne",
        "urnenwahl",
        "in-person",
        "in person",
        "sonderwahlbezirk",
    }:
        return "in-person"
    raise ValueError(f"Unknown election-method value: {value!r}")


def read_local_csv(path: str | Path, *, comment: str | None = None) -> pd.DataFrame:
    csv_path = Path(path)
    if not csv_path.is_file():
        raise FileNotFoundError(f"CSV input does not exist: {csv_path}")
    return pd.read_csv(
        csv_path,
        sep=";",
        encoding="utf-8-sig",
        comment=comment,
        dtype=str,
        keep_default_na=False,
        low_memory=False,
    )


def _numeric(series: pd.Series) -> pd.Series:
    cleaned = series.astype(str).str.strip().replace({"": "0", "-": "0"})
    result = pd.to_numeric(cleaned, errors="coerce")
    if result.isna().any():
        examples = cleaned[result.isna()].head(5).tolist()
        raise ValueError(f"Non-numeric vote values encountered: {examples}")
    return result.astype(float)


def load_district_method_totals(path: str | Path) -> pd.DataFrame:
    """Read the official 2021 polling-district CSV and aggregate it to constituencies.

    The source remains at polling-district granularity only during import. The returned
    frame contains one row per constituency, party, vote type and election method.
    District type 5 is postal; all other documented district types (0, 6 and 8) are
    grouped as in-person so that no reported vote is discarded.
    """

    frame = read_local_csv(path)
    required = {"Wahlkreis", "Land", "Bezirksart"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"District CSV is missing required columns: {sorted(missing)}")

    base = frame.loc[:, ["Wahlkreis", "Land", "Bezirksart"]].copy()
    base["districtId"] = pd.to_numeric(base["Wahlkreis"], errors="raise").astype(int)
    base["state"] = base["Land"].map(normalize_state)
    base["electionMethod"] = base["Bezirksart"].map(normalize_method)

    chunks: list[pd.DataFrame] = []
    for prefix, vote_type in (("E_", "1"), ("Z_", "2")):
        excluded = {f"{prefix}Ungültige", f"{prefix}Gültige"}
        party_columns = [
            column
            for column in frame.columns
            if column.startswith(prefix) and column not in excluded
        ]
        if not party_columns:
            raise ValueError(f"District CSV contains no {prefix} party columns")

        votes = frame.loc[:, party_columns].copy()
        for column in party_columns:
            votes[column] = _numeric(votes[column])
        votes.columns = [canonical_party_name(column[len(prefix):]) for column in party_columns]
        votes = votes.T.groupby(level=0).sum().T

        combined = pd.concat(
            [base.loc[:, ["districtId", "state", "electionMethod"]], votes], axis=1
        )
        long = combined.melt(
            id_vars=["districtId", "state", "electionMethod"],
            var_name="party",
            value_name="votes",
        )
        long["voteType"] = vote_type
        chunks.append(long)

    result = pd.concat(chunks, ignore_index=True)
    result = (
        result.groupby(
            ["districtId", "state", "party", "voteType", "electionMethod"],
            as_index=False,
            sort=True,
        )["votes"]
        .sum()
    )
    result = result[result["votes"] > 0].reset_index(drop=True)
    return result.loc[
        :, ["districtId", "state", "party", "voteType", "electionMethod", "votes"]
    ]


def _party_columns(frame: pd.DataFrame, extra_metadata: Iterable[str] = ()) -> list[str]:
    excluded = _METADATA_COLUMNS | set(extra_metadata)
    return [column for column in frame.columns if column not in excluded]


def load_state_demographic_profiles(path: str | Path) -> pd.DataFrame:
    """Read state-level representative statistics and return demographic shares."""

    frame = read_local_csv(path, comment="#")
    required = {"Land", "Erst-/Zweitstimme", "Geschlecht", "Geburtsjahresgruppe"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(
            f"State demographic CSV is missing required columns: {sorted(missing)}"
        )

    frame = frame.copy()
    frame["state"] = frame["Land"].map(normalize_state)
    frame["voteType"] = frame["Erst-/Zweitstimme"].map(normalize_vote_type)
    frame["gender"] = frame["Geschlecht"].map(normalize_gender)
    frame["ageGroup"] = frame["Geburtsjahresgruppe"].map(normalize_age_group)
    frame = frame[
        frame["state"].notna()
        & frame["voteType"].notna()
        & frame["gender"].notna()
        & frame["ageGroup"].notna()
    ].copy()

    party_columns = _party_columns(
        frame,
        extra_metadata={"state", "voteType", "gender", "ageGroup"},
    )
    values = frame.loc[:, party_columns].copy()
    for column in party_columns:
        values[column] = _numeric(values[column])
    values.columns = [canonical_party_name(column) for column in party_columns]
    values = values.T.groupby(level=0).sum().T

    long = pd.concat(
        [frame.loc[:, ["state", "voteType", "gender", "ageGroup"]], values], axis=1
    ).melt(
        id_vars=["state", "voteType", "gender", "ageGroup"],
        var_name="party",
        value_name="statisticVotes",
    )
    long = (
        long.groupby(
            ["state", "voteType", "party", "gender", "ageGroup"],
            as_index=False,
            sort=True,
        )["statisticVotes"]
        .sum()
    )
    totals = long.groupby(["state", "voteType", "party"])["statisticVotes"].transform("sum")
    long = long[totals > 0].copy()
    long["share"] = long["statisticVotes"] / totals[totals > 0]
    return long.loc[
        :, ["state", "voteType", "party", "gender", "ageGroup", "share"]
    ].reset_index(drop=True)


def load_federal_method_seed(path: str | Path) -> pd.DataFrame:
    """Read an optional federal method-by-demographic CSV used as the IPF seed.

    The file must contain the same party columns as the representative statistics and
    one election-method column named ``Bezirksart``, ``Art der Stimmabgabe`` or
    ``Wahlart``. It is never downloaded by this package.
    """

    frame = read_local_csv(path, comment="#")
    method_column = next(
        (
            candidate
            for candidate in ("Bezirksart", "Art der Stimmabgabe", "Wahlart")
            if candidate in frame.columns
        ),
        None,
    )
    if method_column is None:
        raise ValueError(
            "Federal method CSV needs one of: Bezirksart, Art der Stimmabgabe, Wahlart"
        )
    required = {"Erst-/Zweitstimme", "Geschlecht", "Geburtsjahresgruppe"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(
            f"Federal method CSV is missing required columns: {sorted(missing)}"
        )

    frame = frame.copy()
    frame["voteType"] = frame["Erst-/Zweitstimme"].map(normalize_vote_type)
    frame["gender"] = frame["Geschlecht"].map(normalize_gender)
    frame["ageGroup"] = frame["Geburtsjahresgruppe"].map(normalize_age_group)
    frame["electionMethod"] = frame[method_column].map(normalize_method)
    frame = frame[
        frame["voteType"].notna()
        & frame["gender"].notna()
        & frame["ageGroup"].notna()
    ].copy()

    party_columns = _party_columns(
        frame,
        extra_metadata={"state", "voteType", "gender", "ageGroup", "electionMethod"},
    )
    values = frame.loc[:, party_columns].copy()
    for column in party_columns:
        values[column] = _numeric(values[column])
    values.columns = [canonical_party_name(column) for column in party_columns]
    values = values.T.groupby(level=0).sum().T

    long = pd.concat(
        [
            frame.loc[:, ["voteType", "gender", "ageGroup", "electionMethod"]],
            values,
        ],
        axis=1,
    ).melt(
        id_vars=["voteType", "gender", "ageGroup", "electionMethod"],
        var_name="party",
        value_name="seedVotes",
    )
    long = (
        long.groupby(
            ["voteType", "party", "gender", "ageGroup", "electionMethod"],
            as_index=False,
            sort=True,
        )["seedVotes"]
        .sum()
    )
    totals = long.groupby(["voteType", "party"])["seedVotes"].transform("sum")
    long = long[totals > 0].copy()
    long["weight"] = long["seedVotes"] / totals[totals > 0]
    return long.loc[
        :, ["voteType", "party", "gender", "ageGroup", "electionMethod", "weight"]
    ].reset_index(drop=True)
