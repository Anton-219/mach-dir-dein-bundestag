# Electoral-system calculation architecture

These modules keep vote-scenario preparation, party qualification, proportional allocation, system orchestration, and React presentation separate.

## Shared boundary

- `createElectoralScenarioReference` scans the loaded first- and second-vote records once and records the complete state, district, and party geography. It does not copy or concatenate the large JSON datasets.
- `buildElectoralScenario` aggregates one filtered first- and second-vote scenario while retaining inactive states and empty districts from that reference.
- `validateElectoralScenario` rejects inconsistent vote-type activity, invalid totals, duplicate geography, and mismatched national, state, district, or party totals before a calculator runs.
- `resolveDistrictWinners` is shared by all strategies. Zero-vote districts remain empty. Positive exact ties use the stable party slug order and return a structured warning because the legal lot cannot be reproduced deterministically.
- `allocateSainteLague` allocates any fixed seat pool through the odd-divisor Sainte-Laguë/Schepers method. Allocation ties use stable keys and return a structured warning.
- `ElectoralSystemRegistry` selects calculators by the identifiers specified in `docs/electoral-systems/specification.md`. Unknown identifiers and supported-but-unregistered strategies fail separately and clearly.
- Every calculator returns one normalized `ElectoralSystemResult`. The engine validates party totals, direct/list decomposition, direct-win coverage, parliament size, majority threshold, metadata, ordering, and warnings before the UI receives it.

## Fixed 630-seat strategy

`de-2023-fixed-630` is the only registered strategy. It applies the inclusive five-percent threshold, the three-direct-win rule, the explicit national-minority exemption, and exclusion of the aggregate `Sonstige` bucket.

The calculator allocates exactly 630 seats nationally among eligible parties and then allocates each party's seats among active state lists through the shared Sainte-Laguë helper. Inactive states receive no state seats, while the national chamber remains fixed at 630 seats.

Direct-seat coverage is calculated only at the aggregate party/state boundary required by the product. For every party and state, covered direct seats are the smaller of the party's state-seat allocation and its modeled district wins there. Additional wins are returned as `uncoveredDistrictWins`; no candidate identity or list position is derived. This keeps the aggregate result legally meaningful without introducing person-level mandate assignment.

Filtered scenarios use the district winners from the normalized filtered first-vote scenario and emit `FILTERED_FIRST_VOTE_MODEL`. Excluded states additionally emit `INACTIVE_STATE_SIMULATION`. The documented unfiltered 2021 vote fixture reproduces the expected 630-seat party totals.

The pre-2023 and parallel systems are intentionally recognized by the identifier type but remain unregistered until their implementation issues add calculators. Candidate names, state-list order, and person-level mandate assignment remain outside this module boundary.

Coalition calculation consumes the normalized party seat totals and the majority threshold returned by the selected calculator. It does not infer the chamber size or encode political compatibility.
