from dataclasses import dataclass

import pandas as pd


@dataclass
class VoteEntry:
    state: str
    gender: str
    ageGroup: str
    party: str
    voteType: str
    electionMethod: str
    votes: int


_age_mapping = {
    '1997 – 2003': '18-24',
    '1987 – 1996': '25-34',
    '1977 – 1986': '35-44',
    '1962 – 1976': '45-54',
    '1952 – 1961': '55-64',
    '1951 und früher': '65+'
}

_state_mapping = {
    'BB': 'Brandenburg',
    'BE': 'Berlin',
    'BE-O': 'Berlin',
    'BE-W': 'Berlin',
    'BW': 'Baden-Württemberg',
    'BY': 'Bayern',
    'HB': 'Bremen',
    'HE': 'Hessen',
    'HH': 'Hamburg',
    'MV': 'Mecklenburg-Vorpommern',
    'NI': 'Niedersachsen',
    'NW': 'Nordrhein-Westfalen',
    'RP': 'Rheinland-Pfalz',
    'SH': 'Schleswig-Holstein',
    'SL': 'Saarland',
    'SN': 'Sachsen',
    'ST': 'Sachsen-Anhalt',
    'TH': 'Thüringen'
}


def map_ages(age_group: str):
    return _age_mapping[age_group]


def combine_parties_to_other(df: pd.DataFrame, remaining_parties: list[str],
                             meta_information_columns: list[str] = None) -> pd.DataFrame:
    """Combines vote counts of non-specified political parties into a new 'Other' column.

    This function aggregates the vote counts of all political parties not listed in
    `remaining_parties` into a single column named 'Other'. The specified parties in
    `remaining_parties` and the meta-information columns remain unchanged.
    :param df: The input DataFrame containing vote counts for political
            parties, along with meta-information columns.
    :param remaining_parties: A list of party names whose vote counts should
            remain as separate columns.
    :param meta_information_columns: (list[str], optional) A list of column names that
            contain meta-information (e.g., 'Land', 'Stimmenart'). Defaults to
            ['Land', 'Stimmenart', 'Bezirksart', 'Wahlberechtigte'].
    :return: A DataFrame with the specified parties and meta-information
            columns unchanged, and a new 'Other' column containing the sum of votes
            from all non-specified parties.
    """
    if meta_information_columns is None:
        meta_information_columns = ['Land', 'Stimmenart', 'Bezirksart', 'Wahlberechtigte']
    party_cols = df.drop(columns=meta_information_columns)

    # Determine which party columns to combine into 'Other'
    _rp = set(remaining_parties)
    parties_to_combine = [col for col in party_cols if col not in _rp]

    # Create the 'Other' column by summing the votes of the parties to combine
    df['Other'] = df[parties_to_combine].sum(axis=1)

    # Drop the columns that have been combined into 'Other'
    return df.drop(columns=parties_to_combine)


def combine_vote_results(df_method: pd.DataFrame, df_demographic: pd.DataFrame, vote_type: str) \
        -> list[VoteEntry]:
    df_demographic = df_demographic.copy()
    available_parties = [col for col in df_demographic.columns
                         if col not in ['Land', 'Geschlecht', 'Geburtsjahresgruppe', 'Summe', 'Sonstige']]
    df_demographic[available_parties] = df_demographic[available_parties].div(df_demographic['Summe'], axis=0)
    df_demographic.rename(columns={'Sonstige': 'Other'}, inplace=True)
    df_demographic.fillna(0, inplace=True)

    entries = []
    for index, row in df_demographic.iterrows():
        state = _state_mapping[row['Land']]
        for _, by_state in df_method[df_method['Land'] == state].iterrows():
            for party in available_parties:
                entry = VoteEntry(
                    state=state,
                    gender=row['Geschlecht'],
                    ageGroup=row['Geburtsjahresgruppe'],
                    party=party,
                    voteType=vote_type,
                    electionMethod=by_state['Bezirksart'],
                    votes=int(round(row[party] * by_state[party], 0))
                )
                entries.append(entry)
    return entries
