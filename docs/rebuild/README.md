# One-Page Rebuild Plan

This directory contains the agreed direction for rebuilding the application as a simple static one-page presentation.

The rebuild is intentionally narrow. It does not introduce a backend, routing, user accounts, persistence, additional product areas, or a larger application architecture. The existing JSON-compatible TypeScript models remain the fixed data contract because the available data files depend on their current structure.

## Documents

- [`ONE_PAGER_REBUILD.md`](./ONE_PAGER_REBUILD.md): product and technical direction for the rebuild.
- [`tickets/`](./tickets/): detailed implementation work packages with acceptance criteria.

## Suggested ticket order

1. [Bootstrap the new one-page application](./tickets/01-bootstrap-new-one-pager.md)
2. [Preserve the existing JSON contracts](./tickets/02-preserve-json-contracts.md)
3. [Connect the static election data](./tickets/03-connect-static-data.md)
4. [Port the existing calculation logic](./tickets/04-port-calculation-logic.md)
5. [Build the one-page layout](./tickets/05-build-one-page-layout.md)
6. [Build the interactive filters](./tickets/06-build-interactive-filters.md)
7. [Build the results and coalition presentation](./tickets/07-build-results-and-coalitions.md)
8. [Complete responsive and accessibility polish](./tickets/08-responsive-accessibility-polish.md)
9. [Switch the repository to the new application](./tickets/09-cut-over-to-new-app.md)

## Working principles

- Keep the product a single page.
- Keep all project and UI language in English.
- Load election data as static files.
- Preserve existing JSON field names and allowed values.
- Reuse domain behavior only where it is still required by the one-page product.
- Prefer clear and direct code over unnecessary abstractions.
- Treat the existing application as a reference until the new page covers the required behavior.
