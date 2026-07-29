export type GeoPosition = readonly [longitude: number, latitude: number]
export type LinearRing = readonly GeoPosition[]
export type PolygonCoordinates = readonly LinearRing[]
export type MultiPolygonCoordinates = readonly PolygonCoordinates[]

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

export interface GermanyStatePath {
  id: string
  name: string
  path: string
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

  if (longitudeSpan <= 0 || latitudeSpan <= 0) {
    return []
  }

  const availableWidth = size.width - size.padding * 2
  const availableHeight = size.height - size.padding * 2
  const scale = Math.min(
    availableWidth / longitudeSpan,
    availableHeight / latitudeSpan,
  )
  const renderedWidth = longitudeSpan * scale
  const renderedHeight = latitudeSpan * scale
  const offsetX = (size.width - renderedWidth) / 2
  const offsetY = (size.height - renderedHeight) / 2

  const project = ([longitude, latitude]: GeoPosition): readonly [number, number] => [
    offsetX + (longitude - minLongitude) * scale,
    offsetY + (maxLatitude - latitude) * scale,
  ]

  return features.map((feature) => {
    const path = getPolygons(feature)
      .flatMap((polygon) =>
        polygon.map((ring) => {
          const commands = ring.map((position, index) => {
            const [x, y] = project(position)
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
    }
  })
}
