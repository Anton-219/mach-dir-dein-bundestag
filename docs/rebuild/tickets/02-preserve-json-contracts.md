# Ticket 02: Preserve the Existing JSON Contracts

## Goal

Move the existing JSON-compatible TypeScript models into the new application without changing the shape expected by the current data files.

## Context

The available election data depends on the existing field names and literal values. These contracts are difficult to recreate and must therefore be treated as fixed input models.

## Scope

- Identify all TypeScript interfaces and union types that directly describe imported JSON data.
- Copy those contracts into the new application.
- Move non-JSX model files to `.ts` files where appropriate.
- Preserve every JSON-facing field name.
- Preserve literal values such as gender, vote type, age group, and election method values.
- Separate imported data models from calculated result models where the current code already distinguishes them.
- Add short English comments only where a field is otherwise ambiguous.
- Create a small documentation section listing the preserved contracts and their source files.

## Implementation details

At minimum, review the existing definitions for:

- `Party`,
- `DirectMandateWinner`,
- `AgeGroup`,
- `VoteEntry`,
- `StatVotes`,
- `ElectionResult`,
- `SeatResult`.

Do not rename JSON-facing properties to make them more elegant. For example, if the data contains `voteType`, `electionMethod`, or abbreviated party identifiers, the imported model must continue to accept those names and values.

Derived types may be introduced for UI presentation, but they must be produced from the preserved input models rather than replacing them.

## Acceptance criteria

- The new application contains TypeScript definitions for every JSON structure required by the existing frontend.
- All JSON-facing field names match the current contracts exactly.
- All literal union values match the current contracts exactly.
- Model files containing no JSX use the `.ts` extension.
- No UI component is required to import model definitions from the legacy `src/` folder.
- A short English note documents that these types are compatibility contracts and must not be changed without migrating the source data.
- The new application still builds successfully.

## Out of scope

- Renaming JSON fields.
- Converting the JSON data to a new format.
- Adding a validation library.
- Changing election calculation behavior.
- Designing UI-specific view models beyond what is needed to establish the separation.

## Dependencies

- Ticket 01: Bootstrap the new one-page application.
