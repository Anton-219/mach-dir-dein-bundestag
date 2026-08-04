import assert from 'node:assert/strict'
import test from 'node:test'

import { fixed630Calculator } from '../../src/lib/election/fixed-630-calculator.ts'
import type {
  DistrictWinner,
  ElectoralScenario,
} from '../../src/lib/election/electoral-system-types.ts'

function createDistrictWinners(
  directWins: Readonly<Record<string, number>>,
  state = 'Germany',
): DistrictWinner[] {
  let districtId = 0
  return Object.entries(directWins).flatMap(([party, count]) =>
    Array.from({ length: count }, () => ({
      districtId: (districtId += 1),
      state,
      party,
      firstVotes: 1,
      validFirstVotes: 1,
      firstVoteShare: 1,
    })),
  )
}

test('reproduces the documented 2021 fixed-630 aggregate result', () => {
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
  const directWins = {
    SPD: 121,
    CDU: 98,
    GRÜNE: 16,
    AfD: 16,
    CSU: 45,
    'DIE LINKE': 3,
  }
  const districtWinners = createDistrictWinners(directWins)
  const validSecondVotes = Object.values(secondVotes).reduce(
    (total, votes) => total + votes,
    0,
  )
  const scenario: ElectoralScenario = {
    mode: 'unfiltered-reference',
    validSecondVotes,
    parties: Object.fromEntries(
      Object.entries(secondVotes).map(([party, votes]) => [
        party,
        { secondVotes: votes, isNationalMinorityParty: party === 'SSW' },
      ]),
    ),
    states: [
      {
        state: 'Germany',
        isActive: true,
        validFirstVotes: districtWinners.length,
        validSecondVotes,
        secondVotesByParty: secondVotes,
      },
    ],
    districts: districtWinners.map((winner) => ({
      districtId: winner.districtId,
      state: winner.state,
      validFirstVotes: 1,
      firstVotesByParty: { [winner.party]: 1 },
    })),
  }

  const result = fixed630Calculator.calculate({
    scenario,
    districtWinners,
    directWinsByParty: directWins,
  })
  const byParty = Object.fromEntries(
    result.parties.map((party) => [party.party, party]),
  )

  assert.equal(result.legalVersion, 'de-2023-fixed-630-v1')
  assert.equal(result.totalSeats, 630)
  assert.equal(result.majorityThreshold, 316)
  assert.deepEqual(
    Object.fromEntries(
      result.parties
        .filter((party) => party.totalSeats > 0)
        .map((party) => [party.party, party.totalSeats]),
    ),
    {
      CDU: 130,
      SPD: 177,
      AfD: 72,
      FDP: 79,
      'DIE LINKE': 34,
      GRÜNE: 101,
      CSU: 36,
      SSW: 1,
    },
  )
  assert.equal(byParty.CSU?.directWins, 45)
  assert.equal(byParty.CSU?.directSeats, 36)
  assert.equal(byParty.CSU?.uncoveredDistrictWins, 9)
  assert.equal(
    result.parties.reduce((total, party) => total + party.totalSeats, 0),
    630,
  )
  assert.ok(
    result.parties.every(
      (party) => party.totalSeats === party.directSeats + party.listSeats,
    ),
  )
})

