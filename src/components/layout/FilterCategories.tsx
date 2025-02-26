import React, {ChangeEvent} from "react";
import {ActiveStates, FilterRule} from "../../types/FilterRule.tsx";
import {useState} from "react";


interface FilterCategoriesProps {
    addFilter: (filterRule: FilterRule) => void;
    removeFilter: (filterId: string) => void;
}

type FilterCategory = 'gender' | 'ageGroup' | 'electionMethod';

function FilterCategories({addFilter, removeFilter}: FilterCategoriesProps) {
    const [activeStates, setActiveStates] = useState<ActiveStates>({});

    const handleFilterClick = (category: FilterCategory, value: string, event: ChangeEvent<HTMLInputElement>) => {
        const filterId= `${category}-${value}`;
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

    const filterGroups = [
        {
            category: 'gender' as const,
            values: ['m', 'w'] as const,
            getLabel: (v: string) => v === 'm' ? 'Male' : 'Female'
        },
        {
            category: 'ageGroup' as const,
            values: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'] as const,
            getLabel: (v: string) => v
        },
        {
            category: 'electionMethod' as const,
            values: ['postal', 'in-person'] as const,
            getLabel: (v: string) => v === 'postal' ? 'Postal Vote' : 'In-Person'
        }
    ];

    function createListElements(values: readonly [string, string] | readonly [string, string, string, string, string, string] | readonly [string, string],
                                category: FilterCategory,
                                getLabel: ((v: string) => (string))) {
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
        <div className="p-3">
            {filterGroups.map(({ category, values, getLabel }) => (
                <div key={category} className="mb-4">
                    <h5 className="mb-2 text-capitalize fw-bold">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                    </h5>
                    <div className="d-flex flex-wrap gap-2">
                        {createListElements(values, category, getLabel)}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default FilterCategories;