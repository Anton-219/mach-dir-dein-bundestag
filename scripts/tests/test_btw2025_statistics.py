from __future__ import annotations

import unittest

import pandas as pd

from scripts.election_data.btw2025_statistics import reshape_state_statistic_votes


class Btw2025StatisticPartyNamesTest(unittest.TestCase):
    def test_published_linke_name_matches_the_application_party_identifier(self) -> None:
        source = pd.DataFrame.from_records(
            [
                {
                    "state": "Schleswig-Holstein",
                    "voteType": "2",
                    "gender": "m",
                    "ageGroup": "18-24",
                    "Die Linke": "12",
                    "dar. BSW": "3",
                }
            ]
        )

        reshaped = reshape_state_statistic_votes(source)

        self.assertEqual(set(reshaped["party"]), {"DIE LINKE", "BSW"})
        self.assertEqual(reshaped["statisticVotes"].sum(), 15.0)


if __name__ == "__main__":
    unittest.main()
