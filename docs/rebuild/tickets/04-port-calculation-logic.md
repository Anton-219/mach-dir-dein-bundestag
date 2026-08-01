# Ticket 04: Port the Existing Calculation Logic

## Goal

Move the calculations required by the one-page presentation into the new application without copying the legacy React component structure.

## Context

The current prototype already aggregates filtered votes, calculates party percentages, assigns seats, and determines possible coalitions. The rebuild should preserve the required behavior while expressing it as small TypeScript functions that can be called by the new page.

## Scope

- Identify the existing logic required for the one-page output.
- Port vote filtering and aggregation.
- Port party percentage calculation.
- Port seat allocation, including the currently intended threshold and direct-mandate behavior.
- Port CDU/CSU handling used for coalition presentation.
- Port minimal winning coalition calculation.
- Remove React hooks, component state, chart configuration, and console output from the calculation modules.
- Define clear function inputs and outputs using the preserved models.
- Add a small set of fixed examples that can be run or checked during development.

## Implementation details

The calculation modules should not import React. They should receive arrays and rule values and return new values without mutating the input data.

Where the current behavior is uncertain or appears incorrect, document the uncertainty instead of silently inventing a new rule. The immediate objective is to reproduce the intended product behavior in a readable place. Any deliberate correction should be described in the implementation pull request.

The one-page scope requires only the calculations needed to produce the displayed result. Do not build a general election simulation engine.

## Acceptance criteria

- Filtering vote entries is implemented outside React components.
- Party vote totals and percentages are calculated outside React components.
- Seat allocation is callable through a clear TypeScript function or small module.
- Coalition calculation is callable through a clear TypeScript function or small module.
- Input arrays are not mutated.
- The calculation code contains no chart configuration, DOM access, React hooks, or debug logging.
- An unfiltered reference scenario produces a stable result for repeated runs with the same data.
- A filtered reference scenario produces a stable result for repeated runs with the same data.
- The new application builds successfully after the calculations are added.

## Out of scope

- Creating a configurable election-law framework.
- Supporting additional election systems.
- Adding new data dimensions.
- Rewriting the source JSON.
- Building the final UI.

## Dependencies

- Ticket 02: Preserve the existing JSON contracts.
- Ticket 03: Connect the static election data.
