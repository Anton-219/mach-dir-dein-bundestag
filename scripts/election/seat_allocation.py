"""Reusable party qualification and Sainte-Laguë/Schepers allocation.

The notebook should orchestrate visible processing steps. Reusable calculations live
here so they can be imported from notebooks and verified independently.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from fractions import Fraction
import heapq
from typing import TypeAlias

VoteNumber: TypeAlias = int | float | Fraction


@dataclass(frozen=True)
class PartyQualificationRules:
    """Rules deciding which parties participate in a seat allocation."""

    vote_share_threshold: VoteNumber = Fraction(1, 20)
    minimum_direct_mandates: int = 3
    exempt_parties: frozenset[str] = frozenset()
    excluded_parties: frozenset[str] = frozenset()

    def __post_init__(self) -> None:
        threshold = _as_fraction(
            self.vote_share_threshold,
            label="vote_share_threshold",
        )
        if threshold < 0 or threshold > 1:
            raise ValueError("vote_share_threshold must be between 0 and 1.")
        if self.minimum_direct_mandates < 0:
            raise ValueError("minimum_direct_mandates must be non-negative.")


def _as_fraction(value: VoteNumber, *, label: str) -> Fraction:
    if isinstance(value, bool):
        raise TypeError(f"{label} must be a number, not bool.")

    try:
        number = value if isinstance(value, Fraction) else Fraction(str(value))
    except (TypeError, ValueError, ZeroDivisionError) as error:
        raise ValueError(f"{label} must be a finite number.") from error

    return number


def _normalise_votes(votes_by_party: Mapping[str, VoteNumber]) -> dict[str, Fraction]:
    normalised: dict[str, Fraction] = {}
    for party, votes in votes_by_party.items():
        if not isinstance(party, str) or not party:
            raise ValueError("Party identifiers must be non-empty strings.")

        number = _as_fraction(votes, label=f"votes for {party}")
        if number < 0:
            raise ValueError(f"Votes for {party} must be non-negative.")
        normalised[party] = number

    return normalised


def qualify_parties(
    votes_by_party: Mapping[str, VoteNumber],
    *,
    total_valid_votes: VoteNumber,
    direct_mandates_by_party: Mapping[str, int] | None = None,
    rules: PartyQualificationRules = PartyQualificationRules(),
) -> dict[str, Fraction]:
    """Return eligible parties while preserving the input order.

    A party qualifies when it is explicitly exempt, reaches the vote-share
    threshold, or reaches the configured direct-mandate count. Explicitly excluded
    aggregate buckets such as ``Sonstige`` never qualify.
    """

    votes = _normalise_votes(votes_by_party)
    total = _as_fraction(total_valid_votes, label="total_valid_votes")
    if total <= 0:
        raise ValueError("total_valid_votes must be greater than zero.")

    direct_mandates = direct_mandates_by_party or {}
    threshold = _as_fraction(
        rules.vote_share_threshold,
        label="vote_share_threshold",
    )

    eligible: dict[str, Fraction] = {}
    for party, party_votes in votes.items():
        if party in rules.excluded_parties:
            continue

        mandate_count = direct_mandates.get(party, 0)
        if isinstance(mandate_count, bool) or not isinstance(mandate_count, int):
            raise TypeError(f"Direct mandates for {party} must be an integer.")
        if mandate_count < 0:
            raise ValueError(f"Direct mandates for {party} must be non-negative.")

        is_eligible = (
            party in rules.exempt_parties
            or party_votes / total >= threshold
            or mandate_count >= rules.minimum_direct_mandates
        )
        if is_eligible:
            eligible[party] = party_votes

    return eligible


def allocate_sainte_lague(
    votes_by_party: Mapping[str, VoteNumber],
    *,
    seat_count: int,
) -> dict[str, int]:
    """Allocate seats with the Sainte-Laguë/Schepers highest-averages method.

    The quotient sequence is ``votes / 1, votes / 3, votes / 5, ...``. This is
    mathematically equivalent to the divisor method with standard rounding. Exact
    ties are resolved deterministically by the input order; official elections may
    require a lot decision in that exceptional case.
    """

    if isinstance(seat_count, bool) or not isinstance(seat_count, int):
        raise TypeError("seat_count must be an integer.")
    if seat_count < 0:
        raise ValueError("seat_count must be non-negative.")

    votes = _normalise_votes(votes_by_party)
    allocations = {party: 0 for party in votes}
    if seat_count == 0:
        return allocations
    if not votes or all(value == 0 for value in votes.values()):
        raise ValueError("At least one party must have votes when seats are allocated.")

    # Heap entries: negative quotient, stable input order, party identifier.
    heap: list[tuple[Fraction, int, str]] = []
    order_by_party: dict[str, int] = {}
    for order, (party, party_votes) in enumerate(votes.items()):
        order_by_party[party] = order
        heapq.heappush(heap, (-party_votes, order, party))

    for _ in range(seat_count):
        _, _, party = heapq.heappop(heap)
        allocations[party] += 1
        divisor = 2 * allocations[party] + 1
        next_quotient = votes[party] / divisor
        heapq.heappush(
            heap,
            (-next_quotient, order_by_party[party], party),
        )

    return allocations
