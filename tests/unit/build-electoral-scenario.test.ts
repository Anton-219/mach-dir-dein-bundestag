import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildElectoralScenario,
  createElectoralScenarioReference,
} from '../../src/lib/election/build-electoral-scenario.ts'
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

test('accepts consistent modeled fractional votes accumulated in different group orders', () => {
  const firstVotes = [
    vote('1', 1, 'Alpha', 'A', 1),
    vote('1', 2, 'Beta', 'A', 1),
  ]
  const secondVotes = Array.from({ length: 5_000 }, (_, index) => {
    const isBeta = index % 2 === 1
    return vote(
      '2',
      isBeta ? 2 : 1,
      isBeta ? 'Beta' : 'Alpha',
      ['A', 'B', 'C'][index % 3] ?? 'A',
      0.1 + ((index * 17) % 13) / 1_000,
    )
  })
  const reference = createElectoralScenarioReference({
    firstVotes,
    secondVotes,
  })

  const scenario = buildElectoralScenario({
    mode: 'filtered-model',
    firstVotes,
    secondVotes,
    reference,
  })

  assert.equal(scenario.states.length, 2)
  assert.equal(scenario.districts.length, 2)
  assert.ok(scenario.validSecondVotes > 0)
  assert.ok(
    Math.abs(
      scenario.validSecondVotes -
        scenario.states.reduce(
          (total, state) => total + state.validSecondVotes,
          0,
        ),
    ) < 0.001,
  )
})
