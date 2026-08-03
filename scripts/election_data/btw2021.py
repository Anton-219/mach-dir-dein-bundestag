from __future__ import annotations

import re
from pathlib import Path

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
    if state.isdigit() and state.zfill(2) in STATE_CODE_TO_NAME:
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
