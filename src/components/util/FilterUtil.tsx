import {VoteEntry} from "../../types/ElectionTypes.tsx";
import {FilterRule} from "../../types/FilterRule.tsx";

export const applyFilters = (entries: VoteEntry[], filters: FilterRule[]): VoteEntry[] => {
    console.log(`Applying ${filters.length} filters for ${entries.length} entries`);
    return entries.filter(entry => filters.every(filterRule => filterRule.filter(entry)));
};
