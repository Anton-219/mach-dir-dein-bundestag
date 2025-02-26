import {VoteEntry} from "./ElectionTypes.tsx";

export interface FilterRule {
    id: string;
    filter: (entry: VoteEntry) => boolean;
}

// Manages the activity state for several filter types.
export interface ActiveStates {
    [key: string]: boolean;
}