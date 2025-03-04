import {Doughnut} from "react-chartjs-2";
import {ChartOptions} from "chart.js";
import {Party, SeatResult} from "../../types/ElectionTypes.tsx";

interface HalfPieChartProps {
    seatResults: SeatResult[];
    parties: Record<string, Party>;
    cutout?: number;
}

function HalfDoughnutChart({seatResults, parties, cutout = 30}: HalfPieChartProps) {
    const selectColor = function (abbreviation: string) {
        if (parties[abbreviation]) {
            return parties[abbreviation]?.color || "#ab59d4";
        }
    };

    const totalSeats = seatResults.reduce((sum, result) => sum + result.seats, 0)
    console.log("Total seats ", totalSeats);
    const sortedSeatResults = [...seatResults].sort((a, b) => a.seatPosition - b.seatPosition);
    const data = {
        labels: sortedSeatResults.map(p => p.partyAbbreviation),
        datasets: [
            {
                data: sortedSeatResults.map(p => p.seats),
                backgroundColor: sortedSeatResults.map(p => selectColor(p.partyAbbreviation)),
            },
        ],
    };

    const plugins = [{
        id: 'centerText',
        afterDraw: (chart) => {
            const {ctx} = chart;
            const meta = chart.getDatasetMeta(0);
            if (!meta || meta.data.length === 0) return;

            const arc = meta.data[0];
            const centerX = arc.x;
            const centerY = arc.y;

            ctx.save();
            ctx.font = 'bold 20px sans-serif'; // Adjust font styles as needed
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000000'; // Text color
            const currentTotal = chart.data.datasets[0].data.reduce(
                (a: number, b: number) => a + b, 0
            );
            console.log("FillText", currentTotal)
            ctx.fillText(currentTotal, centerX, centerY + 0);
            ctx.restore();
        }
    }];

    const options: ChartOptions<"doughnut"> = {
        rotation: -90,
        circumference: 180,
        cutout: `${cutout}%`,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
            }
        },
    };

    return (
        <div className="container my-4" key="HalfDoughnutChart">
            <Doughnut data={data} options={options} plugins={plugins}/>
        </div>
    );
}

export default HalfDoughnutChart;