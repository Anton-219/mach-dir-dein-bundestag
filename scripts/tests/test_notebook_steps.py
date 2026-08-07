from __future__ import annotations

import unittest

import pandas as pd

from scripts.election_data.btw2021 import APP_AGE_GROUPS, normalize_age_group
from scripts.election_data.notebook_steps import (
    calculate_demographic_profiles,
    inspect_district_rows,
    normalize_district_rows,
    select_usable_district_rows,
)


class DistrictRowDiagnosticsTest(unittest.TestCase):
    def test_missing_constituency_rows_are_visible_before_removal(self) -> None:
        source = pd.DataFrame(
            [
                {"Wahlkreis": "001", "Land": "01", "Bezirksart": "0"},
                {"Wahlkreis": "NaN", "Land": "", "Bezirksart": ""},
            ]
        )

        diagnostics = inspect_district_rows(source)

        self.assertEqual(diagnostics["status"].tolist(), ["usable", "missing"])
        selected = select_usable_district_rows(source, diagnostics)
        normalized = normalize_district_rows(selected)
        self.assertEqual(normalized["districtId"].tolist(), [1])
        self.assertEqual(normalized["state"].tolist(), ["Schleswig-Holstein"])

    def test_nonempty_invalid_constituency_value_is_not_silently_removed(self) -> None:
        source = pd.DataFrame(
            [{"Wahlkreis": "Gesamt", "Land": "01", "Bezirksart": "0"}]
        )
        diagnostics = inspect_district_rows(source)

        self.assertEqual(diagnostics["status"].tolist(), ["invalid"])
        with self.assertRaisesRegex(ValueError, "Gesamt"):
            select_usable_district_rows(source, diagnostics)


class AgeGroupNormalizationTest(unittest.TestCase):
    def test_2021_birth_year_groups_map_to_shared_application_groups(self) -> None:
        expected = {
            "1997-2003": "18-24",
            "1987-1996": "25-34",
            "1977-1986": "35-44",
            "1962-1976": "45-59",
            "1952-1961": "60-69",
            "1951 und früher": "70+",
        }

        self.assertEqual(
            APP_AGE_GROUPS,
            ("18-24", "25-34", "35-44", "45-59", "60-69", "70+"),
        )
        for source, age_group in expected.items():
            with self.subTest(source=source):
                self.assertEqual(normalize_age_group(source), age_group)

    def test_obsolete_age_group_labels_are_rejected(self) -> None:
        for label in ("45-54", "55-64", "65+"):
            with self.subTest(label=label):
                with self.assertRaises(ValueError):
                    normalize_age_group(label)


class DemographicShareTest(unittest.TestCase):
    def test_rounded_statistical_counts_are_used_as_shares(self) -> None:
        statistics = pd.DataFrame.from_records(
            [
                {
                    "state": "Testland",
                    "voteType": "2",
                    "party": "A",
                    "gender": "m",
                    "ageGroup": "18-24",
                    "statisticVotes": 10.0,
                },
                {
                    "state": "Testland",
                    "voteType": "2",
                    "party": "A",
                    "gender": "w",
                    "ageGroup": "18-24",
                    "statisticVotes": 30.0,
                },
            ]
        )

        profiles = calculate_demographic_profiles(statistics)

        self.assertEqual(profiles["statisticTotal"].tolist(), [40.0, 40.0])
        self.assertEqual(profiles["share"].tolist(), [0.25, 0.75])


if __name__ == "__main__":
    unittest.main()
