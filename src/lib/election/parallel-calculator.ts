import { allocateSainteLague } from './allocate-sainte-lague.ts'
import {
  ElectoralSystemCalculationError,
  type ElectoralScenario,
  type ElectoralSystemCalculationInput,
  type ElectoralSystemCalculator,
  type ElectoralSystemPartyResult,
  type ElectoralSystemWarning,
} from './electoral-system-types.ts'
import { isScenarioPartyEligible } from './qualify-parties.ts'

const LEGAL_VERSION = 'union-parallel-299-299-v1'

export const UNION_PARALLEL_CONFIG = {
  maximumDirectSeatCount: 299,
  fixedListSeatCount: 299,
} as const

function throwInconsistentDirectTier(
  message: string,
  details?: Readonly<Record<string, string | number | string[]>>,
): never {
  throw new ElectoralSystemCalculationError(
    'INCONSISTENT_DIRECT_TIER_SIZE',
    message,
    details,
  )
}

function validateDirectTier(input: ElectoralSystemCalculationInput): void {
  if (
    input.scenario.districts.length !==
    UNION_PARALLEL_CONFIG.maximumDirectSeatCount
  ) {
    throwInconsistentDirectTier(
      'The parallel direct tier must retain all configured districts.',
      {
        expectedDistrictCount: UNION_PARALLEL_CONFIG.maximumDirectSeatCount,
        actualDistrictCount: input.scenario.districts.length,
      },
    )
  }

  if (
    input.districtWinners.length >
    UNION_PARALLEL_CONFIG.maximumDirectSeatCount
  ) {
    throwInconsistentDirectTier(
      'The parallel direct tier contains more winners than configured seats.',
      {
        maximumDirectSeatCount:
          UNION_PARALLEL_CONFIG.maximumDirectSeatCount,
        actualWinnerCount: input.districtWinners.length,
      },
    )
  }

  const scenarioDistricts = new Map(
    input.scenario.districts.map((district) => [district.districtId, district]),
  )
  const winnerDistrictIds = new Set<number>()
  const winsFromWinners = new Map<string, number>()
  for (const winner of input.districtWinners) {
    const district = scenarioDistricts.get(winner.districtId)
    if (
      district === undefined ||
      district.validFirstVotes <= 0 ||
      winnerDistrictIds.has(winner.districtId)
    ) {
      throwInconsistentDirectTier(
        'The parallel direct tier contains an invalid district winner.',
        { districtId: winner.districtId },
      )
    }
    winnerDistrictIds.add(winner.districtId)
    winsFromWinners.set(
      winner.party,
      (winsFromWinners.get(winner.party) ?? 0) + 1,
    )
  }

  const parties = new Set([
    ...winsFromWinners.keys(),
    ...Object.keys(input.directWinsByParty),
  ])
  for (const party of parties) {
    const reportedWins = input.directWinsByParty[party] ?? 0
    const resolvedWins = winsFromWinners.get(party) ?? 0
    if (
      !Number.isInteger(reportedWins) ||
      reportedWins < 0 ||
      reportedWins !== resolvedWins
    ) {
      throwInconsistentDirectTier(
        'The parallel direct-win totals do not match the resolved winners.',
        {
          party,
          expectedDirectWins: resolvedWins,
          actualDirectWins: reportedWins,
        },
      )
    }
  }
}

function validateListAllocationByState(
  scenario: ElectoralScenario,
  listSeatsByParty: ReadonlyMap<string, number>,
): readonly ElectoralSystemWarning[] {
  const activeStates = scenario.states.filter((state) => state.isActive)
  const warnings: ElectoralSystemWarning[] = []

  for (const [party, seatCount] of listSeatsByParty) {
    if (seatCount === 0) {
      continue
    }

    const allocation = allocateSainteLague(
      activeStates.map((state) => ({
        key: state.state,
        votes: state.secondVotesByParty[party] ?? 0,
      })),
      seatCount,
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

  return warnings
}

export const parallelCalculator: ElectoralSystemCalculator = {
  systemId: 'union-parallel',
  legalVersion: LEGAL_VERSION,
  calculate(input) {
    validateDirectTier(input)

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
      UNION_PARALLEL_CONFIG.fixedListSeatCount,
    )
    const listSeatsByParty = new Map(
      nationalAllocation.allocations.map((allocation) => [
        allocation.key,
        allocation.seats,
      ]),
    )
    const stateAllocationWarnings = validateListAllocationByState(
      input.scenario,
      listSeatsByParty,
    )

    const parties: ElectoralSystemPartyResult[] = Object.keys(
      input.scenario.parties,
    ).map((party) => {
      const directWins = input.directWinsByParty[party] ?? 0
      const listSeats = listSeatsByParty.get(party) ?? 0
      return {
        party,
        secondVotes: input.scenario.parties[party]?.secondVotes ?? 0,
        eligibleForListSeats: eligiblePartySet.has(party),
        totalSeats: directWins + listSeats,
        directWins,
        directSeats: directWins,
        listSeats,
        uncoveredDistrictWins: 0,
      }
    })

    const warnings: ElectoralSystemWarning[] = [
      ...nationalAllocation.warnings,
      ...stateAllocationWarnings,
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

    const allocatedDirectSeatCount = input.districtWinners.length
    const totalSeats =
      allocatedDirectSeatCount + UNION_PARALLEL_CONFIG.fixedListSeatCount

    return {
      systemId: 'union-parallel',
      legalVersion: LEGAL_VERSION,
      scenarioMode: input.scenario.mode,
      totalSeats,
      majorityThreshold: Math.floor(totalSeats / 2) + 1,
      parties,
      warnings,
      metadata: {
        institutionalSeatCapacity:
          UNION_PARALLEL_CONFIG.maximumDirectSeatCount +
          UNION_PARALLEL_CONFIG.fixedListSeatCount,
        allocatedDirectSeatCount,
        emptyDistrictCount:
          UNION_PARALLEL_CONFIG.maximumDirectSeatCount -
          allocatedDirectSeatCount,
        fixedListSeatCount: UNION_PARALLEL_CONFIG.fixedListSeatCount,
        maximumDirectSeatCount:
          UNION_PARALLEL_CONFIG.maximumDirectSeatCount,
        unallocatedDirectSeatCount:
          UNION_PARALLEL_CONFIG.maximumDirectSeatCount -
          allocatedDirectSeatCount,
        reservedDirectSeats: 0,
        uncompensatedOverhangSeats: 0,
        inactiveStates,
      },
    }
  },
}