test('returns filtered and inactive-state warnings without changing fixed size', () => {
  const scenario: ElectoralScenario = {
    mode: 'filtered-model',
    validSecondVotes: 100,
    parties: {
      A: { secondVotes: 60, isNationalMinorityParty: false },
      B: { secondVotes: 40, isNationalMinorityParty: false },
    },
    states: [
      {
        state: 'Alpha',
        isActive: true,
        validFirstVotes: 1,
        validSecondVotes: 100,
        secondVotesByParty: { A: 60, B: 40 },
      },
      {
        state: 'Beta',
        isActive: false,
        validFirstVotes: 0,
        validSecondVotes: 0,
        secondVotesByParty: {},
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
        state: 'Beta',
        validFirstVotes: 0,
        firstVotesByParty: {},
      },
    ],
  }
  const districtWinners: DistrictWinner[] = [
    {
      districtId: 1,
      state: 'Alpha',
      party: 'A',
      firstVotes: 1,
      validFirstVotes: 1,
      firstVoteShare: 1,
    },
  ]

  const result = fixed630Calculator.calculate({
    scenario,
    districtWinners,
    directWinsByParty: { A: 1 },
  })

  assert.equal(result.totalSeats, 630)
  assert.equal(result.majorityThreshold, 316)
  assert.deepEqual(
    Object.fromEntries(result.parties.map((party) => [party.party, party.totalSeats])),
    { A: 378, B: 252 },
  )
  assert.deepEqual(
    result.warnings.map((warning) => warning.code),
    ['FILTERED_FIRST_VOTE_MODEL', 'INACTIVE_STATE_SIMULATION'],
  )
  assert.equal(result.metadata.allocatedDirectSeatCount, 1)
  assert.equal(result.metadata.emptyDistrictCount, 1)
  assert.deepEqual(result.metadata.inactiveStates, ['Beta'])
})

test('applies direct-win and minority exemptions while excluding aggregate buckets', () => {
  const scenario: ElectoralScenario = {
    mode: 'unfiltered-reference',
    validSecondVotes: 1_100,
    parties: {
      A: { secondVotes: 885, isNationalMinorityParty: false },
      FIVE: { secondVotes: 55, isNationalMinorityParty: false },
      DIRECT: { secondVotes: 40, isNationalMinorityParty: false },
      SSW: { secondVotes: 20, isNationalMinorityParty: true },
      Sonstige: { secondVotes: 100, isNationalMinorityParty: false },
    },
    states: [
      {
        state: 'Germany',
        isActive: true,
        validFirstVotes: 3,
        validSecondVotes: 1_100,
        secondVotesByParty: {
          A: 885,
          FIVE: 55,
          DIRECT: 40,
          SSW: 20,
          Sonstige: 100,
        },
      },
    ],
    districts: [1, 2, 3].map((districtId) => ({
      districtId,
      state: 'Germany',
      validFirstVotes: 1,
      firstVotesByParty: { DIRECT: 1 },
    })),
  }
  const districtWinners = createDistrictWinners({ DIRECT: 3 })

  const result = fixed630Calculator.calculate({
    scenario,
    districtWinners,
    directWinsByParty: { DIRECT: 3 },
  })
  const byParty = Object.fromEntries(
    result.parties.map((party) => [party.party, party]),
  )

  assert.equal(byParty.FIVE?.eligibleForListSeats, true)
  assert.ok((byParty.FIVE?.totalSeats ?? 0) > 0)
  assert.equal(byParty.DIRECT?.eligibleForListSeats, true)
  assert.ok((byParty.DIRECT?.totalSeats ?? 0) > 0)
  assert.equal(byParty.SSW?.eligibleForListSeats, true)
  assert.ok((byParty.SSW?.totalSeats ?? 0) > 0)
  assert.equal(byParty.Sonstige?.eligibleForListSeats, false)
  assert.equal(byParty.Sonstige?.totalSeats, 0)
})

