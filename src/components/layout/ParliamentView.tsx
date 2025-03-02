import HalfDoughnutChart from "../charts/HalfDoughnutChart.tsx";
import {
    DirectMandateWinner,
    ElectionResult,
    Party,
    SeatResult
} from "../../types/ElectionTypes.tsx";
import SeatCalculatorStrategy from "../election/seatCalculators/SeatCalculatorStrategy.tsx";

interface ParliamentViewProps {
    electionResults: ElectionResult[];
    parties: Record<string, Party>;
    seatCalculator: SeatCalculatorStrategy;
    directMandateWinners: DirectMandateWinner[];
}

function ParliamentView({electionResults, parties, seatCalculator, directMandateWinners}: ParliamentViewProps) {
    console.log("Election Result ", electionResults);
    const seatResult: SeatResult[] = seatCalculator.calculate(electionResults, directMandateWinners)

    return <HalfDoughnutChart
        parties={parties}
        seatResults={seatResult}
    />;
}

export default ParliamentView;