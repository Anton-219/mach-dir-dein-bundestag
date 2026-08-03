import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyFilterState,
  clearFilterDimension,
  countActiveFilterDimensions,
  countVotes,
  createEmptyFilterState,
  toggleExcludedValue,
  type FilterState,
} from '../../src/lib/filters/index.ts'
import type { VoteEntry } from '../../src/models/json-contracts.ts'

const entries: VoteEntry[] = [
  {
    districtId: 1,
    state: 'Berlin',
    gender: 'm',
    ageGroup: '18-24',
    party: 'SPD',
    voteType: '2',
    electionMethod: 'postal',
    votes: 100,
  },
  {
    districtId: 1,
    state: 'Berlin',
    gender: 'w',
    ageGroup: '18-24',
    party: 'CDU',
    voteType: '2',
    electionMethod: 'postal',
    votes: 50,
  },
  {
    districtId: 18,
    state: 'Hamburg',
    gender: 'm',
    ageGroup: '25-34',
    party: 'SPD',
    voteType: '2',
    electionMethod: 'in-person',
    votes: 25,
  },
  {
    districtId: 18,
    state: 'Hamburg',
    gender: 'm',
    ageGroup: '25-34',
    party: 'UNKNOWN',
    voteType: '2',
    electionMethod: 'in-person',
    votes: 25,
  },
]

test('excludes disabled values across every filter dimension', () => {
  const filters: FilterState = {
    states: ['Berlin'],
    ageGroups: ['18-24'],
    genders: ['w'],
    electionMethods: ['postal'],
  }

  const filtered = applyFilterState(entries, filters)

  assert.deepEqual(
    filtered.map((entry) => entry.party),
    ['SPD', 'UNKNOWN'],
  )
  assert.equal(countVotes(filtered), 50)
  assert.equal(entries.length, 4)
})

test('treats empty exclusion lists as the complete unfiltered result', () => {
  const filters = createEmptyFilterState()
  const filtered = applyFilterState(entries, filters)

  assert.deepEqual(filtered, entries)
  assert.notStrictEqual(filtered, entries)
  assert.equal(countActiveFilterDimensions(filters), 0)
})

test('stores only serializable lists of excluded values', () => {
  const filters: FilterState = {
    states: ['Berlin'],
    ageGroups: ['18-24'],
    genders: ['w'],
    electionMethods: ['postal'],
  }

  assert.deepEqual(JSON.parse(JSON.stringify(filters)), filters)
  assert.equal(countActiveFilterDimensions(filters), 4)
})

test('toggles exclusions and clears one dimension without changing the others', () => {
  const excludedStates = toggleExcludedValue<string>([], 'Schleswig-Holstein')
  const filters: FilterState = {
    ...createEmptyFilterState(),
    states: excludedStates,
    genders: ['m'],
  }

  const cleared = clearFilterDimension(filters, 'states')

  assert.deepEqual(filters.states, ['Schleswig-Holstein'])
  assert.deepEqual(
    toggleExcludedValue(filters.states, 'Schleswig-Holstein'),
    [],
  )
  assert.deepEqual(cleared.states, [])
  assert.deepEqual(cleared.genders, ['m'])
  assert.equal(countActiveFilterDimensions(cleared), 1)
})
