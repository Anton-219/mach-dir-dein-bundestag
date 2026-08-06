import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getElectoralSystemOptions,
} from '../../src/i18n/electoral-system-messages.ts'
import {
  englishMessages,
  germanMessages,
} from '../../src/i18n/messages.ts'
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

test('offers all selectable electoral systems from both central message catalogs', () => {
  const englishOptions = getElectoralSystemOptions('en')
  const germanOptions = getElectoralSystemOptions('de')
  const expectedSystemIds = [
    'de-2021-bwahlg',
    'de-2023-fixed-630',
    'union-parallel',
  ]

  assert.deepEqual(
    Object.keys(englishMessages.electoralSystems.models),
    expectedSystemIds,
  )
  assert.deepEqual(
    Object.keys(germanMessages.electoralSystems.models),
    expectedSystemIds,
  )
  assert.deepEqual(
    englishOptions.map((option) => option.systemId),
    expectedSystemIds,
  )
  assert.deepEqual(
    germanOptions.map((option) => option.systemId),
    expectedSystemIds,
  )
  assert.equal(
    englishOptions[0]?.name,
    englishMessages.electoralSystems.models['de-2021-bwahlg'].name,
  )
  assert.equal(
    germanOptions[0]?.name,
    germanMessages.electoralSystems.models['de-2021-bwahlg'].name,
  )
})

test('provides complete bilingual methodology assumptions and official sources', () => {
  for (const catalog of [englishMessages, germanMessages]) {
    const methodology = catalog.electoralSystems.methodology

    assert.ok(catalog.footer.text.length > 0)
    assert.ok(methodology.introduction.length > 0)
    assert.ok(methodology.scenarioAssumptions.length >= 5)
    assert.ok(methodology.dataPreparationItems.length >= 5)
    assert.ok(methodology.majorityText.length > 0)
    assert.ok(methodology.calculationText.length > 0)
    assert.ok(methodology.historicalSeatGrowthParagraphs.length >= 3)
    assert.ok(methodology.sources.length >= 6)
    assert.ok(
      methodology.sources.every(
        (source) =>
          source.label.length > 0 &&
          source.description.length > 0 &&
          source.href.startsWith('https://'),
      ),
    )
  }

  assert.match(englishMessages.footer.text, /browser/i)
  assert.match(germanMessages.footer.text, /Browser/)
  assert.deepEqual(
    englishMessages.electoralSystems.methodology.sources.map(
      (source) => source.href,
    ),
    germanMessages.electoralSystems.methodology.sources.map(
      (source) => source.href,
    ),
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
