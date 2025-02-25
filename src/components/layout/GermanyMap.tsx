import React, {ChangeEvent} from "react";
import {FilterRule} from "../../types/FilterRule.tsx";
import {
    ComposableMap,
    Geographies,
    Geography,
} from 'react-simple-maps';

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

const GermanyMap: React.FC<GermanyMapProps> = ({addFilter, removeFilter}: GermanyMapProps) => {
// Handler that logs the clicked state's name
    const handleStateClick = (stateName: string) => {
        console.log(`State clicked: ${stateName}`);
    };

    return (
        <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 2200, center: [10, 51] }} // adjust these for best view
        >
            <Geographies geography={geoUrl}>
                {({ geographies }) =>
                    geographies.map((geo) => {
                        // Depending on the GeoJSON, the property name may vary.
                        // Adjust 'NAME_1' if necessary.
                        const stateName = geo.properties.NAME_1 || geo.properties.NAME || 'Unknown';
                        return (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                onClick={() => handleStateClick(stateName)}
                                style={{
                                    default: { fill: "#D6D6DA", outline: "none" },
                                    hover: { fill: "#F53", outline: "none" },
                                    pressed: { fill: "#E42", outline: "none" },
                                }}
                            />
                        );
                    })
                }
            </Geographies>
        </ComposableMap>
    );
};

export default GermanyMap;