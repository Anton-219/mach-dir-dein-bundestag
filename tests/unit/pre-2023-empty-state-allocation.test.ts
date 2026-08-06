import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ElectoralSystemCalculationError,
  type DistrictWinner,
  type ElectoralScenario,
} from '../../src/lib/election/electoral-system-types.ts'
import { pre2023Calculator } from '../../src/lib/election/pre-2023-calculator.ts'

const scenario: ElectoralScenario = {
  mode: 'filtered-model',
  validSecondVotes: 1_000,
  parties: {
    A: { secondVotes: 900, isNationalMinorityParty: false },
    Sonstige: { secondVotes: 100, isNationalMinorityParty: false },
  },
  states: [
    {
      state: 'North',
      isActive: true,
      validFirstVotes: 1,
      validSecondVotes: 900,
      secondVotesByParty: { A: 900, Sonstige: 0 },
    },
    {
      state: 'South',
      isActive: true,
      validFirstVotes: 1,
      validSecondVotes: 100,
      secondVotesByParty: { A: 0, Sonstige: 100 },
    },
  ],
  districts: [
    {
      districtId: 1,
      state: 'North',
      validFirstVotes: 1,
      firstVotesByParty: { A: 1 },
    },
    {
      districtId: 2,
      state: 'South',
      validFirstVotes: 1,
      firstVotesByParty: { A: 1 },
    },
  ],
}

const districtWinners: readonly DistrictWinner[] = [
  {
    districtId: 1,
    state: 'North',
    party: 'A',
    firstVotes: 1,
    validFirstVotes: 1,
    firstVoteShare: 1,
  },
  {
    districtId: 2,
    state: 'South',
    party: 'A',
    firstVotes: 1,
    validFirstVotes: 1,
    firstVoteShare: 1,
  },
]

test('rejects an active state whose contingent has no eligible second votes', () => {
  assert.throws(
    () =>
      pre2023Calculator.calculate({
        scenario,
        districtWinners,
        directWinsByParty: { A: 2 },
        supportingData: {
          stateSeatContingents: { North: 300, South: 298 },
          stateSeatContingentYear: 2021,
        },
      }),
    (error: unknown) =>
      error instanceof ElectoralSystemCalculationError &&
      error.code === 'NO_VALID_SECOND_VOTES' &&
      error.details?.state === 'South' &&
      error.details?.effectiveContingent === 298,
  )
})
