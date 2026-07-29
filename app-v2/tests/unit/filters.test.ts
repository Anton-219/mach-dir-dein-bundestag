import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyFilterState,
  clearFilterDimension,
  countActiveFilterDimensions,
  countVotes,
  createEmptyFilterState,
  getActiveFilterSummaries,
  summarizeFilterState,
  toggleSelectionValue,
  type FilterState,
} from '../../src/lib/filters/index.ts'
import type { VoteEntry } from '../../src/models/json-contracts.ts'

const entries: VoteEntry[] = [
  {
    state: 'Berlin',
    gender: 'm',
    ageGroup: '18-24',
    party: 'SPD',
    voteType: '2',
    electionMethod: 'postal',
    votes: 100,
  },
  {
    state: 'Berlin',
    gender: 'w',
    ageGroup: '18-24',
    party: 'CDU',
    voteType: '2',
    electionMethod: 'postal',
    votes: 50,
  },
  {
    state: 'Hamburg',
    gender: 'm',
    ageGroup: '25-34',
    party: 'SPD',
    voteType: '2',
    electionMethod: 'in-person',
    votes: 25,
  },
  {
    state: 'Hamburg',
    gender: 'm',
    ageGroup: '25-34',
    party: 'UNKNOWN',
    voteType: '2',
    electionMethod: 'in-person',
    votes: 25,
  },
]

test('applies include and exclude selections across every dimension', () => {
  const filters: FilterState = {
    states: { mode: 'include', values: ['Hamburg'] },
    ageGroups: { mode: 'include', values: ['25-34'] },
    genders: { mode: 'exclude', values: ['w'] },
    electionMethods: { mode: 'include', values: ['in-person'] },
  }

  const filtered = applyFilterState(entries, filters)

  assert.deepEqual(
    filtered.map((entry) => entry.party),
    ['SPD', 'UNKNOWN'],
  )
  assert.equal(countVotes(filtered), 50)
  assert.equal(entries.length, 4)
})

test('treats empty selections as the complete unfiltered result', () => {
  const filters = createEmptyFilterState()
  const filtered = applyFilterState(entries, filters)

  assert.deepEqual(filtered, entries)
  assert.notStrictEqual(filtered, entries)
  assert.equal(countActiveFilterDimensions(filters), 0)
  assert.equal(summarizeFilterState(filters), 'All voters in Germany')
})

test('stores only serializable filter data', () => {
  const filters: FilterState = {
    states: { mode: 'exclude', values: ['Berlin'] },
    ageGroups: { mode: 'include', values: ['18-24'] },
    genders: { mode: 'include', values: ['w'] },
    electionMethods: { mode: 'include', values: ['postal'] },
  }

  assert.deepEqual(JSON.parse(JSON.stringify(filters)), filters)
  assert.equal(countActiveFilterDimensions(filters), 4)
  assert.equal(
    summarizeFilterState(filters),
    'Berlin excluded · Only ages 18–24 · Women only · Postal voting only',
  )
  assert.deepEqual(getActiveFilterSummaries(filters), [
    { dimension: 'states', label: 'Berlin excluded' },
    { dimension: 'ageGroups', label: 'Only ages 18–24' },
    { dimension: 'genders', label: 'Women only' },
    { dimension: 'electionMethods', label: 'Postal voting only' },
  ])
})

test('toggles values and clears one filter dimension without changing the others', () => {
  const filters: FilterState = {
    ...createEmptyFilterState(),
    states: toggleSelectionValue(
      createEmptyFilterState().states,
      'Schleswig-Holstein',
    ),
    genders: { mode: 'exclude', values: ['m'] },
  }

  const cleared = clearFilterDimension(filters, 'states')

  assert.deepEqual(filters.states.values, ['Schleswig-Holstein'])
  assert.deepEqual(cleared.states, { mode: 'include', values: [] })
  assert.deepEqual(cleared.genders, { mode: 'exclude', values: ['m'] })
  assert.equal(countActiveFilterDimensions(cleared), 1)
})
