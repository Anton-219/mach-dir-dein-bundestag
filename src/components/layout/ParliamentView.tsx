import HalfDoughnutChart from "../charts/HalfDoughnutChart.tsx";
import {ElectionResult, Party, SeatResult} from "../../types/ElectionTypes.tsx";
import {minPercentage, PARLIAMENT_SEATS} from "../../Constants.tsx";

interface ParliamentViewProps {
    electionResults: ElectionResult[];
    parties: Record<string, Party>;
}

function ParliamentView({electionResults, parties}: ParliamentViewProps) {
    const seatResult: SeatResult[] = electionResults
        .filter(r => r.percentage > minPercentage)
        .map(r => ({
                partyAbbreviation: r.partyAbbreviation,
                seatNumber: Math.round(r.percentage * PARLIAMENT_SEATS),
                seatPosition: r.seatPosition,
            })
        );

    return <HalfDoughnutChart
        parties={parties}
        seatResult={seatResult}
    />;
}

export default ParliamentView;