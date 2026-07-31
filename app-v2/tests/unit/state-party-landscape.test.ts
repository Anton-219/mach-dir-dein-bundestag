import assert from 'node:assert/strict'
import test from 'node:test'

import { buildStatePartyLandscape } from '../../src/lib/results/state-party-landscape.ts'
import type { FilterState } from '../../src/lib/filters/filter-state.ts'
import type { Party, VoteEntry } from '../../src/models/json-contracts.ts'

const parties: Party[] = [
  { name: 'Social Democrats', abbreviation: 'SPD', color: '#f00', seatPosition: -15 },
  { name: 'Christian Democrats', abbreviation: 'CDU', color: '#000', seatPosition: 33 },
]

const entries: VoteEntry[] = [
  {
    state: 'Berlin',
    gender: 'm',
    ageGroup: '18-24',
    party: 'SPD',
    voteType: '2',
    electionMethod: 'postal',
    votes: 60,
  },
  {
    state: 'Berlin',
    gender: 'm',
    ageGroup: '18-24',
    party: 'CDU',
    voteType: '2',
    electionMethod: 'postal',
    votes: 40,
  },
  {
    state: 'Berlin',
    gender: 'w',
    ageGroup: '25-34',
    party: 'CDU',
    voteType: '2',
    electionMethod: 'in-person',
    votes: 100,
  },
  {
    state: 'Hamburg',
    gender: 'm',
    ageGroup: '18-24',
    party: 'SPD',
    voteType: '2',
    electionMethod: 'postal',
    votes: 500,
  },
]

const filters: FilterState = {
  states: ['Berlin'],
  ageGroups: [],
  genders: ['w'],
  electionMethods: [],
}

test('builds a sorted party landscape for one state', () => {
  assert.deepEqual(buildStatePartyLandscape(entries, parties, 'Berlin', filters), [
    {
      partyAbbreviation: 'SPD',
      votes: 60,
      percentage: 0.6,
      seatPosition: -15,
    },
    {
      partyAbbreviation: 'CDU',
      votes: 40,
      percentage: 0.4,
      seatPosition: 33,
    },
  ])
})

test('ignores state exclusions but applies demographic filters', () => {
  const results = buildStatePartyLandscape(entries, parties, 'Berlin', {
    ...filters,
    ageGroups: ['18-24'],
    genders: [],
  })

  assert.deepEqual(results, [
    {
      partyAbbreviation: 'CDU',
      votes: 100,
      percentage: 1,
      seatPosition: 33,
    },
  ])
})
