# Election calculation assumptions

These modules isolate the deterministic election behavior from React components.

- Seat allocation uses the current odd-divisor highest-averages procedure for a fixed 630-seat parliament. This is a national approximation of Sainte-Laguë/Schepers; it does not model state-list allocation, constituency coverage, overhang seats, compensatory seats, or every legal detail of a specific election law.
- The general vote-share rule intentionally preserves the existing strict comparison: a party must receive more than 5%, not exactly 5%, unless another rule qualifies it.
- A party with at least three calculated district wins qualifies independently of the vote-share threshold.
- District wins are calculated from the filtered `first_votes.json` records. Demographic and election-method rows are summed by constituency and party before the highest first-vote total is selected.
- Exact constituency ties are left without a winner by the default `resolveDistrictWinner` implementation. Tie handling is isolated behind a replaceable resolver so another rule can be introduced later without changing the aggregation flow.
- `Sonstige` is an aggregate data bucket and is never allocated seats.
- The SSW is configured as exempt from the general vote-share threshold. It enters the same seat allocation as other qualified parties, and the allocator determines whether its vote total is sufficient for a seat. There is no separate hard-coded SSW minimum-vote constant.
- Coalition calculation tests only whether combinations reach a numerical seat threshold. It does not encode political compatibility or named coalition conventions.
- When both CDU and CSU have seat results, coalition calculation combines them as `CDU+CSU` before enumerating combinations, matching the existing coalition-list flow. If only one is present, it remains unchanged.
