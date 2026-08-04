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

## Current transition

`de-2023-fixed-630` is the only registered strategy in issue #38. It preserves the existing national 630-seat allocation as an explicit calculator instead of an implicit `DEFAULT_PARLIAMENT_SEATS` path. It applies the five-percent threshold inclusively, the three-direct-win rule, the explicit SSW minority exemption, and exclusion of the aggregate `Sonstige` bucket.

The full state-level 2023 constituency-seat coverage belongs to issue #39. Until that strategy replaces the transition calculator, direct wins are represented in aggregate only and are covered up to each party's national seat total. The shared result and warning contract is already stable for the later strategies.

The pre-2023 and parallel systems are intentionally recognized by the identifier type but remain unregistered until their implementation issues add calculators. Candidate names, state-list order, and person-level mandate assignment are outside this module boundary.

Coalition calculation consumes the normalized party seat totals and the majority threshold returned by the selected calculator. It does not infer the chamber size or encode political compatibility.
