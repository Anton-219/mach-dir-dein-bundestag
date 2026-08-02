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
    votes: float


@dataclass
class StatVoteEntry:
    gender: str
    ageGroup: str
    party: str
    votes: float


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
            ['Land', 'Stimmenart', 'Bezirksart', 'gültig'].
    :return: A DataFrame with the specified parties and meta-information
            columns unchanged, and a new 'Other' column containing the sum of votes
            from all non-specified parties.
    """
    if meta_information_columns is None:
        meta_information_columns = ['Land', 'Stimmenart', 'Bezirksart', 'gültig']
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
    df_demographic.rename(columns={'Sonstige': 'Other'}, inplace=True)
    df_demographic.fillna(0, inplace=True)
    available_parties = [col for col in df_demographic.columns
                         if col not in ['Land', 'Geschlecht', 'Geburtsjahresgruppe', 'Summe']]

    entries = []
    for index, by_demographic in df_demographic.iterrows():
        if by_demographic['Land'] not in _state_mapping:
            print(f"{by_demographic['Land']=} not found in state mapping. Skipping it")
            continue
        state = _state_mapping[by_demographic['Land']]
        for _, by_state in df_method[df_method['Land'] == state].iterrows():
            for party in available_parties:
                total_votes = df_demographic[df_demographic['Land'] == by_demographic['Land']][party].sum()
                entry = VoteEntry(
                    state=state,
                    gender=by_demographic['Geschlecht'],
                    ageGroup=by_demographic['Geburtsjahresgruppe'],
                    party="Sonstige" if party == "Other" else party,
                    voteType=vote_type,
                    electionMethod=by_state['Bezirksart'],
                    votes=calculate_votes(by_demographic, by_state, party, total_votes)
                )
                entries.append(entry)
    return entries


def calculate_votes(by_demographic, by_state, party, total_votes):
    if total_votes == 0:
        return 0
    return by_demographic[party] * by_state[party] / total_votes
