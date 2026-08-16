import { allocateSainteLague } from './allocate-sainte-lague.ts'
import { FIXED_630_PARLIAMENT_SEATS } from './constants.ts'
import type {
  DistrictWinner,
  ElectoralScenario,
  ElectoralSystemCalculator,
  ElectoralSystemPartyResult,
  ElectoralSystemWarning,
} from './electoral-system-types.ts'
import { isScenarioPartyEligible } from './qualify-parties.ts'

const LEGAL_VERSION = 'de-2023-fixed-630-v1'

function createDirectWinsByPartyAndState(
  districtWinners: readonly DistrictWinner[],
): ReadonlyMap<string, ReadonlyMap<string, number>> {
  const counts = new Map<string, Map<string, number>>()
  for (const winner of districtWinners) {
    const byState = counts.get(winner.party) ?? new Map<string, number>()
    byState.set(winner.state, (byState.get(winner.state) ?? 0) + 1)
    counts.set(winner.party, byState)
  }
  return counts
}

function allocatePartySeatsByState(
  scenario: ElectoralScenario,
  seatsByParty: ReadonlyMap<string, number>,
): {
  seatsByPartyAndState: ReadonlyMap<string, ReadonlyMap<string, number>>
  warnings: readonly ElectoralSystemWarning[]
} {
  const activeStates = scenario.states.filter((state) => state.isActive)
  const seatsByPartyAndState = new Map<string, ReadonlyMap<string, number>>()
  const warnings: ElectoralSystemWarning[] = []

  for (const [party, seatCount] of seatsByParty) {
    if (seatCount === 0) {
      seatsByPartyAndState.set(party, new Map())
      continue
    }

    const allocation = allocateSainteLague(
      activeStates.map((state) => ({
        key: state.state,
        votes: state.secondVotesByParty[party] ?? 0,
      })),
      seatCount,
    )
    seatsByPartyAndState.set(
      party,
      new Map(
        allocation.allocations.map((stateAllocation) => [
          stateAllocation.key,
          stateAllocation.seats,
        ]),
      ),
    )
    warnings.push(
      ...allocation.warnings.map((warning) => ({
        ...warning,
        details: {
          ...warning.details,
          party,
        },
      })),
    )
  }

  return { seatsByPartyAndState, warnings }
}

function countCoveredDirectSeats(
  stateSeats: ReadonlyMap<string, number> | undefined,
  directWinsByState: ReadonlyMap<string, number> | undefined,
): number {
  if (stateSeats === undefined || directWinsByState === undefined) {
    return 0
  }

  let directSeats = 0
  for (const [state, directWins] of directWinsByState) {
    directSeats += Math.min(directWins, stateSeats.get(state) ?? 0)
  }
  return directSeats
}

export const fixed630Calculator: ElectoralSystemCalculator = {
  systemId: 'de-2023-fixed-630',
  legalVersion: LEGAL_VERSION,
  calculate(input) {
    const eligibleParties = Object.keys(input.scenario.parties).filter((party) =>
      isScenarioPartyEligible(
        party,
        input.scenario,
        input.directWinsByParty[party] ?? 0,
        input.qualificationRules,
      ),
    )
    const eligiblePartySet = new Set(eligibleParties)
    const nationalAllocation = allocateSainteLague(
      eligibleParties.map((party) => ({
        key: party,
        votes: input.scenario.parties[party]?.secondVotes ?? 0,
      })),
      FIXED_630_PARLIAMENT_SEATS,
    )
    const seatsByParty = new Map(
      nationalAllocation.allocations.map((result) => [result.key, result.seats]),
    )
    const stateAllocation = allocatePartySeatsByState(
      input.scenario,
      seatsByParty,
    )
    const directWinsByPartyAndState = createDirectWinsByPartyAndState(
      input.districtWinners,
    )

    const parties: ElectoralSystemPartyResult[] = Object.keys(
      input.scenario.parties,
    ).map((party) => {
      const totalSeats = seatsByParty.get(party) ?? 0
      const directWins = input.directWinsByParty[party] ?? 0
      const directSeats = countCoveredDirectSeats(
        stateAllocation.seatsByPartyAndState.get(party),
        directWinsByPartyAndState.get(party),
      )
      return {
        party,
        secondVotes: input.scenario.parties[party]?.secondVotes ?? 0,
        eligibleForListSeats: eligiblePartySet.has(party),
        totalSeats,
        directWins,
        directSeats,
        listSeats: totalSeats - directSeats,
        uncoveredDistrictWins: directWins - directSeats,
      }
    })

    const warnings: ElectoralSystemWarning[] = [
      ...nationalAllocation.warnings,
      ...stateAllocation.warnings,
    ]
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
      legalVersion: LEGAL_VERSION,
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
