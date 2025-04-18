import { useState } from "react";
import { ActiveStates, FilterRule } from "../../types/FilterRule.tsx";
import GermanyGeoJson from "../../data/germany_states_map.geo.json";
import {
    ComposableMap,
    Geographies,
    Geography,
} from 'react-simple-maps';

interface GermanyMapProps {
    addFilter: (filterRule: FilterRule) => void;
    removeFilter: (filterId: string) => void;
}

const GermanyMap = function ({ addFilter, removeFilter }: GermanyMapProps) {
    const [activeStates, setActiveStates] = useState<ActiveStates>({});

    const handleStateClick = (stateName: string) => {
        // ... (keep your existing logic)
        const isActive = !activeStates[stateName];
        if (isActive) {
            addFilter({
                id: stateName, filter: (entry) => {
                    console.log(`Checking ${entry.state} against ${stateName}, are they equal? ${entry.state !== stateName}`)
                    return entry.state !== stateName
                }
            });
        } else {
            removeFilter(stateName);
        }
        setActiveStates(prev => ({
            ...prev,
            [stateName]: isActive
        }));
    };

    const getFillColor = (stateName: string) => {
        // ... (keep your existing logic)
        return activeStates[stateName] ? "#D6D6DA" : "#343434";
    };

    // --- Style for the wrapper ---
    const mapContainerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'stretch', // Vertically center
        justifyContent: 'center', // Horizontally center (optional, but often desired)
        width: '100%', // Take full available width
        height: '70%', // Crucial: Make this container take up vertical space
        // Or use a specific height like '500px', '80vh', etc.
        // Ensure the PARENT of GermanyMap provides this height.
    };

    return (
        // --- Wrapper Div ---
        <div style={mapContainerStyle}>
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 3200, center: [10, 51] }}
                // Optional: Add width/height to ComposableMap if needed,
                // but flexbox often handles sizing implicitly.
                // style={{ maxWidth: '100%', height: 'auto' }} // Example sizing for map itself
            >
                <Geographies geography={GermanyGeoJson}>
                    {({ geographies }) =>
                        geographies.map((geo) => {
                            const stateName = geo.properties.name;
                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    onClick={() => handleStateClick(stateName)}
                                    stroke="#000000"
                                    style={{
                                        default: {
                                            fill: getFillColor(stateName),
                                            transition: "fill 0.1s"
                                        },
                                        hover: {
                                            fill: activeStates[stateName] ? "#8d8d8d" : "#515151",
                                            outline: "none"
                                        },
                                        pressed: {
                                            fill: activeStates[stateName] ? "#777777" : "#3d3d3d",
                                            outline: "none"
                                        }
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
        </div> // --- End Wrapper Div ---
    );
};

export default GermanyMap;