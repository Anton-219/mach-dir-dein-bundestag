from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scripts.election_data.btw2025 import (
    BTW2025_AGE_GROUPS,
    normalize_age_group,
    normalize_gender,
    normalize_state_statistic_rows,
    read_polling_district_csv,
    read_representative_statistics_csv,
    reshape_polling_district_votes,
)
from scripts.election_data.notebook_steps import (
    aggregate_to_constituencies,
    calculate_demographic_profiles,
    normalize_district_rows,
    reshape_state_statistic_votes,
    select_state_statistic_detail_rows,
)
from scripts.election_data.pipeline import distribute_district_votes
from scripts.election_data.profiles import build_state_method_profiles
from scripts.election_data.validation import validate_vote_entries


class Btw2025NormalizationTest(unittest.TestCase):
    def test_combined_gender_category_remains_the_internal_m_group(self) -> None:
        self.assertEqual(normalize_gender("m|d|o"), "m")
        self.assertEqual(normalize_gender("w"), "w")
        self.assertIsNone(normalize_gender("Summe"))

    def test_birth_year_groups_use_the_published_2025_boundaries(self) -> None:
        expected = {
            "2001-2007": "18-24",
            "1991-2000": "25-34",
            "1981-1990": "35-44",
            "1966-1980": "45-59",
            "1956-1965": "60-69",
            "<=1955": "70+",
        }
        self.assertEqual(
            {source: normalize_age_group(source) for source in expected},
            expected,
        )


class Btw2025PollingDistrictTest(unittest.TestCase):
    def test_metadata_preamble_and_suffix_party_columns_are_supported(self) -> None:
        csv_text = """(c) source;;;;
;;;;
Title;;;;
;;;;
Wahlkreis;Land;Gemeindename;Wahlbezirk;Bezirksart;Ungültige - Erststimmen;Gültige - Erststimmen;SPD - Erststimmen;Die Linke - Erststimmen;Ungültige - Zweitstimmen;Gültige - Zweitstimmen;SPD - Zweitstimmen;Die Linke - Zweitstimmen;
001;01;Flensburg, Stadt;000001;0;1;15;10;5;2;18;11;7;
"""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "btw25_wbz_ergebnisse.csv"
            path.write_text(csv_text, encoding="utf-8")
            source = read_polling_district_csv(path)

        normalized = normalize_district_rows(source)
        first_votes = reshape_polling_district_votes(normalized, vote_type="1")
        second_votes = reshape_polling_district_votes(normalized, vote_type="2")

        self.assertEqual(set(first_votes["party"]), {"SPD", "DIE LINKE"})
        self.assertEqual(set(second_votes["party"]), {"SPD", "DIE LINKE"})
        self.assertEqual(first_votes["votes"].sum(), 15.0)
        self.assertEqual(second_votes["votes"].sum(), 18.0)


class Btw2025StatisticsPipelineTest(unittest.TestCase):
    def test_2025_age_groups_flow_through_shared_profile_fitting(self) -> None:
        district_csv = """meta;;;;
Wahlkreis;Land;Gemeindename;Wahlbezirk;Bezirksart;SPD - Zweitstimmen;
001;01;Flensburg, Stadt;000001;0;60;
001;01;Flensburg, Stadt;900001;5;40;
"""
        statistics_header = (
            "Land;Erst-/Zweitstimme;Geschlecht;Geburtsjahresgruppe;"
            "Summe;Ungültig;SPD;Sonstige;dar. BSW\n"
        )
        statistic_rows = []
        for gender in ("m|d|o", "w"):
            for index, birth_year_group in enumerate(
                (
                    "2001-2007",
                    "1991-2000",
                    "1981-1990",
                    "1966-1980",
                    "1956-1965",
                    "<=1955",
                ),
                start=1,
            ):
                statistic_rows.append(
                    f"01;2;{gender};{birth_year_group};100;0;{index};1;0\n"
                )
        statistics_csv = "# metadata\n" + statistics_header + "".join(statistic_rows)

        with tempfile.TemporaryDirectory() as directory:
            district_path = Path(directory) / "district.csv"
            statistics_path = Path(directory) / "statistics.csv"
            district_path.write_text(district_csv, encoding="utf-8")
            statistics_path.write_text(statistics_csv, encoding="utf-8")

            raw_districts = read_polling_district_csv(district_path)
            normalized_districts = normalize_district_rows(raw_districts)
            district_votes = reshape_polling_district_votes(
                normalized_districts,
                vote_type="2",
            )
            district_totals = aggregate_to_constituencies(district_votes)

            raw_statistics = read_representative_statistics_csv(statistics_path)
            normalized_statistics = normalize_state_statistic_rows(raw_statistics)
            detail_statistics = select_state_statistic_detail_rows(
                normalized_statistics
            )
            statistic_votes = reshape_state_statistic_votes(detail_statistics)
            demographic_profiles = calculate_demographic_profiles(statistic_votes)

            profiles = build_state_method_profiles(
                district_totals,
                demographic_profiles,
                age_groups=BTW2025_AGE_GROUPS,
            )
            entries = distribute_district_votes(district_totals, profiles)
            report = validate_vote_entries(entries, district_totals, profiles)

        self.assertEqual(set(profiles["ageGroup"]), set(BTW2025_AGE_GROUPS))
        self.assertEqual({entry.ageGroup for entry in entries}, set(BTW2025_AGE_GROUPS))
        self.assertLessEqual(report.maxDistrictMethodError, 1e-6)
        self.assertLessEqual(report.maxStateDemographicError, 1e-6)


if __name__ == "__main__":
    unittest.main()
