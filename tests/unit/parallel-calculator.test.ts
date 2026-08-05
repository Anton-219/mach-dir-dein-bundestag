import assert from 'node:assert/strict'
import test from 'node:test'

import { calculateElectoralSystem } from '../../src/lib/election/electoral-system-engine.ts'
import {
  ElectoralSystemCalculationError,
  type DistrictWinner,
  type ElectoralScenario,
} from '../../src/lib/election/electoral-system-types.ts'
import {
  parallelCalculator,
  UNION_PARALLEL_CONFIG,
} from '../../src/lib/election/parallel-calculator.ts'

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

function createScenario(
  secondVotes: Readonly<Record<string, number>>,
  directWins: Readonly<Record<string, number>>,
  mode: ElectoralScenario['mode'] = 'unfiltered-reference',
): ElectoralScenario {
  const districtWinners = createDistrictWinners(directWins)
  const validSecondVotes = Object.values(secondVotes).reduce(
    (total, votes) => total + votes,
    0,
  )
  const districts = districtWinners.map((winner) => ({
    districtId: winner.districtId,
    state: winner.state,
    validFirstVotes: 1,
    firstVotesByParty: { [winner.party]: 1 },
  }))
  while (districts.length < UNION_PARALLEL_CONFIG.maximumDirectSeatCount) {
    districts.push({
      districtId: districts.length + 1,
      state: 'Germany',
      validFirstVotes: 0,
      firstVotesByParty: {},
    })
  }

  return {
    mode,
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
    districts,
  }
}

test('reproduces the documented 2021 union-parallel aggregate result', () => {
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
  const scenario = createScenario(secondVotes, directWins)

  const result = calculateElectoralSystem('union-parallel', scenario)
  const byParty = Object.fromEntries(
    result.parties.map((party) => [party.party, party]),
  )

  assert.equal(result.legalVersion, 'union-parallel-299-299-v1')
  assert.equal(result.totalSeats, 598)
  assert.equal(result.majorityThreshold, 300)
  assert.deepEqual(
    Object.fromEntries(
      result.parties
        .filter((party) => party.totalSeats > 0)
        .map((party) => [
          party.party,
          {
            totalSeats: party.totalSeats,
            directSeats: party.directSeats,
            listSeats: party.listSeats,
          },
        ]),
    ),
    {
      SPD: { totalSeats: 205, directSeats: 121, listSeats: 84 },
      CDU: { totalSeats: 160, directSeats: 98, listSeats: 62 },
      GRÜNE: { totalSeats: 64, directSeats: 16, listSeats: 48 },
      CSU: { totalSeats: 62, directSeats: 45, listSeats: 17 },
      AfD: { totalSeats: 50, directSeats: 16, listSeats: 34 },
      FDP: { totalSeats: 38, directSeats: 0, listSeats: 38 },
      'DIE LINKE': { totalSeats: 19, directSeats: 3, listSeats: 16 },
    },
  )
  assert.equal(byParty.SSW?.eligibleForListSeats, true)
  assert.equal(byParty.SSW?.listSeats, 0)
  assert.equal(byParty.Sonstige?.eligibleForListSeats, false)
  assert.equal(byParty.Sonstige?.totalSeats, 0)
  assert.equal(result.metadata.institutionalSeatCapacity, 598)
  assert.equal(result.metadata.maximumDirectSeatCount, 299)
  assert.equal(result.metadata.fixedListSeatCount, 299)
  assert.equal(result.metadata.allocatedDirectSeatCount, 299)
  assert.equal(result.metadata.unallocatedDirectSeatCount, 0)
})

test('keeps list and direct tiers independent when districts are empty', () => {
  const secondVotes = { A: 960, BELOW: 40 }
  const directWins = { A: 291, BELOW: 2 }
  const scenario = createScenario(secondVotes, directWins, 'filtered-model')
  const districtWinners = createDistrictWinners(directWins)

  const result = parallelCalculator.calculate({
    scenario,
    districtWinners,
    directWinsByParty: directWins,
  })
  const byParty = Object.fromEntries(
    result.parties.map((party) => [party.party, party]),
  )

  assert.equal(result.totalSeats, 592)
  assert.equal(result.majorityThreshold, 297)
  assert.equal(byParty.A?.directSeats, 291)
  assert.equal(byParty.A?.listSeats, 299)
  assert.equal(byParty.A?.totalSeats, 590)
  assert.equal(byParty.BELOW?.eligibleForListSeats, false)
  assert.equal(byParty.BELOW?.directSeats, 2)
  assert.equal(byParty.BELOW?.listSeats, 0)
  assert.equal(byParty.BELOW?.totalSeats, 2)
  assert.equal(byParty.BELOW?.uncoveredDistrictWins, 0)
  assert.equal(result.metadata.emptyDistrictCount, 6)
  assert.equal(result.metadata.unallocatedDirectSeatCount, 6)
  assert.deepEqual(
    result.warnings.map((warning) => warning.code),
    ['FILTERED_FIRST_VOTE_MODEL'],
  )
})

