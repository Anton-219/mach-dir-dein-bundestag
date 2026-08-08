import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ElectoralSystemCalculationError,
  type DistrictWinner,
  type ElectoralScenario,
} from '../../src/lib/election/electoral-system-types.ts'
import { pre2023Calculator } from '../../src/lib/election/pre-2023-calculator.ts'

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
  options?: {
    mode?: 'unfiltered-reference' | 'filtered-model'
    inactiveState?: boolean
  },
): { scenario: ElectoralScenario; districtWinners: DistrictWinner[] } {
  const districtWinners = createDistrictWinners(directWins)
  const validSecondVotes = Object.values(secondVotes).reduce(
    (total, votes) => total + votes,
    0,
  )
  const scenario: ElectoralScenario = {
    mode: options?.mode ?? 'unfiltered-reference',
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
      ...(options?.inactiveState
        ? [
            {
              state: 'Inactive',
              isActive: false,
              validFirstVotes: 0,
              validSecondVotes: 0,
              secondVotesByParty: {},
            },
          ]
        : []),
    ],
    districts: [
      ...districtWinners.map((winner) => ({
        districtId: winner.districtId,
        state: winner.state,
        validFirstVotes: 1,
        firstVotesByParty: { [winner.party]: 1 },
      })),
      ...(options?.inactiveState
        ? [
            {
              districtId: districtWinners.length + 1,
              state: 'Inactive',
              validFirstVotes: 0,
              firstVotesByParty: {},
            },
          ]
        : []),
    ],
  }
  return { scenario, districtWinners }
}

test('reproduces the documented 2021 pre-2023 aggregate result', () => {
  const secondVotes = {
    CDU: 8_775_471,
    SPD: 11_955_434,
    AfD: 4_803_902,
    FDP: 5_319_952,
    'DIE LINKE': 2_270_906,
    GRÜNE: 6_852_206,
    CSU: 2_402_827,
    SSW: 55_578,
    Sonstige: 4_000_000,
  }
  const directWins = {
    SPD: 121,
    CDU: 98,
    GRÜNE: 16,
    AfD: 16,
    CSU: 45,
    'DIE LINKE': 3,
  }
  const { scenario, districtWinners } = createScenario(
    secondVotes,
    directWins,
  )

  const result = pre2023Calculator.calculate({
    scenario,
    districtWinners,
    directWinsByParty: directWins,
    supportingData: {
      stateSeatContingents: { Germany: 598 },
      stateSeatContingentYear: 2021,
    },
  })

  assert.equal(result.legalVersion, 'de-2021-bwahlg-2020-v1')
  assert.equal(result.totalSeats, 736)
  assert.equal(result.majorityThreshold, 369)
  assert.equal(result.metadata.institutionalSeatCapacity, 598)
  assert.equal(result.metadata.uncompensatedOverhangSeats, 3)
  assert.equal(result.metadata.stateSeatContingentYear, 2021)
  assert.equal(result.metadata.referenceScenario, 'btw-2021-main-election')
  assert.deepEqual(
    Object.fromEntries(
      result.parties
        .filter((party) => party.totalSeats > 0)
        .map((party) => [party.party, party.totalSeats]),
    ),
    {
      CDU: 152,
      SPD: 206,
      AfD: 83,
      FDP: 92,
      'DIE LINKE': 39,
      GRÜNE: 118,
      CSU: 45,
      SSW: 1,
    },
  )
  assert.ok(
    result.parties.every(
      (party) => party.totalSeats === party.directSeats + party.listSeats,
    ),
  )
  assert.ok(result.parties.every((party) => party.uncoveredDistrictWins === 0))
})

test('accepts 2025 state-seat-contingent metadata', () => {
  const { scenario, districtWinners } = createScenario({ A: 100 }, { A: 1 })

  const result = pre2023Calculator.calculate({
    scenario,
    districtWinners,
    directWinsByParty: { A: 1 },
    supportingData: {
      stateSeatContingents: { Germany: 598 },
      stateSeatContingentYear: 2025,
    },
  })

  assert.equal(result.totalSeats, 598)
  assert.equal(result.metadata.stateSeatContingentYear, 2025)
  assert.equal(result.metadata.referenceScenario, 'btw-2025-main-election')
})

test('reserves one or two direct wins of a below-threshold party', () => {
  const secondVotes = { A: 960, BELOW: 40 }
  const directWins = { BELOW: 2 }
  const { scenario, districtWinners } = createScenario(
    secondVotes,
    directWins,
  )

  const result = pre2023Calculator.calculate({
    scenario,
    districtWinners,
    directWinsByParty: directWins,
    supportingData: {
      stateSeatContingents: { Germany: 598 },
      stateSeatContingentYear: 2021,
    },
  })
  const byParty = Object.fromEntries(
    result.parties.map((party) => [party.party, party]),
  )

  assert.equal(result.totalSeats, 598)
  assert.equal(result.metadata.reservedDirectSeats, 2)
  assert.equal(byParty.A?.totalSeats, 596)
  assert.equal(byParty.BELOW?.eligibleForListSeats, false)
  assert.equal(byParty.BELOW?.totalSeats, 2)
  assert.equal(byParty.BELOW?.directSeats, 2)
  assert.equal(byParty.BELOW?.listSeats, 0)
})

test('retains the national base size while an inactive state receives no preliminary seats', () => {
  const secondVotes = { A: 100 }
  const directWins = { A: 1 }
  const { scenario, districtWinners } = createScenario(secondVotes, directWins, {
    mode: 'filtered-model',
    inactiveState: true,
  })

  const result = pre2023Calculator.calculate({
    scenario,
    districtWinners,
    directWinsByParty: directWins,
    supportingData: {
      stateSeatContingents: { Germany: 300, Inactive: 298 },
      stateSeatContingentYear: 2021,
    },
  })

  assert.equal(result.totalSeats, 598)
  assert.equal(result.parties[0]?.totalSeats, 598)
  assert.deepEqual(
    result.warnings.map((warning) => warning.code),
    ['FILTERED_FIRST_VOTE_MODEL', 'INACTIVE_STATE_SIMULATION'],
  )
  assert.deepEqual(result.metadata.inactiveStates, ['Inactive'])
})

test('requires a complete supported state-seat-contingent fixture', () => {
  const { scenario, districtWinners } = createScenario({ A: 100 }, { A: 1 })

  assert.throws(
    () =>
      pre2023Calculator.calculate({
        scenario,
        districtWinners,
        directWinsByParty: { A: 1 },
      }),
    (error: unknown) =>
      error instanceof ElectoralSystemCalculationError &&
      error.code === 'MISSING_STATE_SEAT_CONTINGENT',
  )
  assert.throws(
    () =>
      pre2023Calculator.calculate({
        scenario,
        districtWinners,
        directWinsByParty: { A: 1 },
        supportingData: {
          stateSeatContingents: { Germany: 597 },
          stateSeatContingentYear: 2021,
        },
      }),
    (error: unknown) =>
      error instanceof ElectoralSystemCalculationError &&
      error.code === 'INVALID_STATE_SEAT_CONTINGENT_FIXTURE',
  )
  assert.throws(
    () =>
      pre2023Calculator.calculate({
        scenario,
        districtWinners,
        directWinsByParty: { A: 1 },
        supportingData: {
          stateSeatContingents: { Germany: 598 },
          stateSeatContingentYear: 2024,
        },
      }),
    (error: unknown) =>
      error instanceof ElectoralSystemCalculationError &&
      error.code === 'INVALID_STATE_SEAT_CONTINGENT_FIXTURE',
  )
})
