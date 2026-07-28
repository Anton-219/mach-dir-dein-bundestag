import ParliamentView from "./ParliamentView.tsx";
import { useEffect, useMemo, useState } from "react";
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
import { applyFilters } from "../util/FilterUtil.tsx";
import { FilterRule } from "../../types/FilterRule.tsx";
import GermanyMap from "./GermanyMap.tsx";
import FilterCategories from "./FilterCategories.tsx";
import { VoteReformSeatCalculator } from "../parliament/seatCalculators/VoteReformSeatCalculator.tsx";
import CoalitionList from "./CoalitionList.tsx";

function OverviewLayout() {
    const [parties, setParties] = useState<Record<string, Party>>({});
    const [directMandateWinners, setDirectMandateWinners] = useState<DirectMandateWinner[]>([]);
    const [statVotes, setStatVotes] = useState<StatVotes[]>([]);
    const [voteEntries, setVoteEntries] = useState<VoteEntry[]>([]);
    const [filters, setFilters] = useState<FilterRule[]>([]);
    const [totalSeats, setTotalSeats] = useState<number>(0);
    const [seatResults, setSeatResults] = useState<SeatResult[]>([]);

    // --- Data loading and calculations remain the same ---
    useEffect(() => {
        const initialVoteResultData = electionData.map(entry => ({
            ...entry,
            gender: entry.gender as 'm' | 'w',
            ageGroup: entry.ageGroup as AgeGroup,
            voteType: entry.voteType as '1' | '2',
            electionMethod: entry.electionMethod as 'postal' | 'in-person',
        }));
        setVoteEntries(initialVoteResultData);

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
                        seatPosition: parties[voteEntry.party]?.seatPosition ?? 999,
                    };
                } else {
                    _electionResults[voteEntry.party].votes += voteEntry.votes;
                }
            })
            if (totalVotes > 0) {
                for (const key in _electionResults) {
                    _electionResults[key].percentage = _electionResults[key].votes / totalVotes;
                }
            }
            return _electionResults;
        }

        const filteredVoteEntries = applyFilters(voteEntries, filters);
        const _electionResults = calculateElectionResults(filteredVoteEntries);
        return Object.values(_electionResults)
    }, [voteEntries, filters, parties])

    const seatCalculator = useMemo(() => new VoteReformSeatCalculator(), []);
    useEffect(() => {
        if(Object.keys(parties).length > 0) {
            const results = seatCalculator.calculate(electionResults, directMandateWinners);
            setSeatResults(results);
        }
    }, [directMandateWinners, electionResults, seatCalculator, parties]);

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

    // --- Define a minimum height for the ParliamentView area ---
    // You might need to adjust this value based on your ParliamentView's actual content
    // and how small you're willing to let it get. Test different values.
    const parliamentMinHeight = '300px'; // Example: minimum height of 300px
    // Or use viewport units: const parliamentMinHeight = '30vh';

    return (
        // Main container setup for full height flex
        <div className="d-flex flex-column vh-100 px-4 pt-4">

            {/* Title Row (takes natural height) */}
            <div className="row mb-4 flex-shrink-0"> {/* Added flex-shrink-0 */}
                <div className="col-12">
                    <h1 className="text-center fs-3">Create Your Bundestag</h1>
                </div>
            </div>

            {/* Main Content Row */}
            {/* Use flex-grow-1 to take remaining vertical space */}
            {/* REMOVED overflow-hidden to allow scrolling on genuinely small screens */}
            {/* Use gap for spacing */}
            <div className="row flex-grow-1 gy-3 gx-3 mb-2">

                {/* Left Column (Parliament + Coalition) */}
                {/* Flex column, fill height, use gap */}
                <div className="col-md-5 d-flex flex-column gap-4">

                    {/* Parliament View Card (Top Left) */}
                    {/* Added flex-shrink-0 to prevent it from shrinking below its content/min-height */}
                    {/* Set min-height on the card-body */}
                    <div className="card shadow-sm flex-shrink-0"> {/* Added flex-shrink-0 */}
                        <div className="card-body" style={{ minHeight: parliamentMinHeight }}> {/* ADDED minHeight style */}
                            <ParliamentView seatResult={seatResults} parties={parties} />
                        </div>
                    </div>

                    {/* Coalition List Card (Bottom Left) */}
                    {/* flex-grow-1 allows it to take space *after* Parliament's min-height is met */}
                    {/* overflow-hidden on CARD, overflow-y-auto INSIDE body */}
                    {/* Added flex-shrink-1 to allow this component to shrink when needed */}
                    <div className="card shadow-sm  flex-shrink-1 min-h-0 flex-grow-1" style={{ maxHeight: parliamentMinHeight }}> {/* Added flex-shrink-1 and min-h-0 */}
                        <div className="card-body flex-column min-h-0">
                            <h5 className="mb-2 flex-shrink-0">Possible Coalitions</h5>
                            {/* This div scrolls if list is too long for the allocated space */}
                            <div className="flex-grow-1 overflow-y-auto"> {/* Ensures internal scrolling */}
                                <CoalitionList seats={seatResults} totalSeats={totalSeats} parties={parties} />
                            </div>
                        </div>
                    </div>

                </div> {/* End Left Column */}

                {/* Middle Column (Map) */}
                {/* Fill height */}
                <div className="col-md-4 d-flex h-100">
                    {/* Map Card */}
                    {/* Fill height, overflow-hidden on CARD, internal scroll/management */}
                    {/* Added flex-shrink-1 to allow this component to shrink when needed */}
                    <div className="card shadow-sm h-100 w-100 flex-shrink-1 min-h-0"> {/* Added flex-shrink-1 and min-h-0 */}
                        <div className="card-body d-flex flex-column">
                            <h5 className="card-title flex-shrink-0">Map Filters</h5>
                            {/* Map container grows, map should fit/handle its own view */}
                            <div className="flex-grow-1 flex-shrink-1 position-relative min-h-0"> {/* Added flex-shrink-1 and min-h-0 */}
                                {/* Ensure GermanyMap adapts to this container */}
                                <GermanyMap addFilter={addFilter} removeFilter={removeFilter} />
                            </div>
                        </div>
                    </div>
                </div> {/* End Middle Column */}

                {/* Right Column (Filter Categories) */}
                {/* Fill height */}
                <div className="col-md-3 d-flex h-100">
                    {/* Filter Card */}
                    {/* Fill height, overflow-hidden on CARD, internal scroll */}
                    {/* Added flex-shrink-1 to allow this component to shrink when needed */}
                    <div className="card shadow-sm h-100 w-100 flex-shrink-1 min-h-0"> {/* Added flex-shrink-1 and min-h-0 */}
                        {/* Card body scrolls internally if filters list is long */}
                        <div className="card-body overflow-y-auto d-flex flex-column"> {/* Added d-flex flex-column */}
                            <h5 className="card-title flex-shrink-0">Filter Options</h5>
                            <div className="flex-grow-1 flex-shrink-1 min-h-0 overflow-auto"> {/* Added container with flex properties */}
                                <FilterCategories addFilter={addFilter} removeFilter={removeFilter} statVotes={statVotes} />
                            </div>
                        </div>
                    </div>
                </div> {/* End Right Column */}

            </div> {/* End Main Content Row */}

            {/* Footer Info Text (pushed to bottom) */}
            {/* Added flex-shrink-0 */}
            <div className="row mt-auto pt-1 pb-1 flex-shrink-0"> {/* Reduced padding */}
                <div className="col-12">
                    <p className="text-center text-muted small mb-0" style={{ fontSize: '0.7rem' }}> {/* Reduced text size */}
                        The data is based on information from bundeswahlleiterin.de. The demographic data has been extrapolated and may contain potential rounding inaccuracies.
                    </p>
                </div>
            </div>

        </div> // End Main Container
    );
}

export default OverviewLayout;
