import assert from 'node:assert/strict'
import test from 'node:test'

import { getSourceAttribution } from '../../src/i18n/source-attribution.ts'

test('provides bilingual election-data attribution and transformation notice', () => {
  const english = getSourceAttribution('en')
  const german = getSourceAttribution('de')

  assert.equal(
    english.licenseHref,
    'https://www.govdata.de/dl-de/by-2-0',
  )
  assert.equal(german.licenseHref, english.licenseHref)

  assert.match(english.beforeLicense, /Federal Returning Officer/)
  assert.match(german.beforeLicense, /Bundeswahlleiterin/)
  assert.match(english.licenseLabel, /dl-de\/by-2-0/)
  assert.match(german.licenseLabel, /dl-de\/by-2-0/)
  assert.match(english.afterLicense, /modified/)
  assert.match(german.afterLicense, /verändert/)
})
