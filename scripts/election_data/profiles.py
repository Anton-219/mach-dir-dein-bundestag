from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from .btw2021 import APP_AGE_GROUPS, APP_GENDERS, APP_METHODS


@dataclass(frozen=True)
class ProfileSelection:
    values: np.ndarray
    source: str


def iterative_proportional_fit(
    seed: np.ndarray,
    row_targets: np.ndarray,
    column_targets: np.ndarray,
    *,
    tolerance: float = 1e-9,
    max_iterations: int = 10_000,
) -> np.ndarray:
    """Fit a non-negative matrix to exact row and column margins.

    Zeros in the seed are treated as missing information rather than structural zeros.
    Rows or columns with a target of zero remain zero.
    """

    table = np.asarray(seed, dtype=float).copy()
    rows = np.asarray(row_targets, dtype=float)
    columns = np.asarray(column_targets, dtype=float)

    if table.shape != (rows.size, columns.size):
        raise ValueError("Seed shape does not match the requested margins")
    if np.any(table < 0) or np.any(rows < 0) or np.any(columns < 0):
        raise ValueError("IPF accepts only non-negative values")
    if not np.isclose(rows.sum(), columns.sum(), atol=tolerance, rtol=0):
        raise ValueError(
            f"IPF margins disagree: rows={rows.sum()}, columns={columns.sum()}"
        )
    if rows.sum() == 0:
        return np.zeros_like(table)

    active = np.outer(rows > 0, columns > 0)
    table[~active] = 0.0
    table[active & (table <= 0)] = 1e-12

    for _ in range(max_iterations):
        row_sums = table.sum(axis=1)
        row_factors = np.divide(
            rows,
            row_sums,
            out=np.ones_like(rows),
            where=row_sums > 0,
        )
        table *= row_factors[:, None]

        column_sums = table.sum(axis=0)
        column_factors = np.divide(
            columns,
            column_sums,
            out=np.ones_like(columns),
            where=column_sums > 0,
        )
        table *= column_factors[None, :]

        error = max(
            float(np.max(np.abs(table.sum(axis=1) - rows))),
            float(np.max(np.abs(table.sum(axis=0) - columns))),
        )
        if error <= tolerance:
            return table

    raise RuntimeError(
        f"IPF did not converge within {max_iterations} iterations; last error={error}"
    )


def _complete_demographic_index() -> pd.MultiIndex:
    return pd.MultiIndex.from_product(
        [APP_GENDERS, APP_AGE_GROUPS], names=["gender", "ageGroup"]
    )


def _select_demographic_profile(
    profiles: pd.DataFrame,
    *,
    state: str,
    vote_type: str,
    party: str,
) -> ProfileSelection:
    index = _complete_demographic_index()
    for candidate, source in ((party, "party-statistics"), ("Sonstige", "other-statistics")):
        selected = profiles[
            (profiles["state"] == state)
            & (profiles["voteType"] == vote_type)
            & (profiles["party"] == candidate)
        ]
        if not selected.empty:
            series = (
                selected.set_index(["gender", "ageGroup"])["share"]
                .reindex(index, fill_value=0.0)
                .astype(float)
            )
            if series.sum() > 0:
                return ProfileSelection((series / series.sum()).to_numpy(), source)
    return ProfileSelection(np.full(len(index), 1.0 / len(index)), "uniform-fallback")


def _select_method_seed(
    seed_profiles: pd.DataFrame | None,
    *,
    vote_type: str,
    party: str,
    demographic_share: np.ndarray,
    method_targets: np.ndarray,
) -> ProfileSelection:
    index = _complete_demographic_index()
    if seed_profiles is not None:
        for candidate, source in ((party, "party-federal-seed"), ("Sonstige", "other-federal-seed")):
            selected = seed_profiles[
                (seed_profiles["voteType"] == vote_type)
                & (seed_profiles["party"] == candidate)
            ]
            if not selected.empty:
                matrix = (
                    selected.pivot_table(
                        index=["gender", "ageGroup"],
                        columns="electionMethod",
                        values="weight",
                        aggfunc="sum",
                        fill_value=0.0,
                    )
                    .reindex(index=index, columns=APP_METHODS, fill_value=0.0)
                    .to_numpy(dtype=float)
                )
                if matrix.sum() > 0:
                    return ProfileSelection(matrix, source)

    method_share = method_targets / method_targets.sum()
    return ProfileSelection(
        np.outer(demographic_share, method_share), "independent-method-fallback"
    )


def build_state_method_profiles(
    district_totals: pd.DataFrame,
    demographic_profiles: pd.DataFrame,
    federal_method_seed: pd.DataFrame | None = None,
) -> pd.DataFrame:
    """Build one demographic profile per state, party, vote type and method.

    The result is fitted so that state demographic margins and official method totals
    are both preserved. The same fitted method profile is later applied to every
    constituency of the state.
    """

    demographic_index = _complete_demographic_index()
    records: list[dict[str, object]] = []

    grouped = district_totals.groupby(["state", "voteType", "party"], sort=True)
    for (state, vote_type, party), group in grouped:
        method_series = (
            group.groupby("electionMethod")["votes"]
            .sum()
            .reindex(APP_METHODS, fill_value=0.0)
            .astype(float)
        )
        method_targets = method_series.to_numpy()
        official_total = float(method_targets.sum())
        if official_total <= 0:
            continue

        demographic = _select_demographic_profile(
            demographic_profiles,
            state=state,
            vote_type=vote_type,
            party=party,
        )
        row_targets = demographic.values * official_total
        seed = _select_method_seed(
            federal_method_seed,
            vote_type=vote_type,
            party=party,
            demographic_share=demographic.values,
            method_targets=method_targets,
        )
        fitted = iterative_proportional_fit(seed.values, row_targets, method_targets)

        for method_index, method in enumerate(APP_METHODS):
            method_total = float(method_targets[method_index])
            if method_total <= 0:
                shares = demographic.values
            else:
                shares = fitted[:, method_index] / method_total

            for demographic_index_number, (gender, age_group) in enumerate(demographic_index):
                records.append(
                    {
                        "state": state,
                        "voteType": vote_type,
                        "party": party,
                        "electionMethod": method,
                        "gender": gender,
                        "ageGroup": age_group,
                        "share": float(shares[demographic_index_number]),
                        "stateMethodVotes": method_total,
                        "fittedStateVotes": float(fitted[demographic_index_number, method_index]),
                        "demographicProfileSource": demographic.source,
                        "methodSeedSource": seed.source,
                    }
                )

    return pd.DataFrame.from_records(records)
