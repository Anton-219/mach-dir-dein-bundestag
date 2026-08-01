export type GeoPosition = readonly [longitude: number, latitude: number]
export type LinearRing = readonly GeoPosition[]
export type PolygonCoordinates = readonly LinearRing[]
export type MultiPolygonCoordinates = readonly PolygonCoordinates[]
type ProjectedPosition = readonly [x: number, y: number]

export interface GermanyStateProperties {
  id: string
  name: string
  type: string
}

export type GermanyStateGeometry =
  | {
      type: 'Polygon'
      coordinates: PolygonCoordinates
    }
  | {
      type: 'MultiPolygon'
      coordinates: MultiPolygonCoordinates
    }

export interface GermanyStateFeature {
  type: 'Feature'
  id?: string | number
  properties: GermanyStateProperties
  geometry: GermanyStateGeometry
}

export interface GermanyStatesGeoJson {
  type: 'FeatureCollection'
  features: readonly GermanyStateFeature[]
}

export interface GermanyStatePathBounds {
  x: number
  y: number
  width: number
  height: number
  centerX: number
  centerY: number
  area: number
}

export interface GermanyStatePath {
  id: string
  name: string
  path: string
  bounds: GermanyStatePathBounds
  isCompact: boolean
}

interface MapSize {
  width: number
  height: number
  padding: number
}

const defaultMapSize: MapSize = {
  width: 220,
  height: 260,
  padding: 8,
}

const compactStateMaximumDimension = 18

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPosition(value: unknown): value is GeoPosition {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    Number.isFinite(value[0]) &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[1])
  )
}

function isLinearRing(value: unknown): value is LinearRing {
  return Array.isArray(value) && value.length >= 4 && value.every(isPosition)
}

function isPolygonCoordinates(value: unknown): value is PolygonCoordinates {
  return Array.isArray(value) && value.length > 0 && value.every(isLinearRing)
}

function isMultiPolygonCoordinates(value: unknown): value is MultiPolygonCoordinates {
  return Array.isArray(value) && value.length > 0 && value.every(isPolygonCoordinates)
}

function isGermanyStateFeature(value: unknown): value is GermanyStateFeature {
  if (!isRecord(value) || value.type !== 'Feature') {
    return false
  }

  const properties = value.properties
  const geometry = value.geometry

  if (
    !isRecord(properties) ||
    typeof properties.id !== 'string' ||
    typeof properties.name !== 'string' ||
    typeof properties.type !== 'string' ||
    !isRecord(geometry)
  ) {
    return false
  }

  return (
    (geometry.type === 'Polygon' && isPolygonCoordinates(geometry.coordinates)) ||
    (geometry.type === 'MultiPolygon' &&
      isMultiPolygonCoordinates(geometry.coordinates))
  )
}

export function isGermanyStatesGeoJson(value: unknown): value is GermanyStatesGeoJson {
  if (!isRecord(value) || value.type !== 'FeatureCollection') {
    return false
  }

  if (
    !Array.isArray(value.features) ||
    value.features.length === 0 ||
    !value.features.every(isGermanyStateFeature)
  ) {
    return false
  }

  const names = value.features.map((feature) => feature.properties.name)
  return new Set(names).size === names.length
}

function getPolygons(feature: GermanyStateFeature): readonly PolygonCoordinates[] {
  return feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates
}

function getPositions(features: readonly GermanyStateFeature[]): GeoPosition[] {
  return features.flatMap((feature) =>
    getPolygons(feature).flatMap((polygon) =>
      polygon.flatMap((ring) => [...ring]),
    ),
  )
}

function buildBounds(positions: readonly ProjectedPosition[]): GermanyStatePathBounds {
  const xs = positions.map(([x]) => x)
  const ys = positions.map(([, y]) => y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)
  const width = maxX - x
  const height = maxY - y

  return {
    x,
    y,
    width,
    height,
    centerX: x + width / 2,
    centerY: y + height / 2,
    area: width * height,
  }
}

function formatCoordinate(value: number): string {
  return Number(value.toFixed(2)).toString()
}

export function buildGermanyStatePaths(
  features: readonly GermanyStateFeature[],
  size: MapSize = defaultMapSize,
): GermanyStatePath[] {
  const positions = getPositions(features)

  if (positions.length === 0) {
    return []
  }

  const longitudes = positions.map(([longitude]) => longitude)
  const latitudes = positions.map(([, latitude]) => latitude)
  const minLongitude = Math.min(...longitudes)
  const maxLongitude = Math.max(...longitudes)
  const minLatitude = Math.min(...latitudes)
  const maxLatitude = Math.max(...latitudes)
  const longitudeSpan = maxLongitude - minLongitude
  const latitudeSpan = maxLatitude - minLatitude
  const centralLatitude = (minLatitude + maxLatitude) / 2
  const longitudeScale = Math.cos((centralLatitude * Math.PI) / 180)
  const projectedLongitudeSpan = longitudeSpan * longitudeScale

  if (projectedLongitudeSpan <= 0 || latitudeSpan <= 0) {
    return []
  }

  const availableWidth = size.width - size.padding * 2
  const availableHeight = size.height - size.padding * 2
  const scale = Math.min(
    availableWidth / projectedLongitudeSpan,
    availableHeight / latitudeSpan,
  )
  const renderedWidth = projectedLongitudeSpan * scale
  const renderedHeight = latitudeSpan * scale
  const offsetX = (size.width - renderedWidth) / 2
  const offsetY = (size.height - renderedHeight) / 2

  const project = ([longitude, latitude]: GeoPosition): ProjectedPosition => [
    offsetX + (longitude - minLongitude) * longitudeScale * scale,
    offsetY + (maxLatitude - latitude) * scale,
  ]

  return features.map((feature) => {
    const projectedPolygons = getPolygons(feature).map((polygon) =>
      polygon.map((ring) => ring.map(project)),
    )
    const projectedPositions = projectedPolygons.flatMap((polygon) =>
      polygon.flatMap((ring) => ring),
    )
    const bounds = buildBounds(projectedPositions)
    const path = projectedPolygons
      .flatMap((polygon) =>
        polygon.map((ring) => {
          const commands = ring.map(([x, y], index) => {
            const command = index === 0 ? 'M' : 'L'
            return `${command}${formatCoordinate(x)} ${formatCoordinate(y)}`
          })

          return `${commands.join(' ')} Z`
        }),
      )
      .join(' ')

    return {
      id: feature.properties.id,
      name: feature.properties.name,
      path,
      bounds,
      isCompact: Math.max(bounds.width, bounds.height) < compactStateMaximumDimension,
    }
  })
}

export function buildGermanyBoundaryPath(
  statePaths: readonly GermanyStatePath[],
): string {
  return statePaths.map(({ path }) => path).join(' ')
}

export function orderGermanyStatePathsForInteraction(
  statePaths: readonly GermanyStatePath[],
): GermanyStatePath[] {
  return [...statePaths].sort(
    (left, right) => right.bounds.area - left.bounds.area || left.name.localeCompare(right.name),
  )
}
