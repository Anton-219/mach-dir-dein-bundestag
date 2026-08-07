import {
  allocateSainteLague,
  allocateSainteLagueWithMinimums,
} from './allocate-sainte-lague.ts'
import { DEFAULT_PARTY_QUALIFICATION_RULES } from './constants.ts'
import {
  ElectoralSystemCalculationError,
  type DistrictWinner,
  type ElectoralScenario,
  type ElectoralSystemCalculationInput,
  type ElectoralSystemCalculator,
  type ElectoralSystemPartyResult,
  type ElectoralSystemWarning,
} from './electoral-system-types.ts'
import { isScenarioPartyEligible } from './qualify-parties.ts'

export const PRE_2023_BASE_SEAT_COUNT = 598
export const PRE_2023_UNCOMPENSATED_OVERHANG_LIMIT = 3

const LEGAL_VERSION = 'de-2021-bwahlg-2020-v1'
const SUPPORTED_CONTINGENT_YEARS = new Set<number>([2021, 2025])
const MAXIMUM_SEARCH_SEAT_COUNT = 10_000

interface PartyMinimum {
  preliminarySeats: number
  stateMinimumSeats: number
  requiredSeats: number
  hasThreatenedOverhang: boolean
}

interface PreliminaryAllocation {
  seatsByPartyAndState: ReadonlyMap<string, ReadonlyMap<string, number>>
  partyMinimums: ReadonlyMap<string, PartyMinimum>
  warnings: readonly ElectoralSystemWarning[]
}

interface UpperAllocation {
  proportionalSeatsByParty: ReadonlyMap<string, number>
  totalSeatsByParty: ReadonlyMap<string, number>
  proportionalSeatCount: number
  uncompensatedOverhangSeats: number
  warnings: readonly ElectoralSystemWarning[]
}

