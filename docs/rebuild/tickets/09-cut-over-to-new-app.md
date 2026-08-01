# Ticket 09: Switch the Repository to the New Application

## Goal

Make the completed one-page rebuild the primary application and remove the temporary need to maintain two frontend implementations.

## Context

The new application is intentionally developed in a separate folder so the current prototype remains available as a reference. Once the new page covers the agreed scope, the repository should return to a simple structure with one primary frontend.

## Scope

- Compare the completed rebuild against the required one-page scope.
- Confirm that the required JSON files and model contracts are present.
- Confirm that all required filters and result sections work in the new application.
- Decide whether the new application should move to the repository root or remain in its folder as the primary app.
- Update root-level scripts and documentation to point to the new application.
- Archive or remove the legacy frontend code after confirming it is no longer required.
- Preserve existing data-preparation scripts and source data that are still needed.
- Update the main README with installation, development, build, data-file, and project-scope instructions.
- Remove obsolete dependencies and configuration that belong only to the legacy frontend.

## Implementation details

Prefer the simplest final repository structure. For a single static one-page project, the final state should normally expose one obvious `package.json`, one application entry point, and one documented development command.

Do not delete the legacy application until the new page has been checked against the completion criteria in `ONE_PAGER_REBUILD.md`. If historical code should be retained, use a clearly named archive location or rely on Git history rather than leaving two active applications without explanation.

The preserved JSON contracts and required data files must survive the cut-over unchanged.

## Acceptance criteria

- The repository has one clearly identified primary frontend application.
- The root README describes the one-page product accurately in English.
- Installation, development, and production build instructions point to the new application.
- The required JSON-compatible model contracts remain unchanged.
- Required static data remains available to the primary application.
- The one-page application supports all agreed filters and result sections.
- The legacy frontend is removed or clearly archived and is no longer part of the normal build path.
- Dependencies and configuration used only by the legacy frontend are removed from the active application.
- A fresh checkout can follow the README and run the primary one-page application.
- No backend, router, database, or additional product area is introduced during the cut-over.

## Out of scope

- Adding new product functionality during migration.
- Supporting both frontends indefinitely.
- Reformatting the JSON source data.
- Adding deployment infrastructure beyond any already agreed static hosting need.
- German localization.

## Dependencies

- Tickets 01 through 08 completed.
