import ParliamentView from "./ParliamentView.tsx";
import {useEffect, useMemo, useState} from "react";
import {
    DirectMandateWinner,
    ElectionResult,
    Party,
    VoteEntry
} from "../../types/ElectionTypes.tsx";
import electionData from '../../data/second_votes.json';
import directMandateWinnerData from '../../data/election_results_direktmandate.json';
import partyData from '../../data/partyData.json';
import {applyFilters} from "../util/FilterUtil.tsx";
import {FilterRule} from "../../types/FilterRule.tsx";
import GermanyMap from "./GermanyMap.tsx";
import FilterCategories from "./FilterCategories.tsx";
import {VoteReformSeatCalculator} from "../election/seatCalculators/VoteReformSeatCalculator.tsx";

function OverviewLayout() {
    const [parties, setParties] = useState<Record<string, Party>>({});
    const [voteEntries, setVoteEntries] = useState<VoteEntry[]>([]);
    const [filters, setFilters] = useState<FilterRule[]>([]);
    const [directMandateWinners, setDirectMandateWinners] = useState<DirectMandateWinner[]>([]);
    // const [electionResult, setElectionResult] = useState<ElectionResult[]>([]);

    // Load initial data
    useEffect(() => {
        // Load vote results
        const initialVoteResultData = electionData.map(entry => ({
            ...entry,
            gender: entry.gender as 'm' | 'w',
            ageGroup: entry.ageGroup as '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+',
            voteType: entry.voteType as '1' | '2',
            electionMethod: entry.electionMethod as 'postal' | 'in-person',
        }));
        setVoteEntries(initialVoteResultData);

        // load party data
        const initialPartyData = partyData.reduce((acc, entry) => {
            acc[entry.abbreviation] = entry;
            return acc;
        }, {} as Record<string, Party>);
        setParties(initialPartyData);

        const initialDirectMandateWinners = directMandateWinnerData.map(x => {
            return {
                party: x.party,
                districtsWon: x.districts_won
            }
        });
        setDirectMandateWinners(initialDirectMandateWinners);

    }, []);

    function calculateElectionResults(filteredVoteEntries: VoteEntry[]) {
        const _electionResults: Record<string, ElectionResult> = {}
        let totalVotes = 0;
        filteredVoteEntries.forEach((voteEntry: VoteEntry) => {
            totalVotes += voteEntry.votes
            if (!_electionResults[voteEntry.party]) {
                _electionResults[voteEntry.party] = {
                    partyAbbreviation: voteEntry.party,
                    votes: voteEntry.votes,
                    percentage: 0,
                    seatPosition: parties[voteEntry.party].seatPosition,
                };
            } else {
                _electionResults[voteEntry.party].votes += voteEntry.votes;
            }
        })
        console.log("Total votes received", totalVotes)
        if (totalVotes > 0) {
            for (const key in _electionResults) {
                _electionResults[key].percentage = _electionResults[key].votes / totalVotes;
            }
        }
        return _electionResults;
    }

    const electionResults = useMemo(() => {
        const filteredVoteEntries = applyFilters(voteEntries, filters);
        const _electionResults = calculateElectionResults(filteredVoteEntries);
        console.log("ElectionResults", _electionResults);
        return Object.values(_electionResults)
    }, [parties, voteEntries, filters])

    const addFilter = function (newFilter: FilterRule) {
        console.log("Adding filter", newFilter)
        setFilters((prev) => [...prev, newFilter]);
    }

    const removeFilter = function (filterId: string) {
        setFilters((prev) => prev.filter((f) => f.id !== filterId));
    }

    return (
        <div className="container-fluid vh-100 d-flex flex-column">
            <div className="row flex-fill">  {/* Upper Half */}
                <div className="col-md-6 d-flex align-items-center justify-content-center">
                    <ParliamentView electionResults={electionResults}
                                    parties={parties}
                                    seatCalculator={new VoteReformSeatCalculator()}
                                    directMandateWinners={directMandateWinners}
                    />
                </div>
                <div className="col-md-6 d-flex align-items-center justify-content-center">
                    <GermanyMap addFilter={addFilter} removeFilter={removeFilter}/>
                </div>
            </div>
            <div className="row flex-fill">  {/* Lower Half */}
                <div className="col-md-6 d-flex align-items-center justify-content-center">
                    Section 3
                </div>
                <div className="col-md-6 d-flex align-items-center justify-content-center">
                    <FilterCategories addFilter={addFilter} removeFilter={removeFilter}/>
                </div>
            </div>
        </div>
    );
}

export default OverviewLayout;