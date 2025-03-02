import {DirectMandateWinner, ElectionResult, SeatResult} from "../../../types/ElectionTypes.tsx";

export default interface SeatCalculatorStrategy {
    calculate(electionResults: ElectionResult[], directMandateWinners: DirectMandateWinner[]): SeatResult[];
}
