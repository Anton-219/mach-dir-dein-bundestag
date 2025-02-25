import React, {ChangeEvent} from "react";
import {FilterRule} from "../../types/FilterRule.tsx";

const germanStates = [
    "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg",
    "Bremen", "Hamburg", "Hessen", "Niedersachsen",
    "Mecklenburg-Vorpommern", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland",
    "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen"
];


interface GermanyMapProps {
    addFilter: (filterRule: FilterRule) => void;
    removeFilter: (filterId: string) => void;
}

const GermanyStateSelection: React.FC<GermanyMapProps> = ({addFilter, removeFilter}: GermanyMapProps) => {

    const handleStateClick = function (state: string, event: ChangeEvent<HTMLInputElement>) {
        console.log(event)
        if (!event.target.checked) {
            console.log("State clicked and adding Filter", state)
            addFilter({
                id: state,
                filter: (entry) => {
                    console.log(`Checking ${entry.state} against ${state}, are they equal? ${entry.state !== state}`)
                    return entry.state !== state
                },
            });
        } else {
            console.log("State clicked and removing Filter", state)
            removeFilter(state)
        }
    };

    const listElements = function (elements: string[]) {
        return elements.map((state) => (
            <React.Fragment key={state}>
                <input type="checkbox"
                       className="btn-check"
                       id={state}
                       autoComplete="off"
                       key={state}
                       defaultChecked={true}
                       onChange={(e) => handleStateClick(state, e)}
                />
                <label className="btn btn-outline-primary w-100 mb-1" htmlFor={state}>
                    {state}
                </label>
            </React.Fragment>
        ));
    }

    return (
        <div className="container mt-3">
            <h2>Select German States</h2>
            <div className="row">
                {/* Left Column (8 states) */}
                <div className="col-md-6">
                    {listElements(germanStates.slice(0, 8))}
                </div>
                {/* Right Column (8 states) */}
                <div className="col-md-6">
                    {listElements(germanStates.slice(8))}
                </div>
            </div>
        </div>
    );
};

export default GermanyMap;