function compareStableKeys(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function invalidFixture(
  message: string,
  details?: Record<string, string | number | string[]>,
): never {
  throw new ElectoralSystemCalculationError(
    'INVALID_STATE_SEAT_CONTINGENT_FIXTURE',
    message,
    details,
  )
}

function validateStateSeatContingents(
  input: ElectoralSystemCalculationInput,
): Readonly<Record<string, number>> {
  const contingents = input.supportingData?.stateSeatContingents
  if (contingents === undefined) {
    throw new ElectoralSystemCalculationError(
      'MISSING_STATE_SEAT_CONTINGENT',
      'The pre-2023 calculator requires historical state seat contingents.',
    )
  }
  const contingentYear = input.supportingData?.stateSeatContingentYear
  if (
    contingentYear === undefined ||
    !SUPPORTED_CONTINGENT_YEARS.has(contingentYear)
  ) {
    invalidFixture(
      'The state seat contingent fixture has an unsupported election year.',
      {
        supportedYears: [...SUPPORTED_CONTINGENT_YEARS].join(', '),
        actualYear: contingentYear ?? 'missing',
      },
    )
  }

  const scenarioStates = [...input.scenario.states]
    .map((state) => state.state)
    .sort(compareStableKeys)
  const contingentStates = Object.keys(contingents).sort(compareStableKeys)
  if (
    scenarioStates.length !== contingentStates.length ||
    scenarioStates.some((state, index) => state !== contingentStates[index])
  ) {
    invalidFixture(
      'The state seat contingent fixture does not match the scenario states.',
      { scenarioStates, contingentStates },
    )
  }

  let totalSeats = 0
  for (const state of scenarioStates) {
    const seats = contingents[state]
    if (!Number.isInteger(seats) || (seats ?? -1) < 0) {
      invalidFixture(`The seat contingent for ${state} is invalid.`, { state })
    }
    totalSeats += seats ?? 0
  }
  if (totalSeats !== PRE_2023_BASE_SEAT_COUNT) {
    invalidFixture('The historical state seat contingents do not add up to 598.', {
      expectedSeats: PRE_2023_BASE_SEAT_COUNT,
      actualSeats: totalSeats,
    })
  }

  return contingents
}

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

function getPartyStateCount(
  counts: ReadonlyMap<string, ReadonlyMap<string, number>>,
  party: string,
  state: string,
): number {
  return counts.get(party)?.get(state) ?? 0
}

function createPreliminaryAllocation(
  scenario: ElectoralScenario,
  eligibleParties: readonly string[],
  eligiblePartySet: ReadonlySet<string>,
  directWinsByPartyAndState: ReadonlyMap<string, ReadonlyMap<string, number>>,
  stateSeatContingents: Readonly<Record<string, number>>,
): PreliminaryAllocation {
  const seatsByPartyAndState = new Map<string, Map<string, number>>(
    eligibleParties.map((party) => [party, new Map<string, number>()]),
  )
  const warnings: ElectoralSystemWarning[] = []

  for (const state of scenario.states) {
    const reservedDirectSeats = [...directWinsByPartyAndState].reduce(
      (total, [party, winsByState]) =>
        eligiblePartySet.has(party)
          ? total
          : total + (winsByState.get(state.state) ?? 0),
      0,
    )
    const effectiveContingent =
      (stateSeatContingents[state.state] ?? 0) - reservedDirectSeats
    if (effectiveContingent < 0) {
      invalidFixture(
        `Reserved direct seats exceed the state contingent for ${state.state}.`,
        {
          state: state.state,
          stateSeatContingent: stateSeatContingents[state.state] ?? 0,
          reservedDirectSeats,
        },
      )
    }

    if (!state.isActive || effectiveContingent === 0) {
      continue
    }
    const allocationInputs = eligibleParties.map((party) => ({
      key: party,
      votes: state.secondVotesByParty[party] ?? 0,
    }))
    const allocatableVotes = allocationInputs.reduce(
      (total, party) => total + party.votes,
      0,
    )
    if (allocatableVotes <= 0) {
      throw new ElectoralSystemCalculationError(
        'NO_VALID_SECOND_VOTES',
        `Active state ${state.state} has no second votes for parties eligible for list allocation.`,
        {
          state: state.state,
          effectiveContingent,
        },
      )
    }

    const allocation = allocateSainteLague(
      allocationInputs,
      effectiveContingent,
    )
    for (const partyAllocation of allocation.allocations) {
      seatsByPartyAndState
        .get(partyAllocation.key)
        ?.set(state.state, partyAllocation.seats)
    }
    warnings.push(
      ...allocation.warnings.map((warning) => ({
        ...warning,
        details: { ...warning.details, state: state.state },
      })),
    )
  }

  const partyMinimums = new Map<string, PartyMinimum>()
  for (const party of eligibleParties) {
    let preliminarySeats = 0
    let stateMinimumSeats = 0
    for (const state of scenario.states) {
      const preliminary = seatsByPartyAndState.get(party)?.get(state.state) ?? 0
      const directWins = getPartyStateCount(
        directWinsByPartyAndState,
        party,
        state.state,
      )
      const stateMinimum = Math.max(
        directWins,
        Math.floor((directWins + preliminary) / 2 + 0.5),
      )
      preliminarySeats += preliminary
      stateMinimumSeats += stateMinimum
    }
    partyMinimums.set(party, {
      preliminarySeats,
      stateMinimumSeats,
      requiredSeats: Math.max(preliminarySeats, stateMinimumSeats),
      hasThreatenedOverhang: stateMinimumSeats > preliminarySeats,
    })
  }

  return { seatsByPartyAndState, partyMinimums, warnings }
}

function createUpperAllocation(
  scenario: ElectoralScenario,
  eligibleParties: readonly string[],
  partyMinimums: ReadonlyMap<string, PartyMinimum>,
  reservedDirectSeatCount: number,
): UpperAllocation {
  const allocationInputs = eligibleParties.map((party) => ({
    key: party,
    votes: scenario.parties[party]?.secondVotes ?? 0,
  }))
  const initialProportionalSeatCount =
    PRE_2023_BASE_SEAT_COUNT - reservedDirectSeatCount
  if (initialProportionalSeatCount < 0) {
    invalidFixture('Reserved direct seats exceed the nominal Bundestag size.', {
      reservedDirectSeats: reservedDirectSeatCount,
    })
  }

  for (
    let proportionalSeatCount = initialProportionalSeatCount;
    proportionalSeatCount <= MAXIMUM_SEARCH_SEAT_COUNT;
    proportionalSeatCount += 1
  ) {
    const allocation = allocateSainteLague(
      allocationInputs,
      proportionalSeatCount,
    )
    const proportionalSeatsByParty = new Map(
      allocation.allocations.map((party) => [party.key, party.seats]),
    )
    let uncompensatedOverhangSeats = 0
    let unmetRegularMinimumSeats = 0

    for (const party of eligibleParties) {
      const minimum = partyMinimums.get(party)
      const proportionalSeats = proportionalSeatsByParty.get(party) ?? 0
      const shortfall = Math.max(
        0,
        (minimum?.requiredSeats ?? 0) - proportionalSeats,
      )
      if (minimum?.hasThreatenedOverhang) {
        uncompensatedOverhangSeats += shortfall
      } else {
        unmetRegularMinimumSeats += shortfall
      }
    }

    if (
      unmetRegularMinimumSeats === 0 &&
      uncompensatedOverhangSeats <= PRE_2023_UNCOMPENSATED_OVERHANG_LIMIT
    ) {
      const totalSeatsByParty = new Map<string, number>()
      for (const party of eligibleParties) {
        const proportionalSeats = proportionalSeatsByParty.get(party) ?? 0
        const minimum = partyMinimums.get(party)
        const overhangSeats = minimum?.hasThreatenedOverhang
          ? Math.max(0, minimum.requiredSeats - proportionalSeats)
          : 0
        totalSeatsByParty.set(party, proportionalSeats + overhangSeats)
      }
      return {
        proportionalSeatsByParty,
        totalSeatsByParty,
        proportionalSeatCount,
        uncompensatedOverhangSeats,
        warnings: allocation.warnings,
      }
    }
  }

  throw new ElectoralSystemCalculationError(
    'UNSATISFIABLE_SEAT_MINIMUM',
    'The historical party minimums could not be satisfied by the upper allocation.',
  )
}

function allocateFinalPartySeatsByState(
  scenario: ElectoralScenario,
  eligibleParties: readonly string[],
  totalSeatsByParty: ReadonlyMap<string, number>,
  preliminarySeatsByPartyAndState: ReadonlyMap<
    string,
    ReadonlyMap<string, number>
  >,
  directWinsByPartyAndState: ReadonlyMap<string, ReadonlyMap<string, number>>,
): readonly ElectoralSystemWarning[] {
  const activeStates = scenario.states.filter((state) => state.isActive)
  const warnings: ElectoralSystemWarning[] = []

  for (const party of eligibleParties) {
    const minimumSeatsByState: Record<string, number> = {}
    for (const state of activeStates) {
      const directWins = getPartyStateCount(
        directWinsByPartyAndState,
        party,
        state.state,
      )
      const preliminarySeats =
        preliminarySeatsByPartyAndState.get(party)?.get(state.state) ?? 0
      minimumSeatsByState[state.state] = Math.max(
        directWins,
        Math.floor((directWins + preliminarySeats) / 2 + 0.5),
      )
    }

    const allocation = allocateSainteLagueWithMinimums(
      activeStates.map((state) => ({
        key: state.state,
        votes: state.secondVotesByParty[party] ?? 0,
      })),
      totalSeatsByParty.get(party) ?? 0,
      minimumSeatsByState,
    )
    warnings.push(
      ...allocation.warnings.map((warning) => ({
        ...warning,
        details: { ...warning.details, party },
      })),
    )
  }

  return warnings
}

export const pre2023Calculator: ElectoralSystemCalculator = {
  systemId: 'de-2021-bwahlg',
  legalVersion: LEGAL_VERSION,
  calculate(input) {
    const stateSeatContingents = validateStateSeatContingents(input)
    const directWinsByPartyAndState = createDirectWinsByPartyAndState(
      input.districtWinners,
    )
    const allParties = Object.keys(input.scenario.parties)
    const eligibleParties = allParties.filter((party) =>
      isScenarioPartyEligible(
        party,
        input.scenario,
        input.directWinsByParty[party] ?? 0,
        DEFAULT_PARTY_QUALIFICATION_RULES,
      ),
    )
    const eligiblePartySet = new Set(eligibleParties)
    const reservedDirectSeatCount = allParties.reduce(
      (total, party) =>
        eligiblePartySet.has(party)
          ? total
          : total + (input.directWinsByParty[party] ?? 0),
      0,
    )

    const preliminary = createPreliminaryAllocation(
      input.scenario,
      eligibleParties,
      eligiblePartySet,
      directWinsByPartyAndState,
      stateSeatContingents,
    )
    const upper = createUpperAllocation(
      input.scenario,
      eligibleParties,
      preliminary.partyMinimums,
      reservedDirectSeatCount,
    )
    const finalStateWarnings = allocateFinalPartySeatsByState(
      input.scenario,
      eligibleParties,
      upper.totalSeatsByParty,
      preliminary.seatsByPartyAndState,
      directWinsByPartyAndState,
    )

    const parties: ElectoralSystemPartyResult[] = allParties.map((party) => {
      const directWins = input.directWinsByParty[party] ?? 0
      const eligibleForListSeats = eligiblePartySet.has(party)
      const totalSeats = eligibleForListSeats
        ? (upper.totalSeatsByParty.get(party) ?? 0)
        : directWins
      return {
        party,
        secondVotes: input.scenario.parties[party]?.secondVotes ?? 0,
        eligibleForListSeats,
        totalSeats,
        directWins,
        directSeats: directWins,
        listSeats: totalSeats - directWins,
        uncoveredDistrictWins: 0,
      }
    })

    const inactiveStates = input.scenario.states
      .filter((state) => !state.isActive)
      .map((state) => state.state)
    const warnings: ElectoralSystemWarning[] = [
      ...preliminary.warnings,
      ...upper.warnings,
      ...finalStateWarnings,
    ]
    if (input.scenario.mode === 'filtered-model') {
      warnings.push({ code: 'FILTERED_FIRST_VOTE_MODEL' })
    }
    if (inactiveStates.length > 0) {
      warnings.push({
        code: 'INACTIVE_STATE_SIMULATION',
        details: { states: inactiveStates },
      })
    }

    const totalSeats = parties.reduce(
      (total, party) => total + party.totalSeats,
      0,
    )
    const contingentYear = input.supportingData?.stateSeatContingentYear
    return {
      systemId: 'de-2021-bwahlg',
      legalVersion: LEGAL_VERSION,
      scenarioMode: input.scenario.mode,
      totalSeats,
      majorityThreshold: Math.floor(totalSeats / 2) + 1,
      parties,
      warnings,
      metadata: {
        institutionalSeatCapacity: PRE_2023_BASE_SEAT_COUNT,
        allocatedDirectSeatCount: input.districtWinners.length,
        emptyDistrictCount:
          input.scenario.districts.length - input.districtWinners.length,
        reservedDirectSeats: reservedDirectSeatCount,
        uncompensatedOverhangSeats: upper.uncompensatedOverhangSeats,
        inactiveStates,
        stateSeatContingentYear: contingentYear,
        referenceScenario:
          input.scenario.mode === 'unfiltered-reference'
            ? contingentYear === 2025
              ? 'btw-2025-main-election'
              : 'btw-2021-main-election'
            : undefined,
      },
    }
  },
}
