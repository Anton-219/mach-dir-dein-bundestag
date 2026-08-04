import { allocateSainteLague } from './allocate-sainte-lague.ts'
import { FIXED_630_PARLIAMENT_SEATS } from './constants.ts'
import type {
  ElectoralSystemCalculator,
  ElectoralSystemPartyResult,
  ElectoralSystemWarning,
} from './electoral-system-types.ts'
import { isScenarioPartyEligible } from './qualify-parties.ts'

export const fixed630Calculator: ElectoralSystemCalculator = {
  systemId: 'de-2023-fixed-630',
  legalVersion: 'de-2023-fixed-630-transition-v1',
  calculate(input) {
    const eligibleParties = Object.keys(input.scenario.parties).filter((party) =>
      isScenarioPartyEligible(
        party,
        input.scenario,
        input.directWinsByParty[party] ?? 0,
      ),
    )
    const allocation = allocateSainteLague(
      eligibleParties.map((party) => ({
        key: party,
        votes: input.scenario.parties[party]?.secondVotes ?? 0,
      })),
      FIXED_630_PARLIAMENT_SEATS,
    )
    const seatsByParty = new Map(
      allocation.allocations.map((result) => [result.key, result.seats]),
    )

    // Story #39 replaces this aggregate transition with state-level
    // constituency-seat coverage. Until then, direct wins are covered only up
    // to the party's national seat total so the shared result invariants hold.
    const parties: ElectoralSystemPartyResult[] = Object.keys(
      input.scenario.parties,
    ).map((party) => {
      const totalSeats = seatsByParty.get(party) ?? 0
      const directWins = input.directWinsByParty[party] ?? 0
      const directSeats = Math.min(totalSeats, directWins)
      return {
        party,
        secondVotes: input.scenario.parties[party]?.secondVotes ?? 0,
        eligibleForListSeats: eligibleParties.includes(party),
        totalSeats,
        directWins,
        directSeats,
        listSeats: totalSeats - directSeats,
        uncoveredDistrictWins: directWins - directSeats,
      }
    })

    const warnings: ElectoralSystemWarning[] = [...allocation.warnings]
    if (input.scenario.mode === 'filtered-model') {
      warnings.push({ code: 'FILTERED_FIRST_VOTE_MODEL' })
    }
    const inactiveStates = input.scenario.states
      .filter((state) => !state.isActive)
      .map((state) => state.state)
    if (inactiveStates.length > 0) {
      warnings.push({
        code: 'INACTIVE_STATE_SIMULATION',
        details: { states: inactiveStates },
      })
    }

    return {
      systemId: 'de-2023-fixed-630',
      legalVersion: 'de-2023-fixed-630-transition-v1',
      scenarioMode: input.scenario.mode,
      totalSeats: FIXED_630_PARLIAMENT_SEATS,
      majorityThreshold: Math.floor(FIXED_630_PARLIAMENT_SEATS / 2) + 1,
      parties,
      warnings,
      metadata: {
        institutionalSeatCapacity: FIXED_630_PARLIAMENT_SEATS,
        allocatedDirectSeatCount: input.districtWinners.length,
        emptyDistrictCount:
          input.scenario.districts.length - input.districtWinners.length,
        reservedDirectSeats: 0,
        uncompensatedOverhangSeats: 0,
        inactiveStates,
      },
    }
  },
}
