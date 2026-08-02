# AGENTS.md

## User-facing text

The application has a dedicated bilingual presentation layer. All text that a user can read or that assistive technology can announce must be defined in `src/i18n/messages.ts`.

This includes:

- headings, labels, notes, buttons, badges, empty states, loading states, and error messages;
- `aria-label`, `aria-description`, SVG `title` and `desc`, tooltips, `alt`, and placeholder text;
- dynamic sentences, singular/plural wording, and filter summaries;
- the document title and meta description.

Do not add hardcoded user-facing copy directly to React components or domain logic. Components should obtain copy through `useI18n()`. Dynamic copy should be represented by typed functions in both message catalogs rather than assembled from English or German fragments inside a component.

## Language-neutral application logic

Business and calculation code should return structured values, status values, or reason keys. It should not return a rendered German or English sentence. Translate those statuses only in the presentation layer.

Keep canonical data identifiers unchanged. For example, filters and GeoJSON continue to use the committed Bundesland names. Use `stateName()` from the i18n tools when a localized state label is displayed.

Use the locale-aware helpers returned by `useI18n()` for numbers, percentages, lists, and state names. Do not call `toLocaleString()` with a hardcoded locale in UI code.

The application intentionally does not use language routes. The selected locale is stored locally and the initial locale is derived from the browser, with German as the fallback.

## Adding or changing copy

1. Add or change the entry in both `englishMessages` and `germanMessages` in `src/i18n/messages.ts`.
2. Keep both catalogs structurally identical; TypeScript should reject a missing entry.
3. Reference the catalog entry through `useI18n()` or a formatter in `src/i18n/formatters.ts`.
4. Add or update unit coverage for dynamic wording or formatting when appropriate.
5. Run `npm run lint`, `npm test`, and `npm run build`.

`npm run lint` includes `scripts/check-ui-copy.mjs`, which rejects direct user-facing JSX text and literal accessibility attributes. Do not bypass this check by hiding copy in another component file; move the copy to the language catalog instead.
