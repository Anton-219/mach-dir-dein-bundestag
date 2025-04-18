import { Doughnut } from "react-chartjs-2";
import { ChartOptions } from "chart.js";
import { Party, SeatResult } from "../../types/ElectionTypes.tsx";
import 'chart.js/auto'; // Ensure necessary controllers, elements, scales, plugins are registered

interface HalfPieChartProps {
    seatResults: SeatResult[];
    parties: Record<string, Party>;
    cutout?: number;
}

function HalfDoughnutChart({ seatResults, parties, cutout = 30 }: HalfPieChartProps) {
    const selectColor = function (abbreviation: string) {
        if (parties[abbreviation]) {
            return parties[abbreviation]?.color || "#ab59d4";
        }
        return "#CCCCCC"; // Fallback color
    };

    const totalSeats = seatResults.reduce((sum, result) => sum + result.seats, 0);

    const sortedSeatResults = [...seatResults].sort((a, b) => {
        const posA = parties[a.partyAbbreviation]?.seatPosition ?? Infinity;
        const posB = parties[b.partyAbbreviation]?.seatPosition ?? Infinity;
        return posA - posB;
    });

    const data = {
        labels: sortedSeatResults.map(p => parties[p.partyAbbreviation]?.abbreviation || p.partyAbbreviation),
        datasets: [
            {
                label: 'Seats',
                data: sortedSeatResults.map(p => p.seats),
                backgroundColor: sortedSeatResults.map(p => selectColor(p.partyAbbreviation)),
                // Optional: Add border color/width for better visual separation
                // borderColor: '#ffffff',
                // borderWidth: 1,
            },
        ],
    };

    const plugins = [{
        id: 'centerText',
        afterDraw: (chart: any) => {
            // *** Use arc's center coordinates for positioning ***
            const { ctx } = chart;
            const meta = chart.getDatasetMeta(0); // Get metadata for the first dataset

            // Ensure meta, data, and at least one arc element exist
            if (!meta || !meta.data || meta.data.length === 0) {
                // Fallback or do nothing if chart is not ready or has no data
                // console.warn("CenterText plugin: Chart metadata not available.");
                return;
            }

            // Use the center coordinates of the first arc element
            const arc = meta.data[0];
            const centerX = arc.x;
            const centerY = arc.y - 6; // This 'y' is the center of the doughnut ring

            ctx.save();
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#333333';

            const currentTotal = chart.data?.datasets?.[0]?.data?.reduce(
                (a: number, b: number) => a + b, 0
            ) ?? 0;

            ctx.fillText(`${currentTotal} Seats`, centerX, centerY);
            ctx.restore();
        }
    }];

    const options: ChartOptions<"doughnut"> = {
        responsive: true,
        maintainAspectRatio: false,
        rotation: -90,
        circumference: 180,
        cutout: `${cutout}%`,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    padding: 20,
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                            label += `${context.parsed} (${percentage}%)`;
                        }
                        return label;
                    }
                }
            },
            // The custom 'centerText' plugin is added separately via the plugins array
        },
        layout: {
            padding: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
            }
        }
    };

    return (
        <Doughnut data={data} options={options} plugins={plugins} />
    );
}

export default HalfDoughnutChart;