test('applies qualification only to the list tier', () => {
  const secondVotes = {
    A: 930,
    DIRECT: 40,
    SSW: 20,
    Sonstige: 10,
  }
  const directWins = { A: 296, DIRECT: 3 }
  const scenario = createScenario(secondVotes, directWins)
  const districtWinners = createDistrictWinners(directWins)

  const result = parallelCalculator.calculate({
    scenario,
    districtWinners,
    directWinsByParty: directWins,
  })
  const byParty = Object.fromEntries(
    result.parties.map((party) => [party.party, party]),
  )

  assert.equal(byParty.DIRECT?.eligibleForListSeats, true)
  assert.ok((byParty.DIRECT?.listSeats ?? 0) > 0)
  assert.equal(byParty.DIRECT?.directSeats, 3)
  assert.equal(byParty.SSW?.eligibleForListSeats, true)
  assert.ok((byParty.SSW?.listSeats ?? 0) > 0)
  assert.equal(byParty.Sonstige?.eligibleForListSeats, false)
  assert.equal(byParty.Sonstige?.totalSeats, 0)
  assert.equal(
    result.parties.reduce((total, party) => total + party.listSeats, 0),
    299,
  )
})

test('reports filtered inactive-state simulations without filling their direct seats', () => {
  const secondVotes = { A: 100 }
  const districtWinners = createDistrictWinners({ A: 293 }, 'Alpha')
  const scenario: ElectoralScenario = {
    mode: 'filtered-model',
    validSecondVotes: 100,
    parties: {
      A: { secondVotes: 100, isNationalMinorityParty: false },
    },
    states: [
      {
        state: 'Alpha',
        isActive: true,
        validFirstVotes: 293,
        validSecondVotes: 100,
        secondVotesByParty: { A: 100 },
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
      ...districtWinners.map((winner) => ({
        districtId: winner.districtId,
        state: winner.state,
        validFirstVotes: 1,
        firstVotesByParty: { A: 1 },
      })),
      ...Array.from({ length: 6 }, (_, index) => ({
        districtId: 294 + index,
        state: 'Beta',
        validFirstVotes: 0,
        firstVotesByParty: {},
      })),
    ],
  }

  const result = parallelCalculator.calculate({
    scenario,
    districtWinners,
    directWinsByParty: { A: 293 },
  })

  assert.equal(result.totalSeats, 592)
  assert.deepEqual(
    result.warnings.map((warning) => warning.code),
    ['FILTERED_FIRST_VOTE_MODEL', 'INACTIVE_STATE_SIMULATION'],
  )
  assert.deepEqual(result.metadata.inactiveStates, ['Beta'])
  assert.equal(result.metadata.unallocatedDirectSeatCount, 6)
})

test('rejects incomplete district and direct-win inputs clearly', () => {
  const incompleteScenario = createScenario({ A: 100 }, {})
  const districts = incompleteScenario.districts.slice(0, 298)

  assert.throws(
    () =>
      parallelCalculator.calculate({
        scenario: { ...incompleteScenario, districts },
        districtWinners: [],
        directWinsByParty: {},
      }),
    (error: unknown) =>
      error instanceof ElectoralSystemCalculationError &&
      error.code === 'INCONSISTENT_DIRECT_TIER_SIZE',
  )

  const scenario = createScenario({ A: 100 }, { A: 1 })
  const districtWinners = createDistrictWinners({ A: 1 })
  assert.throws(
    () =>
      parallelCalculator.calculate({
        scenario,
        districtWinners,
        directWinsByParty: {},
      }),
    (error: unknown) =>
      error instanceof ElectoralSystemCalculationError &&
      error.code === 'INCONSISTENT_DIRECT_TIER_SIZE',
  )
})
