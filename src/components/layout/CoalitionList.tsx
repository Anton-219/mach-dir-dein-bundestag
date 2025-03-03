import {Party, SeatResult} from "../../types/ElectionTypes.tsx";
import {useCoalitionCalculator} from "../parliament/CoalitionCalculator.tsx";
import {Bar} from "react-chartjs-2";


function mergeCduCsuSeatResults(seats: SeatResult[]): SeatResult[] {
    console.log("Received seatResults", seats);
    const merged = new Map<string, SeatResult>();
    if (seats.filter(x => x.partyAbbreviation === 'CDU' || x.partyAbbreviation === 'CSU').length < 2) {
        // If one of the CDU/CSU parties is not present then we do not have to merge anything.
        return seats;
    }
    for (const seat of seats) {
        // Determine the group key
        const key = (seat.partyAbbreviation === 'CDU' || seat.partyAbbreviation === 'CSU')
            ? 'CDU+CSU'
            : seat.partyAbbreviation;
        const existing = merged.get(key);
        if (existing) {
            existing.seats += seat.seats;
        } else {
            merged.set(key, {
                partyAbbreviation: key,
                seats: seat.seats,
                seatPosition: seat.seatPosition,
            });
        }
    }
    console.log("merged seatResults", merged);
    return Array.from(merged.values());
}


interface CoalitionListProps {
    seats: SeatResult[];
    totalSeats: number;
    parties: Record<string, Party>
}

function CoalitionList({seats, totalSeats, parties}: CoalitionListProps) {
    const threshold = Math.ceil((totalSeats + 1) / 2);
    const coalitions: SeatResult[][] = useCoalitionCalculator(mergeCduCsuSeatResults(seats), threshold);

    const getPartyColor = (abbreviation: string) => {
        return parties[abbreviation]?.color || '#cccccc';
    };

    return (
        <div className="coalition-list">
            {coalitions.map((coalition, index) => {
                const sortedCoalition = [...coalition].sort((a, b) => a.seatPosition - b.seatPosition);
                const coalitionTotal = sortedCoalition.reduce((sum, party) => sum + party.seats, 0);
                const remainingSeats = totalSeats - coalitionTotal;

                // Dataset configuration
                const datasets = sortedCoalition.map(party => ({
                    label: party.partyAbbreviation,
                    data: [party.seats],
                    backgroundColor: getPartyColor(party.partyAbbreviation),
                    borderWidth: 0,
                    stack: 'coalition',
                }));

                // Add remaining seats as white segment
                if (remainingSeats > 0) {
                    datasets.push({
                        label: 'Remaining',
                        data: [remainingSeats],
                        backgroundColor: '#ffffff',
                        borderWidth: 0,
                        stack: 'coalition',
                    });
                }

                // Chart options
                const options = {
                    indexAxis: 'y' as const,
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            stacked: true,
                            max: totalSeats,
                            display: false,
                        },
                        y: {
                            display: false,
                        },
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false },
                        annotation: {
                            annotations: {
                                midline: {
                                    type: 'line',
                                    mode: 'vertical',
                                    scaleID: 'x',
                                    value: totalSeats / 2,
                                    borderColor: '#000',
                                    borderWidth: 2,
                                },
                            },
                        },
                    },
                };

                const data = {
                    labels: [''],
                    datasets: datasets,
                };

                return (
                    <div key={index} className="mb-4" style={{ height: '60px' }}>
                        <Bar options={options} data={data} />
                    </div>
                );
            })}
        </div>
    );

}

export default CoalitionList;