import {useState} from "react";
import {FilterRule} from "../../types/FilterRule.tsx";
import GermanyGeoJson from "../../data/germany_states_map.geo.json"
import {ComposableMap, Geographies, Geography,} from 'react-simple-maps';

interface GermanyMapProps {
    addFilter: (filterRule: FilterRule) => void;
    removeFilter: (filterId: string) => void;
}

type ActiveStates = {
    [key: string]: boolean;
};

const GermanyMap = function ({addFilter, removeFilter}: GermanyMapProps) {
    const [activeStates, setActiveStates] = useState<ActiveStates>({});

    const handleStateClick = (stateName: string) => {
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
        return activeStates[stateName] ? "#D6D6DA" : "#343434";
    };
    return (
        <ComposableMap
            projection="geoMercator"
            projectionConfig={{scale: 2600, center: [10, 51]}} // adjust these for best view
        >
            <Geographies geography={GermanyGeoJson}>
                {({geographies}) =>
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
    );
};

export default GermanyMap;