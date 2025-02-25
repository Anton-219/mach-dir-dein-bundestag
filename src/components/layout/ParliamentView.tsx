import HalfDoughnutChart from "../charts/HalfDoughnutChart.tsx";
import {ElectionResult, Party, SeatResult} from "../../types/ElectionTypes.tsx";
import {minPercentage, PARLIAMENT_SEATS} from "../../Constants.tsx";

interface ParliamentViewProps {
    electionResults: ElectionResult[];
    parties: Party[];
}

function ParliamentView({electionResults, parties}: ParliamentViewProps) {
    const partyMap: Record<string, Party> = {}
    parties.forEach((party) => {
        partyMap[party.abbreviation] = party;
    });

    const seatResult: SeatResult[] = electionResults
        .filter(r => r.percentage > minPercentage)
        .map(r => ({
                partyAbbreviation: r.partyAbbreviation,
                seatNumber: Math.round(r.percentage * PARLIAMENT_SEATS)
            })
        );

    return <HalfDoughnutChart
        parties={partyMap}
        seatResult={seatResult}
    />;
}

export default ParliamentView;