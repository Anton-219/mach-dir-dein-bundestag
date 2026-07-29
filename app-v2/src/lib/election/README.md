# Election calculation assumptions

These modules isolate the deterministic behavior that previously lived in React components under the legacy `src/` tree.

- Seat allocation uses the legacy odd-divisor highest-averages procedure for a fixed 630-seat parliament. This is a national approximation of Sainte-Laguë/Schepers; it does not model state-list allocation, constituency coverage, overhang seats, compensatory seats, or every legal detail of a specific election law.
- The general vote-share rule intentionally preserves the legacy strict comparison: a party must receive more than 5%, not exactly 5%, unless another rule qualifies it.
- A party with at least three direct mandates qualifies independently of the vote-share threshold, matching the legacy reference scenario.
- `Sonstige` is an aggregate data bucket and is never allocated seats.
- SSW is treated as an exempt minority party once it reaches 40,000 votes. The value comes from the legacy constant and approximates the votes needed for one seat; it is not asserted here as a legally exact threshold and should be replaced by a verified rule when the data-import follow-up is resolved.
- Coalition calculation tests only whether combinations reach a numerical seat threshold. It does not encode political compatibility or named coalition conventions.
