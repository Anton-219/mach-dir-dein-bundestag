import assert from 'node:assert/strict'
import test from 'node:test'

import {
  calculateDirectMandates,
  resolveDistrictWinner,
} from '../../src/lib/election/calculate-direct-mandates.ts'
import { applyFilterState } from '../../src/lib/filters/filter-state.ts'
import type { VoteEntry } from '../../src/models/json-contracts.ts'

function firstVote(
  districtId: number,
  party: string,
  votes: number,
  overrides: Partial<VoteEntry> = {},
): VoteEntry {
  return {
    districtId,
    state: 'Berlin',
    gender: 'm',
    ageGroup: '18-24',
    party,
    voteType: '1',
    electionMethod: 'in-person',
    votes,
    ...overrides,
  }
}

test('aggregates demographic first-vote rows before counting district wins', () => {
  const results = calculateDirectMandates([
    firstVote(1, 'SPD', 30),
    firstVote(1, 'SPD', 25, { gender: 'w' }),
    firstVote(1, 'CDU', 50),
    firstVote(2, 'SPD', 40),
    firstVote(2, 'CDU', 60),
    firstVote(3, 'SPD', 70),
    firstVote(3, 'CDU', 20),
  ])

  assert.deepEqual(results, [
    { party: 'SPD', districtsWon: 2 },
    { party: 'CDU', districtsWon: 1 },
  ])
})

test('applies scenario filters before determining the district winner', () => {
  const entries = [
    firstVote(1, 'SPD', 60),
    firstVote(1, 'CDU', 70, { gender: 'w' }),
  ]

  assert.deepEqual(calculateDirectMandates(entries), [
    { party: 'CDU', districtsWon: 1 },
  ])
  assert.deepEqual(
    calculateDirectMandates(
      applyFilterState(entries, {
        states: [],
        ageGroups: [],
        genders: ['w'],
        electionMethods: [],
      }),
    ),
    [{ party: 'SPD', districtsWon: 1 }],
  )
})

test('resolves an exactly tied positive district by stable party slug', () => {
  assert.equal(
    resolveDistrictWinner([
      { districtId: 1, party: 'SPD', votes: 50 },
      { districtId: 1, party: 'CDU', votes: 50 },
    ]),
    'CDU',
  )
  assert.deepEqual(
    calculateDirectMandates([
      firstVote(1, 'SPD', 50),
      firstVote(1, 'CDU', 50),
    ]),
    [{ party: 'CDU', districtsWon: 1 }],
  )
})

test('leaves a zero-vote district without a winner', () => {
  assert.equal(
    resolveDistrictWinner([
      { districtId: 1, party: 'SPD', votes: 0 },
      { districtId: 1, party: 'CDU', votes: 0 },
    ]),
    undefined,
  )
  assert.deepEqual(
    calculateDirectMandates([
      firstVote(1, 'SPD', 0),
      firstVote(1, 'CDU', 0),
    ]),
    [],
  )
})

test('accepts a replaceable tie-resolution strategy', () => {
  const results = calculateDirectMandates(
    [firstVote(1, 'SPD', 50), firstVote(1, 'CDU', 50)],
    (districtResults) => districtResults[0]?.party,
  )

  assert.deepEqual(results, [{ party: 'SPD', districtsWon: 1 }])
})
