export interface Party {
    name: string;
    color: string;
    abbreviation: string;
    seatPosition: number; // The value from -100 to 100 where this party would be in the parliament. -100 = left, 100 = right.
}

export interface DirectMandateWinner {
    party: string,
    districtsWon: number
}

export type AgeGroup = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';

export interface VoteEntry {
    state: string;
    gender: 'm' | 'w';
    ageGroup: AgeGroup;
    party: string; // This is actually the abbreviation of the party
    voteType: '1' | '2';
    electionMethod: "postal" | "in-person";
    votes: number;
}

export interface StatVotes {
    gender: 'm' | 'w';
    ageGroup: AgeGroup;
    party: string;
    votes: number;
}

// The election result of a single party
export interface ElectionResult {
    partyAbbreviation: string;
    votes: number;
    percentage: number;
    seatPosition: number;
}

export interface SeatResult {
    partyAbbreviation: string;
    seats: number;
    seatPosition: number;
}
