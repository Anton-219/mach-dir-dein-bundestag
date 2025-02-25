export interface Party {
    name: string;
    color: string;
    abbreviation: string;
}

export interface VoteEntry {
    state: string;
    gender: 'm' | 'w';
    ageGroup: string;
    party: string;
    votes: number;
    active: boolean;
}

export interface ElectionResult{
    partyAbbreviation: string;
    votes: number;
    percentage: number;
}

export interface SeatResult{
    partyAbbreviation: string;
    seatNumber: number;
}
