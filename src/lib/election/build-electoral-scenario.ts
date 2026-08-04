import type { Party, VoteEntry } from '../../models/json-contracts.ts'
import {
  ElectoralSystemCalculationError,
  type ElectoralScenario,
  type ElectoralScenarioMode,
} from './electoral-system-types.ts'

export interface ElectoralScenarioReference {
  states: readonly string[]
  districts: readonly {
    districtId: number
    state: string
  }[]
  parties: readonly string[]
}

export interface CreateElectoralScenarioReferenceInput {
  firstVotes: readonly VoteEntry[]
  secondVotes: readonly VoteEntry[]
  parties?: readonly Party[]
}

export interface BuildElectoralScenarioInput {
  mode: ElectoralScenarioMode
  firstVotes: readonly VoteEntry[]
  secondVotes: readonly VoteEntry[]
  reference: ElectoralScenarioReference
  inactiveStates?: readonly string[]
  nationalMinorityParties?: readonly string[]
}

function compareStableKeys(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function addVote(
  totals: Map<string, number>,
  party: string,
  votes: number,
): void {
  totals.set(party, (totals.get(party) ?? 0) + votes)
}

function toSortedRecord(totals: ReadonlyMap<string, number>): Record<string, number> {
  return Object.fromEntries(
    [...totals].sort(([left], [right]) => compareStableKeys(left, right)),
  )
}

function validateEntries(entries: readonly VoteEntry[], voteType: '1' | '2'): void {
  for (const entry of entries) {
    if (entry.voteType !== voteType) {
      throw new RangeError(
        `Expected vote type ${voteType}, received ${entry.voteType} in district ${entry.districtId}.`,
      )
    }
    if (!Number.isInteger(entry.districtId) || entry.districtId <= 0) {
      throw new RangeError('District IDs must be positive integers.')
    }
    if (!entry.state || !entry.party) {
      throw new RangeError('State and party identifiers must not be empty.')
    }
    if (!Number.isFinite(entry.votes) || entry.votes < 0) {
      throw new RangeError(
        `Votes for ${entry.party} in district ${entry.districtId} must be finite and non-negative.`,
      )
    }
  }
}

function approximatelyEqual(left: number, right: number): boolean {
  const scale = Math.max(1, Math.abs(left), Math.abs(right))
  return Math.abs(left - right) <= Number.EPSILON * scale * 16
}

export function createElectoralScenarioReference(
  input: CreateElectoralScenarioReferenceInput,
): ElectoralScenarioReference {
  validateEntries(input.firstVotes, '1')
  validateEntries(input.secondVotes, '2')

  const states = new Set<string>()
  const districtStates = new Map<number, string>()
  const parties = new Set(input.parties?.map((party) => party.abbreviation) ?? [])

  const addReferenceEntry = (entry: VoteEntry) => {
    states.add(entry.state)
    parties.add(entry.party)
    const existingState = districtStates.get(entry.districtId)
    if (existingState !== undefined && existingState !== entry.state) {
      throw new RangeError(
        `District ${entry.districtId} belongs to both ${existingState} and ${entry.state}.`,
      )
    }
    districtStates.set(entry.districtId, entry.state)
  }

  for (const entry of input.firstVotes) {
    addReferenceEntry(entry)
  }
  for (const entry of input.secondVotes) {
    addReferenceEntry(entry)
  }

  return {
    states: [...states].sort(compareStableKeys),
    districts: [...districtStates]
      .sort(([left], [right]) => left - right)
      .map(([districtId, state]) => ({ districtId, state })),
    parties: [...parties].sort(compareStableKeys),
  }
}

export function validateElectoralScenario(scenario: ElectoralScenario): void {
  if (!Number.isFinite(scenario.validSecondVotes) || scenario.validSecondVotes < 0) {
    throw new RangeError(
      'The nationwide valid-second-vote total must be finite and non-negative.',
    )
  }

  const stateNames = new Set<string>()
  let stateSecondVotes = 0
  for (const state of scenario.states) {
    if (stateNames.has(state.state)) {
      throw new RangeError(`State ${state.state} occurs more than once.`)
    }
    stateNames.add(state.state)

    for (const value of [state.validFirstVotes, state.validSecondVotes]) {
      if (!Number.isFinite(value) || value < 0) {
        throw new RangeError(
          `Vote totals for ${state.state} must be finite and non-negative.`,
        )
      }
    }

    if (!state.isActive && (state.validFirstVotes > 0 || state.validSecondVotes > 0)) {
      throw new ElectoralSystemCalculationError(
        'INCONSISTENT_STATE_ACTIVITY',
        `Inactive state ${state.state} contains modeled votes.`,
        { states: [state.state] },
      )
    }

    if (
      state.isActive &&
      (state.validFirstVotes > 0) !== (state.validSecondVotes > 0)
    ) {
      throw new ElectoralSystemCalculationError(
        'INCONSISTENT_STATE_ACTIVITY',
        `State ${state.state} contains only one modeled vote type.`,
        { states: [state.state] },
      )
    }

    stateSecondVotes += state.validSecondVotes
  }

  const districtIds = new Set<number>()
  const firstVotesByState = new Map<string, number>()
  for (const district of scenario.districts) {
    if (districtIds.has(district.districtId)) {
      throw new RangeError(`District ${district.districtId} occurs more than once.`)
    }
    districtIds.add(district.districtId)
    if (!stateNames.has(district.state)) {
      throw new RangeError(
        `District ${district.districtId} references unknown state ${district.state}.`,
      )
    }
    if (!Number.isFinite(district.validFirstVotes) || district.validFirstVotes < 0) {
      throw new RangeError(
        `First-vote total for district ${district.districtId} must be finite and non-negative.`,
      )
    }
    firstVotesByState.set(
      district.state,
      (firstVotesByState.get(district.state) ?? 0) + district.validFirstVotes,
    )
  }

  for (const state of scenario.states) {
    if (
      !approximatelyEqual(
        state.validFirstVotes,
        firstVotesByState.get(state.state) ?? 0,
      )
    ) {
      throw new RangeError(
        `State first-vote total does not match its districts for ${state.state}.`,
      )
    }
  }

  const partySecondVotes = Object.values(scenario.parties).reduce(
    (total, party) => total + party.secondVotes,
    0,
  )
  if (
    !approximatelyEqual(scenario.validSecondVotes, stateSecondVotes) ||
    !approximatelyEqual(scenario.validSecondVotes, partySecondVotes)
  ) {
    throw new RangeError(
      'Nationwide, state, and party second-vote totals must match.',
    )
  }
}

export function buildElectoralScenario(
  input: BuildElectoralScenarioInput,
): ElectoralScenario {
  validateEntries(input.firstVotes, '1')
  validateEntries(input.secondVotes, '2')

  const knownStates = new Set(input.reference.states)
  const knownDistricts = new Map(
    input.reference.districts.map((district) => [district.districtId, district.state]),
  )
  const inactiveStates = new Set(input.inactiveStates ?? [])
  const unknownInactiveStates = [...inactiveStates].filter(
    (state) => !knownStates.has(state),
  )
  if (unknownInactiveStates.length > 0) {
    throw new RangeError(
      `Inactive states are not part of the reference geography: ${unknownInactiveStates.join(', ')}.`,
    )
  }

  const stateFirstVotes = new Map<string, number>()
  const stateSecondVotes = new Map<string, number>()
  const stateSecondVotesByParty = new Map<string, Map<string, number>>()
  const districtFirstVotesByParty = new Map<number, Map<string, number>>()
  const partySecondVotes = new Map<string, number>()
  const partySlugs = new Set(input.reference.parties)

  for (const entry of input.firstVotes) {
    if (knownDistricts.get(entry.districtId) !== entry.state) {
      throw new RangeError(
        `District ${entry.districtId} does not belong to ${entry.state} in the reference geography.`,
      )
    }
    partySlugs.add(entry.party)
    if (inactiveStates.has(entry.state) && entry.votes > 0) {
      throw new ElectoralSystemCalculationError(
        'INCONSISTENT_STATE_ACTIVITY',
        `Inactive state ${entry.state} contains first votes.`,
        { states: [entry.state] },
      )
    }
    stateFirstVotes.set(
      entry.state,
      (stateFirstVotes.get(entry.state) ?? 0) + entry.votes,
    )
    const districtTotals =
      districtFirstVotesByParty.get(entry.districtId) ?? new Map<string, number>()
    addVote(districtTotals, entry.party, entry.votes)
    districtFirstVotesByParty.set(entry.districtId, districtTotals)
  }

  for (const entry of input.secondVotes) {
    if (knownDistricts.get(entry.districtId) !== entry.state) {
      throw new RangeError(
        `District ${entry.districtId} does not belong to ${entry.state} in the reference geography.`,
      )
    }
    partySlugs.add(entry.party)
    if (inactiveStates.has(entry.state) && entry.votes > 0) {
      throw new ElectoralSystemCalculationError(
        'INCONSISTENT_STATE_ACTIVITY',
        `Inactive state ${entry.state} contains second votes.`,
        { states: [entry.state] },
      )
    }
    stateSecondVotes.set(
      entry.state,
      (stateSecondVotes.get(entry.state) ?? 0) + entry.votes,
    )
    const stateTotals =
      stateSecondVotesByParty.get(entry.state) ?? new Map<string, number>()
    addVote(stateTotals, entry.party, entry.votes)
    stateSecondVotesByParty.set(entry.state, stateTotals)
    addVote(partySecondVotes, entry.party, entry.votes)
  }

  const minorityParties = new Set(input.nationalMinorityParties ?? ['SSW'])
  const parties = Object.fromEntries(
    [...partySlugs].sort(compareStableKeys).map((party) => [
      party,
      {
        secondVotes: partySecondVotes.get(party) ?? 0,
        isNationalMinorityParty: minorityParties.has(party),
      },
    ]),
  )

  const normalizedStates = input.reference.states.map((state) => ({
    state,
    isActive: !inactiveStates.has(state),
    validFirstVotes: stateFirstVotes.get(state) ?? 0,
    validSecondVotes: stateSecondVotes.get(state) ?? 0,
    secondVotesByParty: toSortedRecord(
      stateSecondVotesByParty.get(state) ?? new Map<string, number>(),
    ),
  }))

  const normalizedDistricts = input.reference.districts.map(
    ({ districtId, state }) => {
      const firstVotesByParty =
        districtFirstVotesByParty.get(districtId) ?? new Map<string, number>()
      return {
        districtId,
        state,
        validFirstVotes: [...firstVotesByParty.values()].reduce(
          (total, votes) => total + votes,
          0,
        ),
        firstVotesByParty: toSortedRecord(firstVotesByParty),
      }
    },
  )

  const scenario: ElectoralScenario = {
    mode: input.mode,
    validSecondVotes: [...partySecondVotes.values()].reduce(
      (total, votes) => total + votes,
      0,
    ),
    parties,
    states: normalizedStates,
    districts: normalizedDistricts,
  }

  validateElectoralScenario(scenario)
  return scenario
}
