import assert from 'node:assert/strict'
import test from 'node:test'

import { allocateSainteLague } from '../../src/lib/election/allocate-sainte-lague.ts'
import {
  buildElectoralScenario,
  createElectoralScenarioReference,
} from '../../src/lib/election/build-electoral-scenario.ts'
import {
  calculateElectoralSystem,
  calculateElectoralSystemWithQualificationRules,
  ElectoralSystemRegistry,
  ElectoralSystemRegistryError,
  normalizeElectoralSystemResult,
} from '../../src/lib/election/electoral-system-engine.ts'
import {
  ElectoralSystemCalculationError,
  type ElectoralScenario,
  type ElectoralSystemResult,
} from '../../src/lib/election/electoral-system-types.ts'
import { resolveDistrictWinners } from '../../src/lib/election/resolve-district-winners.ts'
import type { VoteEntry } from '../../src/models/json-contracts.ts'

function vote(
  voteType: '1' | '2',
  districtId: number,
  state: string,
  party: string,
  votes: number,
): VoteEntry {
  return {
    voteType,
    districtId,
    state,
    party,
    votes,
    gender: 'm',
    ageGroup: '18-24',
    electionMethod: 'in-person',
  }
}

test('normalizes one filtered scenario while retaining inactive states and empty districts', () => {
  const referenceFirstVotes = [
    vote('1', 1, 'Alpha', 'A', 10),
    vote('1', 2, 'Beta', 'B', 10),
  ]
  const referenceSecondVotes = [
    vote('2', 1, 'Alpha', 'A', 10),
    vote('2', 2, 'Beta', 'B', 10),
  ]
  const reference = createElectoralScenarioReference({
    firstVotes: referenceFirstVotes,
    secondVotes: referenceSecondVotes,
  })
  const scenario = buildElectoralScenario({
    mode: 'filtered-model',
    firstVotes: [vote('1', 1, 'Alpha', 'A', 10)],
    secondVotes: [vote('2', 1, 'Alpha', 'A', 10)],
    reference,
    inactiveStates: ['Beta'],
  })

  assert.equal(scenario.states.length, 2)
  assert.equal(
    scenario.states.find((state) => state.state === 'Beta')?.isActive,
    false,
  )
  assert.deepEqual(
    scenario.districts.find((district) => district.districtId === 2),
    {
      districtId: 2,
      state: 'Beta',
      validFirstVotes: 0,
      firstVotesByParty: {},
    },
  )
})

test('rejects a state that contains only one modeled vote type', () => {
  const reference = createElectoralScenarioReference({
    firstVotes: [vote('1', 1, 'Alpha', 'A', 10)],
    secondVotes: [vote('2', 1, 'Alpha', 'A', 10)],
  })

  assert.throws(
    () =>
      buildElectoralScenario({
        mode: 'filtered-model',
        firstVotes: [vote('1', 1, 'Alpha', 'A', 10)],
        secondVotes: [],
        reference,
      }),
    (error: unknown) =>
      error instanceof ElectoralSystemCalculationError &&
      error.code === 'INCONSISTENT_STATE_ACTIVITY',
  )
})

test('resolves positive district ties by stable party slug and leaves zero-vote districts empty', () => {
  const scenario: ElectoralScenario = {
    mode: 'filtered-model',
    validSecondVotes: 100,
    parties: {
      A: { secondVotes: 50, isNationalMinorityParty: false },
      B: { secondVotes: 50, isNationalMinorityParty: false },
    },
    states: [
      {
        state: 'Alpha',
        isActive: true,
        validFirstVotes: 100,
        validSecondVotes: 100,
        secondVotesByParty: { A: 50, B: 50 },
      },
    ],
    districts: [
      {
        districtId: 1,
        state: 'Alpha',
        validFirstVotes: 100,
        firstVotesByParty: { B: 50, A: 50 },
      },
      {
        districtId: 2,
        state: 'Alpha',
        validFirstVotes: 0,
        firstVotesByParty: {},
      },
    ],
  }

  const resolution = resolveDistrictWinners(scenario)
  assert.equal(resolution.winners[0]?.party, 'A')
  assert.equal(resolution.allocatedDistrictCount, 1)
  assert.equal(resolution.emptyDistrictCount, 1)
  assert.equal(
    resolution.warnings[0]?.code,
    'DISTRICT_TIE_REPLACED_BY_STABLE_ORDER',
  )
})

test('allocates arbitrary fixed seat pools and reports deterministic quotient ties', () => {
  const result = allocateSainteLague(
    [
      { key: 'B', votes: 100 },
      { key: 'A', votes: 100 },
    ],
    1,
  )

  assert.deepEqual(result.allocations, [
    { key: 'A', seats: 1 },
    { key: 'B', seats: 0 },
  ])
  assert.equal(
    result.warnings[0]?.code,
    'LEGAL_LOT_REPLACED_BY_STABLE_ORDER',
  )
})

