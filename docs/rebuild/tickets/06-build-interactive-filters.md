# Ticket 06: Build the Interactive Filters

## Goal

Implement the existing election filters as clear controls on the one-page presentation and connect them to the calculation flow.

## Context

The product depends on immediate interaction: users change a demographic or geographic selection and see the result update on the same page. The new controls should be easier to understand than the prototype's implicit exclusion behavior.

## Scope

- Implement controls for federal state, age group, gender, and voting method.
- Preserve the values used by the existing `VoteEntry` contract.
- Define one clear interaction model for inclusion and exclusion.
- Display the active scenario in readable English.
- Add a `Reset all filters` action.
- Show the number or share of votes included after filters are applied.
- Connect filter state to the pure calculation functions.
- Keep all state local to the frontend application.
- Use the Germany map only if it can be included without reducing clarity; a readable state list must remain available.

## Implementation details

The filter state should be represented as data rather than stored callback functions. It must be possible to inspect the current selection and create an English summary from it.

Controls should use native or accessible interactive elements. A chart or map may supplement filters, but it must not be the only way to make or understand a selection.

The interaction must clearly distinguish included and excluded groups. Avoid relying only on gray versus dark fill colors.

Filter changes should update the displayed result immediately. No submit page, route change, backend request, or full page reload is needed.

## Acceptance criteria

- Users can change federal-state selection.
- Users can change age-group selection.
- Users can change gender selection using the values available in the data.
- Users can change postal versus in-person voting selection.
- The currently active scenario is summarized in readable English.
- `Reset all filters` restores the complete unfiltered result.
- The included vote count or share updates with the scenario.
- Filter changes update the calculated party results and seats without navigation or reload.
- The filter state contains serializable values and no stored predicate functions.
- Every filter is usable without relying exclusively on a chart or map.

## Out of scope

- New filter dimensions.
- Saving or sharing filter state.
- URL synchronization.
- User accounts or persisted scenarios.
- German localization.

## Dependencies

- Ticket 03: Connect the static election data.
- Ticket 04: Port the existing calculation logic.
- Ticket 05: Build the one-page layout.
