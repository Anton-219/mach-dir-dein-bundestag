# Electoral-system comparison

This directory contains the architecture and implementation notes for [epic #36](https://github.com/Anton-219/mach-dir-dein-bundestag/issues/36).

The epic introduces interchangeable electoral-system calculators that consume one normalized vote scenario and return one comparable aggregate result. Product code must not branch on legal rules outside those calculators.

## Delivery sequence

| Story | Deliverable |
| --- | --- |
| [#37](https://github.com/Anton-219/mach-dir-dein-bundestag/issues/37) | Supported variants, formulas, data audit, filter semantics, reference scenarios, and shared result contract |
| [#38](https://github.com/Anton-219/mach-dir-dein-bundestag/issues/38) | Calculator interface, registry, and common allocation primitives |
| [#39](https://github.com/Anton-219/mach-dir-dein-bundestag/issues/39) | Fixed-size electoral law introduced in 2023 |
| [#40](https://github.com/Anton-219/mach-dir-dein-bundestag/issues/40) | Configurable parallel/Grabenwahl model |
| [#41](https://github.com/Anton-219/mach-dir-dein-bundestag/issues/41) | Electoral law used for the 2021 Bundestag election |
| [#42](https://github.com/Anton-219/mach-dir-dein-bundestag/issues/42) | Side-by-side comparison UI |

## Architecture principles

- A filtered or unfiltered vote scenario is calculated once and passed unchanged to every electoral-system calculator.
- Legal eligibility, seat allocation, and system-specific warnings live behind an electoral-system strategy boundary.
- All strategies return the same party-level result shape; candidate-level claims are outside the epic.
- Legal variants and modeling assumptions are versioned explicitly rather than hidden behind a generic “German system” label.
- Deterministic reference scenarios are the acceptance boundary for each calculator.

The detailed specification is added by story #37 and becomes the normative basis for the later implementation stories.
