"""Official regression values for the 2021 result under the 2023 reform."""

from __future__ import annotations

SOURCE_TITLE = (
    "Musterberechnung: Sitzverteilung nach dem Bundeswahlgesetz mit dem "
    "Ergebnis der Bundestagswahl 2021"
)
SOURCE_URL = (
    "https://www.bundeswahlleiterin.de/dam/jcr/"
    "05f98632-634d-4582-8507-ab3267d66c01/"
    "bwg2025_sitzberechnung_erg2021.pdf"
)
SOURCE_DATE = "2024-11-26"

TOTAL_VALID_SECOND_VOTES = 46_298_387
ALLOCATED_SECOND_VOTES = 42_305_401
TOTAL_SEATS = 630

PARTY_SECOND_VOTES = {
    "CDU": 8_774_920,
    "SPD": 11_901_558,
    "AfD": 4_809_233,
    "FDP": 5_291_013,
    "DIE LINKE": 2_255_864,
    "GRÜNE": 6_814_408,
    "CSU": 2_402_827,
    "SSW": 55_578,
}

DIRECT_MANDATES = {
    "DIE LINKE": 3,
}

THRESHOLD_EXEMPT_PARTIES = frozenset({"SSW"})

EXPECTED_SEATS = {
    "CDU": 130,
    "SPD": 177,
    "AfD": 72,
    "FDP": 79,
    "DIE LINKE": 34,
    "GRÜNE": 101,
    "CSU": 36,
    "SSW": 1,
}
