import {Doughnut} from "react-chartjs-2";
import {ChartOptions} from "chart.js";
import {Party, SeatResult} from "../../types/ElectionTypes.tsx";

interface HalfPieChartProps {
    seatResult: SeatResult[];
    parties: Record<string, Party>;
    cutout?: number;
}

function HalfDoughnutChart({seatResult, parties, cutout=30}: HalfPieChartProps) {
    const selectColor = function (abbreviation: string) {
        if(parties[abbreviation]) {
            return parties[abbreviation].color;
        }
        return "#ab59d4"
    };

    const data = {
        labels: seatResult.map(p => p.partyAbbreviation),
        datasets: [
            {
                data: seatResult.map(p => p.seatNumber),
                backgroundColor: seatResult.map(p => selectColor(p.partyAbbreviation)),
            },
        ],
    };
    const options: ChartOptions<"doughnut"> = {
        rotation: -90,
        circumference: 180,
        cutout: `${cutout}%`,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
            },
        },
    };

    return (
        <div className="container my-4" key="HalfDoughnutChart">
            <Doughnut data={data} options={options}/>
        </div>
    );
}

export default HalfDoughnutChart;