import ParliamentView from "./ParliamentView.tsx";
import {useEffect, useMemo, useState} from "react";
import {
    AgeGroup,
    DirectMandateWinner,
    ElectionResult,
    Party,
    SeatResult,
    StatVotes,
    VoteEntry
} from "../../types/ElectionTypes.tsx";
import electionData from '../../data/second_votes.json';
import directMandateWinnerData from '../../data/election_results_direktmandate.json';
import partyData from '../../data/partyData.json';
import voteData from '../../data/stat_votes.json'
import {applyFilters} from "../util/FilterUtil.tsx";
import {FilterRule} from "../../types/FilterRule.tsx";
import GermanyMap from "./GermanyMap.tsx";
import FilterCategories from "./FilterCategories.tsx";
import {VoteReformSeatCalculator} from "../parliament/seatCalculators/VoteReformSeatCalculator.tsx";
import CoalitionList from "./CoalitionList.tsx";


function OverviewLayout() {
    const [parties, setParties] = useState<Record<string, Party>>({});
    const [directMandateWinners, setDirectMandateWinners] = useState<DirectMandateWinner[]>([]);
    const [statVotes, setStatVotes] = useState<StatVotes[]>([]);
    const [voteEntries, setVoteEntries] = useState<VoteEntry[]>([]);
    const [filters, setFilters] = useState<FilterRule[]>([]);
    const [totalSeats, setTotalSeats] = useState<number>(0);
    const [seatResults, setSeatResults] = useState<SeatResult[]>([]);

    // Loading initial data
    useEffect(() => {
        // Load vote results
        const initialVoteResultData = electionData.map(entry => ({
            ...entry,
            gender: entry.gender as 'm' | 'w',
            ageGroup: entry.ageGroup as AgeGroup,
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

        const initialVoteData = voteData.map(x => {
            return {
                gender: x.gender as 'm' | 'w',
                ageGroup: x.ageGroup as AgeGroup,
                party: x.party,
                votes: x.votes,
            }
        });
        setStatVotes(initialVoteData);
    }, []);

    // Update Election Results when a filter is added/removed
    const electionResults = useMemo(() => {
        const calculateElectionResults = function (filteredVoteEntries: VoteEntry[]) {
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

        const filteredVoteEntries = applyFilters(voteEntries, filters);
        const _electionResults = calculateElectionResults(filteredVoteEntries);
        console.log("ElectionResults", _electionResults);
        return Object.values(_electionResults)
    }, [voteEntries, filters, parties])

    // Update the seatResults when the calculator or the election results changed
    const seatCalculator = useMemo(() => new VoteReformSeatCalculator(), []);
    useEffect(() => {
        const results = seatCalculator.calculate(electionResults, directMandateWinners);
        setSeatResults(results);
    }, [directMandateWinners, electionResults, seatCalculator]);

    // Update the totalSeats when the Seats are rearranged
    useEffect(() => {
        const total = seatResults.map(x => x.seats).reduce((sum, seats) => sum + seats, 0);
        setTotalSeats(total);
    }, [seatResults]);


    const addFilter = function (newFilter: FilterRule) {
        console.log("Adding filter", newFilter)
        setFilters((prev) => [...prev, newFilter]);
    }

    const removeFilter = function (filterId: string) {
        setFilters((prev) => prev.filter((f) => f.id !== filterId));
    }

    return (
        <div className="container-fluid vh-100 d-flex flex-column py-3">
            <div className="row mb-3">
                <div className="col-12">
                    <h1 className="text-center">Create Your Bundestag</h1>
                </div>
            </div>
            {/* 
              * LAYOUT SIZE ADJUSTMENT:
              * Upper row height is set to 40vh to ensure it doesn't overlap with lower components
              * Adjust this value if you need more/less space for the upper components
            */}
            <div className="row" style={{height: '40vh'}}>  {/* Upper Half - reduced height */}
                <div className="col-md-6 d-flex align-items-center justify-content-center">
                    <div className="w-100 h-100 p-2">
                        <ParliamentView seatResult={seatResults} parties={parties}/>
                    </div>
                </div>
                <div className="col-md-6 d-flex align-items-center justify-content-center">
                    <div className="w-100 h-100 p-2">
                        <GermanyMap addFilter={addFilter} removeFilter={removeFilter}/>
                    </div>
                </div>
            </div>
            {/* 
              * LAYOUT SIZE ADJUSTMENT:
              * Lower row height is set to 40vh to ensure it doesn't overlap with upper components
              * A margin-top is added to create space between the rows
              * Adjust these values if you need more/less space for the lower components
            */}
            <div className="row mt-3" style={{height: '40vh'}}>  {/* Lower Half - reduced height with margin top */}
                <div className="col-md-6 d-flex align-items-center justify-content-center">
                    <div className="w-100 h-100 p-2">
                        <CoalitionList seats={seatResults} totalSeats={totalSeats} parties={parties}/>
                    </div>
                </div>
                <div className="col-md-6 d-flex align-items-center justify-content-center">
                    <div className="w-100 h-100 p-2">
                        <FilterCategories addFilter={addFilter} removeFilter={removeFilter} statVotes={statVotes}/>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OverviewLayout;
