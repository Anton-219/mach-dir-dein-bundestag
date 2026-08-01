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
  assert.deepEqual(buildStatePartyLandscape(entries, parties, 'Berlin', filters), {
    status: 'ready',
    results: [
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
    ],
  })
})

test('ignores state exclusions but applies demographic filters', () => {
  const landscape = buildStatePartyLandscape(entries, parties, 'Berlin', {
    ...filters,
    ageGroups: ['18-24'],
    genders: [],
  })

  assert.deepEqual(landscape, {
    status: 'ready',
    results: [
      {
        partyAbbreviation: 'CDU',
        votes: 100,
        percentage: 1,
        seatPosition: 33,
      },
    ],
  })
})

test('returns an invalid result instead of throwing for negative votes', () => {
  const landscape = buildStatePartyLandscape(
    [
      ...entries,
      {
        ...entries[0],
        votes: -1,
      },
    ],
    parties,
    'Berlin',
    filters,
  )

  assert.equal(landscape.status, 'invalid')

  if (landscape.status !== 'invalid') {
    assert.fail('Expected the state party landscape to be invalid.')
  }

  assert.deepEqual(landscape.results, [])
  assert.match(landscape.message, /could not be calculated/i)
})
