import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getElectoralSystemOptions,
} from '../../src/i18n/electoral-system-messages.ts'
import type {
  ElectoralSystemId,
  ElectoralSystemResult,
} from '../../src/lib/election/index.ts'
import { createElectoralSystemPresentation } from '../../src/lib/results/electoral-system-presentation.ts'

function createResult(
  systemId: ElectoralSystemId,
  totalSeats: number,
  directSeats: number,
  listSeats: number,
  uncoveredDistrictWins = 0,
): ElectoralSystemResult {
  return {
    systemId,
    legalVersion: `${systemId}-test`,
    scenarioMode: 'unfiltered-reference',
    totalSeats,
    majorityThreshold: Math.floor(totalSeats / 2) + 1,
    parties: [
      {
        party: 'TEST',
        secondVotes: 1_000,
        eligibleForListSeats: true,
        totalSeats,
        directWins: directSeats + uncoveredDistrictWins,
        directSeats,
        listSeats,
        uncoveredDistrictWins,
      },
    ],
    warnings: [],
    metadata: {
      institutionalSeatCapacity: totalSeats,
      allocatedDirectSeatCount: directSeats + uncoveredDistrictWins,
      emptyDistrictCount: 299 - directSeats - uncoveredDistrictWins,
      reservedDirectSeats: 0,
      uncompensatedOverhangSeats: 0,
      inactiveStates: [],
    },
  }
}

test('offers all selectable electoral systems in both copy catalogs', () => {
  const englishOptions = getElectoralSystemOptions('en')
  const germanOptions = getElectoralSystemOptions('de')

  assert.deepEqual(
    englishOptions.map((option) => option.systemId),
    ['de-2021-bwahlg', 'de-2023-fixed-630', 'union-parallel'],
  )
  assert.deepEqual(
    germanOptions.map((option) => option.systemId),
    englishOptions.map((option) => option.systemId),
  )
})

test('presents different parliament totals when the selected model changes', () => {
  const presentations = [
    createResult('de-2021-bwahlg', 735, 299, 436),
    createResult('de-2023-fixed-630', 630, 276, 354, 23),
    createResult('union-parallel', 598, 299, 299),
  ].map(createElectoralSystemPresentation)

  assert.deepEqual(
    presentations.map((presentation) => ({
      systemId: presentation.systemId,
      totalSeats: presentation.totalSeats,
      majorityThreshold: presentation.majorityThreshold,
    })),
    [
      {
        systemId: 'de-2021-bwahlg',
        totalSeats: 735,
        majorityThreshold: 368,
      },
      {
        systemId: 'de-2023-fixed-630',
        totalSeats: 630,
        majorityThreshold: 316,
      },
      {
        systemId: 'union-parallel',
        totalSeats: 598,
        majorityThreshold: 300,
      },
    ],
  )
  assert.ok(
    presentations.every(
      (presentation) =>
        presentation.directSeats + presentation.listSeats ===
        presentation.totalSeats,
    ),
  )
  assert.equal(presentations[1]?.uncoveredDistrictWins, 23)
})
