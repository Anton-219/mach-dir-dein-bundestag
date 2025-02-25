export interface Party {
    name: string;
    color: string;
    abbreviation: string;
}

export interface VoteEntry {
    state: string;
    gender: 'm' | 'w';
    ageGroup: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
    party: string;
    voteType: '1' | '2';
    electionMethod: "postal" | "in-person";
    votes: number;
}


export interface ElectionResult {
    partyAbbreviation: string;
    votes: number;
    percentage: number;
}

export interface SeatResult {
    partyAbbreviation: string;
    seatNumber: number;
}
