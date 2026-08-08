import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_ELECTION_YEAR,
  ELECTION_YEARS,
} from '../../src/data/elections.ts'

test('opens the application with the 2025 Bundestag election selected', () => {
  assert.deepEqual(ELECTION_YEARS, [2021, 2025])
  assert.equal(DEFAULT_ELECTION_YEAR, 2025)
})
