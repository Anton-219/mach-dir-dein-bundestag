# Ticket 05: Build the One-Page Layout

## Goal

Create the final page structure and visual hierarchy for the static one-page presentation before adding the complete interactive controls and result details.

## Context

The existing four-quadrant dashboard layout should not be carried into the rebuild. The new page should read as a focused presentation with a clear beginning, main result, supporting controls, coalition section, and methodology note.

## Scope

- Create the complete one-page section structure.
- Add the project introduction and a short explanation of the interaction.
- Add a compact scenario summary area.
- Add a main result section reserved for the Bundestag visualization and party results.
- Add a filter section or clearly integrated filter area.
- Add a coalition section.
- Add a short methodology and data note near the bottom of the page.
- Establish typography, spacing, content width, surfaces, and basic color usage.
- Use English copy throughout.
- Add placeholder content where later tickets provide real data or components.

## Implementation details

The page should have one clear visual focus: the resulting Bundestag. Filters should be easy to find but should not visually overpower the result.

Use a restrained visual language. Party colors may be used in results, but the base interface should use neutral colors and remain readable without relying on party colors alone.

The layout may include a compact page header or anchored section links, but it must remain a single route and should not behave like a multi-page application.

Avoid copying Bootstrap grid classes or legacy inline styles without first deciding whether they support the new design.

## Acceptance criteria

- The application renders one continuous page with introduction, scenario, result, filters, coalitions, and methodology sections.
- The Bundestag result area is the primary visual element.
- The page contains no dashboard-style four-equal-quadrant layout.
- All visible placeholder and explanatory text is English.
- Typography and spacing are consistent across all sections.
- The layout remains understandable when real charts are temporarily replaced with placeholders.
- The page has no router and no additional application route.
- The implementation does not copy the legacy component tree wholesale.

## Out of scope

- Final filter behavior.
- Final seat visualization.
- Final coalition calculation output.
- Detailed mobile polishing.
- German localization.

## Dependencies

- Ticket 01: Bootstrap the new one-page application.
