import {VoteEntry} from "./ElectionTypes.tsx";

export interface FilterRule {
    id: string;
    filter: (entry: VoteEntry) => boolean;
}