test('reproduces the documented 630-seat 2021 aggregate reference', () => {
  const secondVotes = {
    CDU: 8_774_920,
    SPD: 11_901_558,
    AfD: 4_809_233,
    FDP: 5_291_013,
    'DIE LINKE': 2_255_864,
    GRÜNE: 6_814_408,
    CSU: 2_402_827,
    SSW: 55_578,
    Sonstige: 3_992_986,
  }
  const parties = Object.fromEntries(
    Object.entries(secondVotes).map(([party, votes]) => [
      party,
      { secondVotes: votes, isNationalMinorityParty: party === 'SSW' },
    ]),
  )
  const directWins = {
    SPD: 121,
    CDU: 98,
    GRÜNE: 16,
    AfD: 16,
    CSU: 45,
    'DIE LINKE': 3,
  }
  let districtId = 0
  const districts = Object.entries(directWins).flatMap(([party, count]) =>
    Array.from({ length: count }, () => ({
      districtId: (districtId += 1),
      state: 'Germany',
      validFirstVotes: 1,
      firstVotesByParty: { [party]: 1 },
    })),
  )
  const validSecondVotes = Object.values(secondVotes).reduce(
    (total, votes) => total + votes,
    0,
  )
  const scenario: ElectoralScenario = {
    mode: 'unfiltered-reference',
    validSecondVotes,
    parties,
    states: [
      {
        state: 'Germany',
        isActive: true,
        validFirstVotes: 299,
        validSecondVotes,
        secondVotesByParty: secondVotes,
      },
    ],
    districts,
  }

  const result = calculateElectoralSystem('de-2023-fixed-630', scenario)

  assert.equal(result.totalSeats, 630)
  assert.equal(result.majorityThreshold, 316)
  assert.deepEqual(
    Object.fromEntries(
      result.parties
        .filter((party) => party.totalSeats > 0)
        .map((party) => [party.party, party.totalSeats]),
    ),
    {
      SPD: 177,
      CDU: 130,
      GRÜNE: 101,
      FDP: 79,
      AfD: 72,
      CSU: 36,
      'DIE LINKE': 34,
      SSW: 1,
    },
  )
})

test('applies a configurable second-vote threshold to the seat allocation', () => {
  const scenario: ElectoralScenario = {
    mode: 'unfiltered-reference',
    validSecondVotes: 100,
    parties: {
      A: { secondVotes: 94, isNationalMinorityParty: false },
      B: { secondVotes: 6, isNationalMinorityParty: false },
    },
    states: [
      {
        state: 'Alpha',
        isActive: true,
        validFirstVotes: 2,
        validSecondVotes: 100,
        secondVotesByParty: { A: 94, B: 6 },
      },
    ],
    districts: [
      {
        districtId: 1,
        state: 'Alpha',
        validFirstVotes: 1,
        firstVotesByParty: { A: 1 },
      },
      {
        districtId: 2,
        state: 'Alpha',
        validFirstVotes: 1,
        firstVotesByParty: { A: 1 },
      },
    ],
  }

  const defaultResult = calculateElectoralSystem(
    'de-2023-fixed-630',
    scenario,
  )
  const raisedThresholdResult = calculateElectoralSystemWithQualificationRules(
    'de-2023-fixed-630',
    scenario,
    {
      voteShareThreshold: 0.07,
      minimumDirectMandates: 3,
      thresholdExemptParties: [],
      excludedParties: [],
    },
  )

  assert.equal(
    defaultResult.parties.find((party) => party.party === 'B')
      ?.eligibleForListSeats,
    true,
  )
  assert.equal(
    raisedThresholdResult.parties.find((party) => party.party === 'B')
      ?.eligibleForListSeats,
    false,
  )
  assert.equal(
    raisedThresholdResult.parties.find((party) => party.party === 'B')?.totalSeats,
    0,
  )
  assert.equal(
    raisedThresholdResult.parties.find((party) => party.party === 'A')?.totalSeats,
    630,
  )
})

test('distinguishes invalid and currently unregistered electoral-system identifiers', () => {
  const registry = new ElectoralSystemRegistry([])

  assert.throws(
    () => registry.get('not-a-system'),
    (error: unknown) =>
      error instanceof ElectoralSystemRegistryError &&
      error.code === 'INVALID_ELECTORAL_SYSTEM_ID',
  )
  assert.throws(
    () => registry.get('union-parallel'),
    (error: unknown) =>
      error instanceof ElectoralSystemRegistryError &&
      error.code === 'UNREGISTERED_ELECTORAL_SYSTEM',
  )
})

test('rejects normalized results with inconsistent parliament totals', () => {
  const scenario: ElectoralScenario = {
    mode: 'unfiltered-reference',
    validSecondVotes: 1,
    parties: {
      A: { secondVotes: 1, isNationalMinorityParty: false },
    },
    states: [
      {
        state: 'Alpha',
        isActive: true,
        validFirstVotes: 1,
        validSecondVotes: 1,
        secondVotesByParty: { A: 1 },
      },
    ],
    districts: [
      {
        districtId: 1,
        state: 'Alpha',
        validFirstVotes: 1,
        firstVotesByParty: { A: 1 },
      },
    ],
  }
  const invalidResult: ElectoralSystemResult = {
    systemId: 'de-2023-fixed-630',
    legalVersion: 'test',
    scenarioMode: 'unfiltered-reference',
    totalSeats: 2,
    majorityThreshold: 2,
    parties: [
      {
        party: 'A',
        secondVotes: 1,
        eligibleForListSeats: true,
        totalSeats: 1,
        directWins: 1,
        directSeats: 1,
        listSeats: 0,
        uncoveredDistrictWins: 0,
      },
    ],
    warnings: [],
    metadata: {
      institutionalSeatCapacity: 2,
      allocatedDirectSeatCount: 1,
      emptyDistrictCount: 0,
      reservedDirectSeats: 0,
      uncompensatedOverhangSeats: 0,
      inactiveStates: [],
    },
  }

  assert.throws(
    () => normalizeElectoralSystemResult(invalidResult, scenario),
    /party seats do not add up to the parliament total/,
  )
})
