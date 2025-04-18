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
        // Add a default fallback color if party not found, though ideally all parties in results should be in parties data
        return "#CCCCCC"; // Grey color as a fallback
    };

    const totalSeats = seatResults.reduce((sum, result) => sum + result.seats, 0);
    // console.log("Total seats ", totalSeats); // Keep for debugging if needed

    // Sort results based on seatPosition defined in partyData for consistent ordering
    const sortedSeatResults = [...seatResults].sort((a, b) => {
        const posA = parties[a.partyAbbreviation]?.seatPosition ?? Infinity;
        const posB = parties[b.partyAbbreviation]?.seatPosition ?? Infinity;
        return posA - posB;
    });

    const data = {
        labels: sortedSeatResults.map(p => parties[p.partyAbbreviation]?.name || p.partyAbbreviation), // Use full name or abbreviation
        datasets: [
            {
                label: 'Seats', // Added label for clarity in tooltips/legend
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
        // Using 'any' type for chart temporarily to avoid deep type digging for Chart.js v3/v4
        afterDraw: (chart: any) => {
            const { ctx, chartArea } = chart;
            // Check if chartArea is defined (it might not be on initial renders or if chart is hidden)
            if (!chartArea) return;

            // Use chartArea dimensions for more reliable positioning if needed, but centerX/Y from arc is often fine
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2 + (chart.options.rotation / -90 * 10); // Adjust Y slightly based on rotation for half-doughnut

            ctx.save();
            ctx.font = 'bold 20px sans-serif'; // Adjust font styles as needed
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#333333'; // Darker text color for better contrast

            // Ensure data and datasets exist before trying to reduce
            const currentTotal = chart.data?.datasets?.[0]?.data?.reduce(
                (a: number, b: number) => a + b, 0
            ) ?? 0; // Provide a default value if data is missing

            // console.log("FillText", currentTotal); // Keep for debugging if needed
            ctx.fillText(`${currentTotal} Seats`, centerX, centerY); // Add "Seats" label
            ctx.restore();
        }
    }];

    const options: ChartOptions<"doughnut"> = {
        responsive: true,         // Ensure chart resizing works
        maintainAspectRatio: false, // *** Crucial: Allow chart to fill container height ***
        rotation: -90,             // Start at the top (-90 degrees)
        circumference: 180,        // Make it a semicircle
        cutout: `${cutout}%`,      // Control the thickness of the doughnut
        plugins: {
            legend: {
                display: true,
                position: 'bottom',    // Keep legend at the bottom
                labels: {
                    padding: 20,       // Add some padding to the legend
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
                            // Calculate percentage
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                            label += `${context.parsed} (${percentage}%)`;
                        }
                        return label;
                    }
                }
            },
            // The custom 'centerText' plugin is added separately via the plugins array
        },
        // Layout padding can help prevent labels/legend cutoff
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