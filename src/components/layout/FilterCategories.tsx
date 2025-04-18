import React, {ChangeEvent, useMemo, useState} from "react";
import {ActiveStates, FilterRule} from "../../types/FilterRule.tsx";
import {StatVotes} from "../../types/ElectionTypes.tsx";
import {Bar} from "react-chartjs-2";
import {humanizeNumber} from "../util/Humanize.tsx";


interface FilterCategoriesProps {
    addFilter: (filterRule: FilterRule) => void;
    removeFilter: (filterId: string) => void;
    statVotes: StatVotes[];
}

type FilterCategory = 'gender' | 'ageGroup' | 'electionMethod';

function FilterCategories({addFilter, removeFilter, statVotes}: FilterCategoriesProps) {
    const [activeStates, setActiveStates] = useState<ActiveStates>({});
    const [selectedBars, setSelectedBars] = useState<Set<string>>(new Set());

    const handleFilterClick = (category: FilterCategory, value: string, event: ChangeEvent<HTMLInputElement>) => {
        const filterId = `${category}-${value}`;
        const isActive = !activeStates[filterId];
        if (!event.target.checked) {
            addFilter({
                id: filterId,
                filter: (entry) => entry[category] !== value
            });
        } else {
            removeFilter(filterId);
        }
        setActiveStates(prev => ({
            ...prev,
            [filterId]: isActive
        }));
    };

    // Process votes data for chart
    const {chartData, chartOptions} = useMemo(() => {
        const genderAgeGroupTotals: Record<'m' | 'w', Record<string, number>> = {m: {}, w: {}};

        statVotes.forEach(entry => {
            const gender = entry.gender;
            const ageGroup = entry.ageGroup;
            genderAgeGroupTotals[gender][ageGroup] = (genderAgeGroupTotals[gender][ageGroup] || 0) + entry.votes;
        });


        const ageGroups = ['65+', '55-64', '45-54', '35-44', '25-34', '18-24'];
        const data = {
            labels: ageGroups,
            datasets: [
                {
                    // label: 'Male',
                    data: ageGroups.map(ageGroup => -genderAgeGroupTotals.m[ageGroup] || 0),
                    backgroundColor: ageGroups.map((_, index) =>
                        selectedBars.has(`0-${index}`)
                            ? "#D6D6DA" // Selected color
                            : "#343434"// Default color
                    ),
                    categoryPercentage: 0.6,
                    barPercentage: 0.8,
                },
                {
                    label: 'Female',
                    data: ageGroups.map(ageGroup => genderAgeGroupTotals.w[ageGroup] || 0),
                    backgroundColor: ageGroups.map((_, index) =>
                        selectedBars.has(`1-${index}`)
                            ? "#D6D6DA" // Selected color
                            : "#343434"// Default color
                    ),
                    categoryPercentage: 0.6,
                    barPercentage: 0.8,
                }
            ]
        };

        const options = {
            indexAxis: 'y' as const,
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, elements: any[]) => {
                console.log('click', elements[0]); // this works
                if (elements.length > 0) {
                    const {datasetIndex, index} = elements[0];
                    const barKey = `${datasetIndex}-${index}`;

                    // Toggle selection state
                    setSelectedBars(prev => {
                        const next = new Set(prev);
                        if (next.has(barKey)) {
                            next.delete(barKey);
                        } else {
                            next.add(barKey);
                        }
                        return next;
                    });

                    const gender = datasetIndex === 0 ? 'm' : 'w';
                    const ageGroup = ageGroups[index];
                    const filterId = `ageGender-${ageGroup}-${gender}`;
                    const isActive = !activeStates[filterId];

                    if (isActive) {
                        addFilter({
                            id: filterId,
                            filter: (entry) => !(entry.ageGroup === ageGroup && entry.gender === gender)
                        });
                    } else {
                        removeFilter(filterId);
                    }

                    setActiveStates(prev => ({
                        ...prev,
                        [filterId]: isActive
                    }));
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        callback: (value: number | string) => {
                            return humanizeNumber(Math.abs(Number(value)));
                        },
                    },
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    offset: true,
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context: any) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.x;
                            return `${label}: ${humanizeNumber(Math.abs(value))}`;
                        }
                    }
                },
                legend: false,
                annotation: {},
                customTextPlugin: {},
                BackgroundIconPlugin: {}
            }
        };
        return {chartData: data, chartOptions: options};
    }, [statVotes, selectedBars, activeStates, addFilter, removeFilter]);

    const filterGroups = [
        {
            category: 'electionMethod' as const,
            values: ['postal', 'in-person'] as const,
            getLabel: (v: string) => v === 'postal' ? 'Postal Vote' : 'In-Person'
        },
        {
            category: 'gender' as const,
            values: ['m', 'w'] as const,
            getLabel: (v: string) => v === 'm' ? 'male' : 'female'
        }
    ];

    function createListElements(values: readonly string[], category: FilterCategory, getLabel: (v: string) => string) {
        return values.map((value) => {
            const filterId = `${category}-${value}`;
            return (
                <React.Fragment key={filterId}>
                    <input
                        type="checkbox"
                        className="btn-check"
                        id={filterId}
                        defaultChecked={true}
                        onChange={(e) => handleFilterClick(category, value, e)}
                    />
                    <label
                        className="btn btn-outline-primary py-2 px-3"
                        htmlFor={filterId}
                    >
                        {getLabel(value)}
                    </label>
                </React.Fragment>
            );
        });
    }

    return (
        <div className="overflow-auto p-2" 
             style={{width: '100%', maxHeight: '450px'}}>
            {/* 
              FILTER OPTIONS SIZE ADJUSTMENT:
              maxHeight is set to 450px to match the GermanyMap height
              Border, shadow, and bg-white removed as they're provided by the parent card
              Padding is reduced from p-3 to p-2
              Adjust these values if you need more/less space for the filter options
            */}
            {filterGroups.map(({category, values, getLabel}) => (
                <div key={category} className="mb-3">
                    <h6 className="mb-1 text-capitalize fw-bold">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                    </h6>
                    <div className="d-flex flex-wrap gap-2">
                        {createListElements(values, category, getLabel)}
                    </div>
                </div>
            ))}
            <div className="mb-3">
                <h6 className="mb-1 text-capitalize fw-bold">Age Group</h6>
                {/* 
                  AGE GROUP CHART SIZE ADJUSTMENT:
                  Height is reduced from 300px to 250px to make the chart more compact
                  Adjust this value if you need more/less space for the age group chart
                */}
                <div style={{height: '250px'}} className="border rounded shadow-sm p-2">
                    <Bar data={chartData} options={chartOptions}/>
                </div>
            </div>

            {/* Other Filter Groups */}
        </div>
    );
}

export default FilterCategories;
