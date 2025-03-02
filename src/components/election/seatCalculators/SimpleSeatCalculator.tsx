import {minPercentage, PARLIAMENT_SEATS_ELECTION_REFORM, PARTY_SONSTIGE} from "../../../Constants.tsx";
import {DirectMandateWinner, ElectionResult, SeatResult} from "../../../types/ElectionTypes.tsx";
import SeatCalculatorStrategy from "./SeatCalculatorStrategy.tsx";

export class SimpleSeatCalculator implements SeatCalculatorStrategy {
    calculate(electionResults: ElectionResult[], directMandateWinners: DirectMandateWinner[]): SeatResult[] {
        return electionResults
            .filter(r => r.percentage > minPercentage && r.partyAbbreviation !== PARTY_SONSTIGE)
            .map(r => ({
                    partyAbbreviation: r.partyAbbreviation,
                    seatNumber: Math.round(r.percentage * PARLIAMENT_SEATS_ELECTION_REFORM),
                    seatPosition: r.seatPosition,
                })
            );
    }
}
