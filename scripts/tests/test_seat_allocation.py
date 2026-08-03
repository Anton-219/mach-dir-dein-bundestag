from __future__ import annotations

import unittest

from scripts.election import (
    PartyQualificationRules,
    allocate_sainte_lague,
    qualify_parties,
)
from scripts.tests.reference_2021 import (
    ALLOCATED_SECOND_VOTES,
    DIRECT_MANDATES,
    EXPECTED_SEATS,
    PARTY_SECOND_VOTES,
    THRESHOLD_EXEMPT_PARTIES,
    TOTAL_SEATS,
    TOTAL_VALID_SECOND_VOTES,
)


class SeatAllocationReferenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.rules = PartyQualificationRules(
            exempt_parties=THRESHOLD_EXEMPT_PARTIES,
        )

    def test_reference_votes_have_expected_allocated_total(self) -> None:
        self.assertEqual(sum(PARTY_SECOND_VOTES.values()), ALLOCATED_SECOND_VOTES)

    def test_2021_parties_qualify_under_documented_rules(self) -> None:
        eligible = qualify_parties(
            PARTY_SECOND_VOTES,
            total_valid_votes=TOTAL_VALID_SECOND_VOTES,
            direct_mandates_by_party=DIRECT_MANDATES,
            rules=self.rules,
        )

        self.assertEqual(tuple(eligible), tuple(PARTY_SECOND_VOTES))

    def test_linke_requires_direct_mandate_rule_in_reference_result(self) -> None:
        eligible_without_direct_mandates = qualify_parties(
            PARTY_SECOND_VOTES,
            total_valid_votes=TOTAL_VALID_SECOND_VOTES,
            rules=self.rules,
        )

        self.assertNotIn("DIE LINKE", eligible_without_direct_mandates)

    def test_ssw_requires_minority_party_exemption_in_reference_result(self) -> None:
        eligible_without_exemption = qualify_parties(
            PARTY_SECOND_VOTES,
            total_valid_votes=TOTAL_VALID_SECOND_VOTES,
            direct_mandates_by_party=DIRECT_MANDATES,
        )

        self.assertNotIn("SSW", eligible_without_exemption)

    def test_2021_result_matches_official_2023_reform_calculation(self) -> None:
        eligible = qualify_parties(
            PARTY_SECOND_VOTES,
            total_valid_votes=TOTAL_VALID_SECOND_VOTES,
            direct_mandates_by_party=DIRECT_MANDATES,
            rules=self.rules,
        )
        seats = allocate_sainte_lague(eligible, seat_count=TOTAL_SEATS)

        self.assertEqual(seats, EXPECTED_SEATS)
        self.assertEqual(sum(seats.values()), TOTAL_SEATS)

    def test_allocator_is_not_specific_to_the_2021_fixture(self) -> None:
        seats = allocate_sainte_lague(
            {"A": 60, "B": 40},
            seat_count=10,
        )

        self.assertEqual(seats, {"A": 6, "B": 4})

    def test_threshold_is_inclusive(self) -> None:
        eligible = qualify_parties(
            {"AT_THRESHOLD": 5, "BELOW": 4},
            total_valid_votes=100,
        )

        self.assertIn("AT_THRESHOLD", eligible)
        self.assertNotIn("BELOW", eligible)


if __name__ == "__main__":
    unittest.main()
