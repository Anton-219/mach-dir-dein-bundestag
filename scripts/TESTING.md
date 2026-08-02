# Testing the election scripts

The notebooks can import and call ordinary Python modules. The intended structure is:

```text
scripts/
├── collect_vote_results_2021.ipynb   # visible orchestration and exploration
├── election/                         # reusable calculations
│   ├── __init__.py
│   └── seat_allocation.py
├── tests/                            # reference fixtures and regression tests
│   ├── __init__.py
│   ├── reference_2021.py
│   └── test_seat_allocation.py
└── run_tests.py                      # dependency-free test entry point
```

The first formalisation step deliberately leaves the existing notebook unchanged. It establishes tested Python functions first, so later notebook cells can be reduced to readable calls without changing behaviour at the same time.

## Run the tests

Run the suite from the repository root:

```bash
python -m scripts.run_tests
```

The suite uses Python's built-in `unittest` module and does not require `pytest` or another test dependency.

## Import from a notebook

Start Jupyter with the repository root as its working directory. Notebook cells can then import the tested functions normally:

```python
from scripts.election import (
    PartyQualificationRules,
    allocate_sainte_lague,
    qualify_parties,
)
```

Normal imports are preferred to Jupyter's `%run` command. `%run` executes a complete file in the notebook namespace, while imports provide explicit functions, stable module boundaries, and the same code path for notebooks and tests.

During development, an already imported module can be reloaded after editing it:

```python
import importlib
import scripts.election.seat_allocation as seat_allocation

importlib.reload(seat_allocation)
```

Jupyter's autoreload extension is another option:

```python
%load_ext autoreload
%autoreload 2
```

## Official regression reference

`scripts/tests/reference_2021.py` records the Federal Returning Officer's model calculation for applying the 2023 Bundestag election reform to the 2021 result. It contains the qualifying second-vote totals and the expected 630-seat allocation:

| Party | Second votes | Seats |
| --- | ---: | ---: |
| CDU | 8,774,920 | 130 |
| SPD | 11,901,558 | 177 |
| AfD | 4,809,233 | 72 |
| FDP | 5,291,013 | 79 |
| DIE LINKE | 2,255,864 | 34 |
| GRÜNE | 6,814,408 | 101 |
| CSU | 2,402,827 | 36 |
| SSW | 55,578 | 1 |

The fixture also records:

- 46,298,387 valid second votes as the denominator for the threshold;
- three direct mandates for DIE LINKE in the reference scenario;
- SSW as exempt from the ordinary vote-share threshold;
- 42,305,401 second votes participating in the seat allocation;
- 630 total seats.

The source is stored directly in the fixture as title, publication date, and URL so the expected values remain auditable.

## What the tests verify

The current tests verify that:

- the reference party votes sum to the official allocated-vote total;
- the documented threshold, direct-mandate, and minority-party rules select the expected parties;
- DIE LINKE does not pass the reference threshold without the direct-mandate rule;
- SSW does not pass the ordinary threshold without its explicit exemption;
- the general Sainte-Laguë/Schepers allocator reproduces the official 2021 model calculation exactly;
- the allocated seats always sum to the configured seat count in the reference case;
- the allocator also works for an unrelated, small 60/40 example;
- a party at exactly five percent qualifies while one below five percent does not.

## General rather than reference-specific code

The production calculation accepts arbitrary mappings of party identifiers to votes and an arbitrary seat count. Election-specific values live only in the reference fixture and test setup.

The separation is intentional:

- `scripts/election/seat_allocation.py` contains reusable behaviour;
- `scripts/tests/reference_2021.py` contains one auditable historical fixture;
- `scripts/tests/test_seat_allocation.py` expresses the required behaviour;
- the notebook will later call the reusable functions while retaining the visible sequence of processing steps.

## Next formalisation steps

The next safe refactoring stage is to move one notebook concern at a time into modules, while preserving a notebook cell for each visible step. Suitable module boundaries are:

1. source download and file metadata;
2. source-table cleaning and label normalisation;
3. party retention and `Sonstige` aggregation;
4. proportional demographic/election-method estimation;
5. SSW imputation;
6. output schema validation and conservation checks;
7. JSON serialization.

Each extracted concern should receive invariant tests before the corresponding notebook cells are replaced with function calls.
