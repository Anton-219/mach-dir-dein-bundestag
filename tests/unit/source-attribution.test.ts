import assert from 'node:assert/strict'
import test from 'node:test'

import {
  englishMessages,
  germanMessages,
} from '../../src/i18n/messages.ts'

test('provides bilingual election-data attribution through the message catalogs', () => {
  const english = englishMessages.electoralSystems.methodology.sourceAttribution
  const german = germanMessages.electoralSystems.methodology.sourceAttribution

  assert.equal(
    english.licenseHref,
    'https://www.govdata.de/dl-de/by-2-0',
  )
  assert.equal(german.licenseHref, english.licenseHref)

  assert.match(english.text, /Federal Returning Officer/)
  assert.match(german.text, /Bundeswahlleiterin/)
  assert.match(english.text, /dl-de\/by-2-0/)
  assert.match(german.text, /dl-de\/by-2-0/)
  assert.match(english.text, /modified/)
  assert.match(german.text, /verändert/)
  assert.match(english.licenseLabel, /dl-de\/by-2-0/)
  assert.match(german.licenseLabel, /dl-de\/by-2-0/)
})
