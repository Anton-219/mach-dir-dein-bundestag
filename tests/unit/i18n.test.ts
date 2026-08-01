import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createTranslationTools,
  describeGenderSelection,
  describeStateSelection,
  summarizeFilterState,
} from '../../src/i18n/formatters.ts'
import {
  readStorageValue,
  writeStorageValue,
  type KeyValueStorage,
} from '../../src/i18n/storage.ts'
import type { FilterState } from '../../src/lib/filters/filter-state.ts'

const emptyFilters: FilterState = {
  states: [],
  ageGroups: [],
  genders: [],
  electionMethods: [],
}

test('provides complete German and English presentation tools', () => {
  const german = createTranslationTools('de')
  const english = createTranslationTools('en')

  assert.equal(german.messages.header.title, 'Mach dir deinen Bundestag')
  assert.equal(english.messages.header.title, 'Build Your Bundestag')
  assert.equal(german.stateName('Bayern'), 'Bayern')
  assert.equal(english.stateName('Bayern'), 'Bavaria')
  assert.equal(
    summarizeFilterState(emptyFilters, german),
    'Alle Wählerstimmen in Deutschland',
  )
  assert.equal(
    summarizeFilterState(emptyFilters, english),
    'All voters in Germany',
  )
})

test('localizes dynamic filter summaries', () => {
  const german = createTranslationTools('de')
  const english = createTranslationTools('en')

  assert.equal(
    describeStateSelection(['Bayern', 'Thüringen'], english),
    'Bavaria and Thuringia excluded',
  )
  assert.equal(
    describeStateSelection(['Bayern', 'Thüringen'], german),
    'Bayern und Thüringen ausgeschlossen',
  )
  assert.equal(describeGenderSelection(['w'], english), 'Women excluded')
  assert.equal(describeGenderSelection(['w'], german), 'Frauen ausgeschlossen')
})

test('uses locale-specific number and percentage formatting', () => {
  const german = createTranslationTools('de')
  const english = createTranslationTools('en')

  assert.equal(german.formatNumber(1234567), '1.234.567')
  assert.equal(english.formatNumber(1234567), '1,234,567')
  assert.match(german.formatPercent(0.125), /12,5/)
  assert.match(english.formatPercent(0.125), /12\.5/)
})

test('tolerates unavailable locale storage', () => {
  const throwingStorage: KeyValueStorage = {
    getItem: () => {
      throw new Error('Storage blocked')
    },
    setItem: () => {
      throw new Error('Storage blocked')
    },
  }

  assert.equal(
    readStorageValue(() => {
      throw new Error('Storage unavailable')
    }, 'locale'),
    null,
  )
  assert.equal(readStorageValue(() => throwingStorage, 'locale'), null)
  assert.doesNotThrow(() =>
    writeStorageValue(() => throwingStorage, 'locale', 'de'),
  )
})
