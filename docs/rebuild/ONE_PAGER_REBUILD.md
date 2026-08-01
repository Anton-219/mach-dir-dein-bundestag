# One-Page Rebuild Direction

## Decision

The application will be rebuilt as a new, simple React and TypeScript application in a separate folder inside the existing repository.

The target is a static interactive one-page presentation. The page should explain the idea, allow users to adjust the existing election filters, and immediately present the resulting party shares, Bundestag seat distribution, and possible majority coalitions.

The rebuild is not intended to become a broader platform or a different product. It is a clean implementation of the existing core idea.

## Product scope

The page contains one continuous experience:

1. a short introduction to the project and the represented election data,
2. controls for changing the election scenario,
3. a clear presentation of the resulting Bundestag,
4. a compact party result breakdown,
5. a compact presentation of possible majority coalitions,
6. a short methodology and data note.

The page may use sections, cards, and anchored navigation, but it remains one route and one document.

## Required interaction

Users can change the scenario using the dimensions already represented by the data:

- federal state,
- age group,
- gender,
- voting method.

The interface must make it obvious which groups are included or excluded. Users must be able to reset the complete scenario to the unfiltered election result.

Every filter change updates the results on the same page without navigation or a page reload.

## Required output

The page presents at least:

- the number or share of votes included in the current scenario,
- party vote shares,
- the calculated number of seats per party,
- the majority threshold,
- a Bundestag visualization,
- minimal winning coalition options based on the current result.

## Data contract

The existing JSON structure is a fixed constraint. The corresponding TypeScript models must be preserved so that the current data files can be reused without migration.

In particular, existing field names and literal values must not be renamed for stylistic reasons. The application may add derived view models, helper types, or adapter functions, but the imported data contract remains unchanged.

Static JSON files are loaded directly by the frontend build. No API or server-side data layer is required.

## Implementation approach

The new application should be created in a separate folder so that the current prototype remains available as a reference during implementation.

A possible temporary repository structure is:

```text
/
├── app-v2/                 # new one-page application
├── src/                    # current prototype
├── scripts/                # existing data preparation
└── docs/
```

The exact folder name can be adjusted during implementation. The important point is that the new application starts with a clean entry point and does not require an incremental rewrite of the old component tree.

The new implementation should remain small and direct:

- React and TypeScript,
- one application entry point,
- one page,
- static styles and assets,
- static JSON data,
- local React state,
- pure TypeScript calculation helpers where needed.

## Visual direction

The page should feel like a focused editorial data presentation rather than a generic admin dashboard.

The main Bundestag result is the visual focus. Filters support the result and should not dominate the page. Coalition information appears after the main result. Supporting explanations remain short and easy to scan.

The interface and all project-owned text are written in English. German localization is not part of the rebuild, but can be added later.

## Explicit non-goals

The rebuild does not include:

- a backend,
- an API,
- authentication or user accounts,
- saved user scenarios,
- a database,
- multiple routes,
- a content management system,
- live election data,
- polling or forecasting,
- additional election years unless already required by the current files,
- new filter dimensions,
- a general-purpose design system,
- a complex state-management framework,
- a monorepo conversion.

## Completion definition

The rebuild is complete when:

- the new application runs independently from the old prototype,
- the existing JSON-compatible models are preserved,
- the required static data can be loaded,
- the required filters update the result on one page,
- party shares, seats, Bundestag visualization, and coalitions are shown,
- the page is clear on desktop and mobile,
- all visible application text is English,
- no backend or additional route is required,
- the old prototype can be removed or archived without losing required behavior.
