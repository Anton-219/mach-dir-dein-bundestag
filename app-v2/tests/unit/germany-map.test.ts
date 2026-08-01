import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

import {
  buildGermanyBoundaryPath,
  buildGermanyStatePaths,
  isGermanyStatesGeoJson,
  orderGermanyStatePathsForInteraction,
  type GermanyStateFeature,
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

const interactionFixture: GermanyStatesGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'DE-BB',
        name: 'Brandenburg',
        type: 'State',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [12, 51],
            [14, 51],
            [14, 53],
            [12, 53],
            [12, 51],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'DE-BE',
        name: 'Berlin',
        type: 'State',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [13, 52],
            [13.1, 52],
            [13.1, 52.1],
            [13, 52.1],
            [13, 52],
          ],
        ],
      },
    },
  ],
}

function extractCoordinates(path: string): readonly (readonly [number, number])[] {
  return [...path.matchAll(/(?:M|L)(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(
    (match) => [Number(match[1]), Number(match[2])] as const,
  )
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

  const coordinates = paths.flatMap(({ path }) => extractCoordinates(path))

  assert.equal(coordinates.length > 0, true)
  assert.equal(coordinates.every(([x]) => x >= 0 && x <= 220), true)
  assert.equal(coordinates.every(([, y]) => y >= 0 && y <= 260), true)
  assert.equal(
    paths.every(
      ({ bounds }) =>
        bounds.x >= 0 &&
        bounds.y >= 0 &&
        bounds.x + bounds.width <= 220 &&
        bounds.y + bounds.height <= 260 &&
        bounds.centerX >= bounds.x &&
        bounds.centerX <= bounds.x + bounds.width &&
        bounds.centerY >= bounds.y &&
        bounds.centerY <= bounds.y + bounds.height,
    ),
    true,
  )
})

test('corrects longitude scale for the map central latitude', () => {
  const oneDegreeSquareAtSixtyDegrees: GermanyStateFeature = {
    type: 'Feature',
    properties: {
      id: 'DE-CC',
      name: 'Gamma',
      type: 'State',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [10, 59.5],
          [11, 59.5],
          [11, 60.5],
          [10, 60.5],
          [10, 59.5],
        ],
      ],
    },
  }

  const [statePath] = buildGermanyStatePaths(
    [oneDegreeSquareAtSixtyDegrees],
    { width: 300, height: 300, padding: 0 },
  )
  const coordinates = extractCoordinates(statePath?.path ?? '')
  const xs = coordinates.map(([x]) => x)
  const ys = coordinates.map(([, y]) => y)
  const renderedWidth = Math.max(...xs) - Math.min(...xs)
  const renderedHeight = Math.max(...ys) - Math.min(...ys)

  assert.equal(coordinates.length > 0, true)
  assert.ok(Math.abs(renderedWidth / renderedHeight - 0.5) < 0.01)
})

test('renders boundaries as one shared path element', () => {
  const paths = buildGermanyStatePaths(fixture.features)

  assert.equal(
    buildGermanyBoundaryPath(paths),
    paths.map(({ path }) => path).join(' '),
  )
})

test('places compact states above surrounding states for pointer interaction', () => {
  const paths = buildGermanyStatePaths(interactionFixture.features)
  const berlin = paths.find(({ name }) => name === 'Berlin')
  const brandenburg = paths.find(({ name }) => name === 'Brandenburg')

  assert.equal(berlin?.isCompact, true)
  assert.equal(brandenburg?.isCompact, false)
  assert.deepEqual(
    orderGermanyStatePathsForInteraction(paths).map(({ name }) => name),
    ['Brandenburg', 'Berlin'],
  )
})

test('classifies the city states as compact in the committed map data', () => {
  const rawMap = JSON.parse(
    readFileSync(resolve('public/data/germany_states_map.geo.json'), 'utf8'),
  ) as unknown

  assert.equal(isGermanyStatesGeoJson(rawMap), true)

  if (!isGermanyStatesGeoJson(rawMap)) {
    throw new Error('The committed Germany map data is invalid.')
  }

  const paths = buildGermanyStatePaths(rawMap.features)
  const pathsByName = new Map(paths.map((path) => [path.name, path]))
  const interactionOrder = orderGermanyStatePathsForInteraction(paths).map(
    ({ name }) => name,
  )

  for (const cityState of ['Berlin', 'Bremen', 'Hamburg']) {
    assert.equal(pathsByName.get(cityState)?.isCompact, true)
  }

  assert.ok(interactionOrder.indexOf('Berlin') > interactionOrder.indexOf('Brandenburg'))
  assert.ok(interactionOrder.indexOf('Bremen') > interactionOrder.indexOf('Niedersachsen'))
  assert.ok(
    interactionOrder.indexOf('Hamburg') > interactionOrder.indexOf('Schleswig-Holstein'),
  )
})
