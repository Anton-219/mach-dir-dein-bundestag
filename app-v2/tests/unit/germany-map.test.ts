import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildGermanyStatePaths,
  isGermanyStatesGeoJson,
  type GermanyStatesGeoJson,
} from '../../src/lib/map/germany-map.ts'

const fixture: GermanyStatesGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'DE-AA',
        name: 'Alpha',
        type: 'State',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [7, 50],
            [8, 50],
            [8, 51],
            [7, 50],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'DE-BB',
        name: 'Beta',
        type: 'State',
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [9, 52],
              [10, 52],
              [10, 53],
              [9, 52],
            ],
          ],
          [
            [
              [10.2, 52.2],
              [10.4, 52.2],
              [10.4, 52.4],
              [10.2, 52.2],
            ],
          ],
        ],
      },
    },
  ],
}

test('validates polygon and multipolygon state features', () => {
  assert.equal(isGermanyStatesGeoJson(fixture), true)
  assert.equal(
    isGermanyStatesGeoJson({
      ...fixture,
      features: [fixture.features[0], fixture.features[0]],
    }),
    false,
  )
})

test('projects every state into a shared bounded SVG coordinate system', () => {
  const paths = buildGermanyStatePaths(fixture.features)

  assert.deepEqual(
    paths.map(({ id, name }) => ({ id, name })),
    [
      { id: 'DE-AA', name: 'Alpha' },
      { id: 'DE-BB', name: 'Beta' },
    ],
  )
  assert.match(paths[0]?.path ?? '', /^M/)
  assert.match(paths[0]?.path ?? '', / Z$/)
  assert.equal((paths[1]?.path.match(/M/g) ?? []).length, 2)

  const coordinates = paths.flatMap(({ path }) =>
    [...path.matchAll(/(?:M|L)(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(
      (match) => [Number(match[1]), Number(match[2])] as const,
    ),
  )

  assert.equal(coordinates.length > 0, true)
  assert.equal(coordinates.every(([x]) => x >= 0 && x <= 220), true)
  assert.equal(coordinates.every(([, y]) => y >= 0 && y <= 260), true)
})
