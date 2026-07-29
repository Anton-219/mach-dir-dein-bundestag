import {VoteEntry} from "../../types/ElectionTypes.tsx";
import {FilterRule} from "../../types/FilterRule.tsx";

/**
 * @deprecated The typed replacement lives in
 * `app-v2/src/lib/election/filter-votes.ts`.
 */
export const applyFilters = (entries: VoteEntry[], filters: FilterRule[]): VoteEntry[] => {
    console.log(`Applying ${filters.length} filters for ${entries.length} entries`);
    return entries.filter(entry => filters.every(filterRule => filterRule.filter(entry)));
};
