from __future__ import annotations

import pandas as pd

from .btw2025 import canonical_party_name
from .notebook_steps import numeric_votes, statistic_party_columns


def reshape_state_statistic_votes(frame: pd.DataFrame) -> pd.DataFrame:
    """Reshape the 2025 representative-statistics party columns.

    This mirrors the shared notebook helper but uses the 2025 party aliases, in
    particular converting the published ``Die Linke`` label to the application's
    established ``DIE LINKE`` identifier.
    """

    party_columns = statistic_party_columns(
        frame,
        extra_metadata={"state", "voteType", "gender", "ageGroup"},
    )
    values = frame.loc[:, party_columns].copy()
    for column in party_columns:
        values[column] = numeric_votes(values[column])
    values.columns = [canonical_party_name(column) for column in party_columns]
    values = values.T.groupby(level=0).sum().T

    long = pd.concat(
        [frame[["state", "voteType", "gender", "ageGroup"]], values],
        axis=1,
    ).melt(
        id_vars=["state", "voteType", "gender", "ageGroup"],
        var_name="party",
        value_name="statisticVotes",
    )
    return (
        long.groupby(
            ["state", "voteType", "party", "gender", "ageGroup"],
            as_index=False,
            sort=True,
        )["statisticVotes"]
        .sum()
    )
