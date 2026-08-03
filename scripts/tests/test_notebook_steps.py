from __future__ import annotations

import unittest

import pandas as pd

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