test('covers direct wins only with the party state seat allocation', () => {
  const scenario: ElectoralScenario = {
    mode: 'filtered-model',
    validSecondVotes: 1_000,
    parties: {
      A: { secondVotes: 990, isNationalMinorityParty: false },
      B: { secondVotes: 10, isNationalMinorityParty: true },
    },
    states: [
      {
        state: 'Alpha',
        isActive: true,
        validFirstVotes: 0,
        validSecondVotes: 900,
        secondVotesByParty: { A: 891, B: 9 },
      },
      {
        state: 'Beta',
        isActive: true,
        validFirstVotes: 2,
        validSecondVotes: 100,
        secondVotesByParty: { A: 99, B: 1 },
      },
    ],
    districts: [1, 2].map((districtId) => ({
      districtId,
      state: 'Beta',
      validFirstVotes: 1,
      firstVotesByParty: { B: 1 },
    })),
  }
  const districtWinners: DistrictWinner[] = [1, 2].map((districtId) => ({
    districtId,
    state: 'Beta',
    party: 'B',
    firstVotes: 1,
    validFirstVotes: 1,
    firstVoteShare: 1,
  }))

  const result = fixed630Calculator.calculate({
    scenario,
    districtWinners,
    directWinsByParty: { B: 2 },
  })
  const party = result.parties.find((entry) => entry.party === 'B')

  assert.equal(party?.totalSeats, 6)
  assert.equal(party?.directWins, 2)
  assert.equal(party?.directSeats, 1)
  assert.equal(party?.uncoveredDistrictWins, 1)
  assert.equal(party?.listSeats, 5)
})

test('uses stable state ordering for deterministic state allocation ties', () => {
  const scenario: ElectoralScenario = {
    mode: 'unfiltered-reference',
    validSecondVotes: 1_001,
    parties: {
      A: { secondVotes: 1_000, isNationalMinorityParty: false },
      B: { secondVotes: 1, isNationalMinorityParty: true },
    },
    states: [
      {
        state: 'Alpha',
        isActive: true,
        validFirstVotes: 0,
        validSecondVotes: 600.5,
        secondVotesByParty: { A: 600, B: 0.5 },
      },
      {
        state: 'Beta',
        isActive: true,
        validFirstVotes: 1,
        validSecondVotes: 400.5,
        secondVotesByParty: { A: 400, B: 0.5 },
      },
    ],
    districts: [
      {
        districtId: 1,
        state: 'Beta',
        validFirstVotes: 1,
        firstVotesByParty: { B: 1 },
      },
    ],
  }
  const districtWinners: DistrictWinner[] = [
    {
      districtId: 1,
      state: 'Beta',
      party: 'B',
      firstVotes: 1,
      validFirstVotes: 1,
      firstVoteShare: 1,
    },
  ]

  const result = fixed630Calculator.calculate({
    scenario,
    districtWinners,
    directWinsByParty: { B: 1 },
  })
  const party = result.parties.find((entry) => entry.party === 'B')
  const stateTieWarning = result.warnings.find(
    (warning) =>
      warning.code === 'LEGAL_LOT_REPLACED_BY_STABLE_ORDER' &&
      warning.details?.party === 'B',
  )

  assert.equal(party?.totalSeats, 1)
  assert.equal(party?.directSeats, 0)
  assert.equal(party?.uncoveredDistrictWins, 1)
  assert.deepEqual(stateTieWarning?.details?.allocationKeys, ['Alpha', 'Beta'])
})

test('leaves one or two below-threshold direct wins uncovered', () => {
  const scenario: ElectoralScenario = {
    mode: 'unfiltered-reference',
    validSecondVotes: 1_000,
    parties: {
      A: { secondVotes: 960, isNationalMinorityParty: false },
      BELOW: { secondVotes: 40, isNationalMinorityParty: false },
    },
    states: [
      {
        state: 'Germany',
        isActive: true,
        validFirstVotes: 2,
        validSecondVotes: 1_000,
        secondVotesByParty: { A: 960, BELOW: 40 },
      },
    ],
    districts: [1, 2].map((districtId) => ({
      districtId,
      state: 'Germany',
      validFirstVotes: 1,
      firstVotesByParty: { BELOW: 1 },
    })),
  }
  const districtWinners = createDistrictWinners({ BELOW: 2 })

  const result = fixed630Calculator.calculate({
    scenario,
    districtWinners,
    directWinsByParty: { BELOW: 2 },
  })
  const party = result.parties.find((entry) => entry.party === 'BELOW')

  assert.equal(party?.eligibleForListSeats, false)
  assert.equal(party?.totalSeats, 0)
  assert.equal(party?.directSeats, 0)
  assert.equal(party?.uncoveredDistrictWins, 2)
})
