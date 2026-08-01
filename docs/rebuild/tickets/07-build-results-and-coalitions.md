# Ticket 07: Build the Results and Coalition Presentation

## Goal

Present the calculated election result, Bundestag composition, and minimal winning coalitions clearly on the one-page application.

## Context

The result is the main purpose of the page. It should be easier to understand than the current collection of equally weighted panels and should update immediately when filters change.

## Scope

- Build the main Bundestag seat visualization.
- Display the total seat count and majority threshold.
- Display a compact party result breakdown with party name or abbreviation, vote share, and seat count.
- Use existing party metadata and colors where available.
- Display minimal winning coalition options calculated for the active scenario.
- Show coalition parties, total seats, and margin above the majority threshold.
- Provide understandable empty states when no result or no coalition can be produced.
- Connect all result components to the filtered calculation output.

## Implementation details

The Bundestag visualization should remain the primary result. A semicircle or another parliamentary seating representation may be used, provided it is legible and stable at different viewport widths.

Party colors should support recognition, but labels and numbers must carry the meaning. Do not make color the only way to identify a party.

Coalitions should be presented as a concise list rather than an unbounded collection of charts. Prioritize the smallest or clearest minimal winning combinations. CDU and CSU may be grouped for coalition presentation if this matches the existing intended behavior.

Avoid introducing a large charting framework solely for minor decorative elements. Existing dependencies may be reused where they remain suitable, but simple HTML, CSS, or SVG is acceptable.

## Acceptance criteria

- The current total number of seats is visible.
- The current majority threshold is visible.
- Every party with seats is represented in the Bundestag visualization.
- Party result rows show vote share and seat count.
- Party identities remain understandable without color alone.
- Minimal winning coalition options are shown for the current scenario.
- Each coalition shows participating parties, total seats, and majority margin.
- Results update when filters change.
- Empty or invalid scenarios show an English explanation rather than broken charts or `NaN` values.
- The result section remains part of the single page and requires no navigation.

## Out of scope

- Historical comparisons.
- Polling or forecasting.
- Saving coalition selections.
- Political recommendations or coalition rankings based on ideology.
- Multiple election years.

## Dependencies

- Ticket 04: Port the existing calculation logic.
- Ticket 05: Build the one-page layout.
- Ticket 06: Build the interactive filters.
