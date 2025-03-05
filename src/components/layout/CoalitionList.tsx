import {Party, SeatResult} from "../../types/ElectionTypes.tsx";
import {useCoalitionCalculator} from "../parliament/CoalitionCalculator.tsx";
import CoalitionItem from "./CoalitionItem.tsx";

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
    const coalitions: SeatResult[][] = useCoalitionCalculator(
        mergeCduCsuSeatResults(seats),
        threshold
    );
    return (
        // The outer div provides a scrollable container (using Bootstrap's overflow-auto)
        // and sets a max height so that if the content exceeds it, scrolling is enabled.
        <div className="coalition-list overflow-auto" style={{maxHeight: '500px', width: '100%'}}>
            {/* Use Bootstrap row with two columns */}
            <div className="row row-cols-2">
                {coalitions.map((coalition, index) => (
                    <div key={`coalition-item-${index}`} className="col" style={{width: '45s%'}}>
                        <CoalitionItem
                            idKey={`coalition-item-${index}`}
                            totalSeats={totalSeats}
                            coalition={coalition}
                            parties={parties}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CoalitionList;