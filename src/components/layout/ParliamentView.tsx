import HalfDoughnutChart from "../charts/HalfDoughnutChart.tsx";
import {Party, SeatResult} from "../../types/ElectionTypes.tsx";

interface ParliamentViewProps {
    seatResult: SeatResult[];
    parties: Record<string, Party>;
}

function ParliamentView({seatResult, parties}: ParliamentViewProps) {
    return <HalfDoughnutChart
        parties={parties}
        seatResults={seatResult}
    />;
}

export default ParliamentView;