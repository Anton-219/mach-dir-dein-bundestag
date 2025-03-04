import {Bar} from "react-chartjs-2";
import {Chart} from "chart.js";
import ChartAnnotation from 'chartjs-plugin-annotation';
import {Party, SeatResult} from "../../types/ElectionTypes.tsx";
import './CoalitionItem.css'

interface CoalitionItemProps {
    key: string,
    totalSeats: number,
    coalition: SeatResult[],
    parties: Record<string, Party>,
}

Chart.register(ChartAnnotation);


function CoalitionItem({key, totalSeats, coalition, parties}: CoalitionItemProps) {
    const coalitionTotal = coalition.reduce((sum, party) => sum + party.seats, 0);
    const remainingSeats = totalSeats - coalitionTotal;

    const getPartyColor = (abbreviation: string) => {
        return parties[abbreviation]?.color || '#cccccc';
    };

    // Dataset configuration
    const datasets = coalition.map(party => ({
        label: party.partyAbbreviation,
        data: [party.seats],
        backgroundColor: getPartyColor(party.partyAbbreviation),
        borderWidth: 0,
        stack: 'coalition',
        categoryPercentage: 1,
        barPercentage: 1
    }));

    // Add remaining seats as white segment
    if (remainingSeats > 0) {
        datasets.push({
            label: 'Remaining',
            data: [remainingSeats],
            backgroundColor: '#efefef',
            borderWidth: 0,
            stack: 'coalition',
            categoryPercentage: 1,
            barPercentage: 1
        });
    }


    // Chart options
    const options = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: 0
        },
        scales: {
            x: {
                stacked: true,
                max: totalSeats,
                display: false,
                grid: {
                    display: false
                }
            },
            y: {
                display: false,
                grid: {
                    display: false
                }
            }
        },
        plugins: {
            legend: {display: false},
            tooltip: {enabled: false},
            annotation: {
                annotations: {
                    midline: {
                        type: 'line',
                        mode: 'vertical',
                        scaleID: 'x',
                        value: totalSeats / 2,
                        borderColor: '#a80000',
                        borderWidth: 2,
                        borderDash: [2,2],
                    },
                    border: {
                        type: 'box',
                        xScaleID: 'x',
                        yScaleID: 'y',
                        xMin: 0,
                        xMax: totalSeats,
                        yMin: -0.5,
                        yMax: 0.5,
                        backgroundColor: 'rgba(0,0,0,0)',
                        borderColor: '#000',
                        borderWidth: 2
                    }
                }
            }
        }
    };

    const data = {
        labels: [''],
        datasets: datasets,
    };

    return (
        <div key={`coalition-item-${key}`}>
            <div className="d-flex flex-wrap gap-3 mb-2 party-list">
                {coalition.map((seatResult) => (
                    seatResult && (
                        <div key={`coalition-item-header-${seatResult.partyAbbreviation}`}
                             className="d-flex align-items-center gap-1">
                        <span className="party-name">
                                {seatResult.partyAbbreviation} ({seatResult.seats})
                            </span>
                        </div>
                    )
                ))}
            </div>
            <div key={`coalition-item-bar-${key}`} className="mb-4"
                 style={{height: '60px'}}>
                <Bar options={options} data={data}/>
            </div>
        </div>
    );
}

export default CoalitionItem;