from __future__ import annotations

import unittest

import numpy as np
import pandas as pd

from scripts.election_data.btw2021 import APP_AGE_GROUPS
from scripts.election_data.pipeline import distribute_district_votes
from scripts.election_data.profiles import (
    build_state_method_profiles,
    iterative_proportional_fit,
)
from scripts.election_data.validation import validate_vote_entries


class IterativeProportionalFittingTest(unittest.TestCase):
    def test_matches_both_margins(self) -> None:
        seed = np.array([[9.0, 1.0], [2.0, 8.0]])
        rows = np.array([40.0, 60.0])
        columns = np.array([55.0, 45.0])

        fitted = iterative_proportional_fit(seed, rows, columns)

        np.testing.assert_allclose(fitted.sum(axis=1), rows, atol=1e-8)
        np.testing.assert_allclose(fitted.sum(axis=0), columns, atol=1e-8)


class DistributionTest(unittest.TestCase):
    def test_preserves_constituency_and_state_margins(self) -> None:
        district_totals = pd.DataFrame.from_records(
            [
                {
                    "districtId": 1,
                    "state": "Testland",
                    "party": "A",
                    "voteType": "2",
                    "electionMethod": "in-person",
                    "votes": 60.0,
                },
                {
                    "districtId": 1,
                    "state": "Testland",
                    "party": "A",
                    "voteType": "2",
                    "electionMethod": "postal",
                    "votes": 40.0,
                },
            ]
        )
        records = []
        for gender in ("m", "w"):
            for age_group in APP_AGE_GROUPS:
                records.append(
                    {
                        "state": "Testland",
                        "voteType": "2",
                        "party": "A",
                        "gender": gender,
                        "ageGroup": age_group,
                        "share": 1 / 12,
                    }
                )
        demographics = pd.DataFrame.from_records(records)

        profiles = build_state_method_profiles(district_totals, demographics)
        entries = distribute_district_votes(district_totals, profiles)
        report = validate_vote_entries(entries, district_totals, profiles)

        self.assertLessEqual(report.maxDistrictMethodError, 1e-6)
        self.assertLessEqual(report.maxStateDemographicError, 1e-6)


if __name__ == "__main__":
    unittest.main()
