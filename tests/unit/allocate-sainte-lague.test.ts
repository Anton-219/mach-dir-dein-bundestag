import assert from 'node:assert/strict'
import test from 'node:test'

import {
  allocateSainteLague,
  allocateSainteLagueWithMinimums,
} from '../../src/lib/election/allocate-sainte-lague.ts'
import { ElectoralSystemCalculationError } from '../../src/lib/election/electoral-system-types.ts'

test('allocates an arbitrary fixed seat pool', () => {
  const result = allocateSainteLague(
    [
      { key: 'A', votes: 100 },
      { key: 'B', votes: 80 },
      { key: 'C', votes: 30 },
    ],
    7,
  )

  assert.deepEqual(result.allocations, [
    { key: 'A', seats: 3 },
    { key: 'B', seats: 3 },
    { key: 'C', seats: 1 },
  ])
  assert.deepEqual(result.warnings, [])
})

test('allocates remaining seats after preserving lower bounds', () => {
  const result = allocateSainteLagueWithMinimums(
    [
      { key: 'A', votes: 100 },
      { key: 'B', votes: 80 },
      { key: 'C', votes: 20 },
    ],
    7,
    { B: 3, C: 1 },
  )

  assert.deepEqual(result.allocations, [
    { key: 'A', seats: 3 },
    { key: 'B', seats: 3 },
    { key: 'C', seats: 1 },
  ])
})

test('resolves exact quotient ties by stable key order and reports the fallback', () => {
  const result = allocateSainteLague(
    [
      { key: 'B', votes: 100 },
      { key: 'A', votes: 100 },
    ],
    1,
  )

  assert.deepEqual(result.allocations, [
    { key: 'A', seats: 1 },
    { key: 'B', seats: 0 },
  ])
  assert.deepEqual(result.warnings, [
    {
      code: 'LEGAL_LOT_REPLACED_BY_STABLE_ORDER',
      details: { allocationKeys: ['A', 'B'] },
    },
  ])
})

test('returns zero allocations for an empty seat pool', () => {
  const result = allocateSainteLague(
    [
      { key: 'B', votes: 0 },
      { key: 'A', votes: 0 },
    ],
    0,
  )

  assert.deepEqual(result, {
    allocations: [
      { key: 'A', seats: 0 },
      { key: 'B', seats: 0 },
    ],
    warnings: [],
  })
})

test('rejects a positive seat pool without positive votes', () => {
  assert.throws(
    () => allocateSainteLague([{ key: 'A', votes: 0 }], 1),
    (error: unknown) =>
      error instanceof ElectoralSystemCalculationError &&
      error.code === 'NO_VALID_SECOND_VOTES',
  )
})

test('rejects minimum seats above the available pool', () => {
  assert.throws(
    () =>
      allocateSainteLagueWithMinimums(
        [{ key: 'A', votes: 100 }],
        1,
        { A: 2 },
      ),
    /exceeds the seat pool/,
  )
})
