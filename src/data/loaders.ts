import { isGermanyStatesGeoJson } from '../lib/map/germany-map.ts'
import type { GermanyStatesGeoJson } from '../lib/map/germany-map.ts'
import {
  decodeBinaryVoteEntries,
  parseVoteDataManifest,
  type VoteBinaryFileMetadata,
} from '../lib/data/binary-vote-format.ts'
import type { Party, VoteEntry, VoteType } from '../models/index.ts'
import {
  DEFAULT_ELECTION_YEAR,
  type ElectionYear,
} from './elections.ts'

const sharedDataFiles = {
  parties: 'partyData.json',
  germanyStates: 'germany_states_map.geo.json',
} as const

interface ElectionDataFiles {
  voteManifest: string
  firstVotes: string
  secondVotes: string
  stateSeatContingents: string
}

const electionDataFiles: Readonly<Record<ElectionYear, ElectionDataFiles>> = {
  2021: {
    voteManifest: 'btw2021/vote_data.json',
    firstVotes: 'btw2021/first_votes.bin',
    secondVotes: 'btw2021/second_votes.bin',
    stateSeatContingents: 'state_seat_contingents_2021.json',
  },
  2025: {
    voteManifest: 'btw2025/vote_data.json',
    firstVotes: 'btw2025/first_votes.bin',
    secondVotes: 'btw2025/second_votes.bin',
    stateSeatContingents: 'state_seat_contingents_2025.json',
  },
}

const HISTORICAL_STATE_SEAT_CONTINGENT_SCHEMA_VERSION = 1
const HISTORICAL_STATE_SEAT_COUNT = 598

type JsonFetcher = typeof fetch
type JsonRecord = Record<string, unknown>

export interface ElectionData {
  electionYear: ElectionYear
  parties: Party[]
  firstVotes: VoteEntry[]
  secondVotes: VoteEntry[]
  germanyStates: GermanyStatesGeoJson
  stateSeatContingents: Readonly<Record<string, number>>
  stateSeatContingentYear: number
}

export class ElectionDataLoadError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ElectionDataLoadError'
  }
}

export function getElectionDataFiles(
  electionYear: ElectionYear,
): Readonly<ElectionDataFiles> {
  return electionDataFiles[electionYear]
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isParty(value: unknown): value is Party {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.abbreviation === 'string' &&
    typeof value.color === 'string' &&
    isFiniteNumber(value.seatPosition)
  )
}

function parseArray<T>(
  value: unknown,
  fileName: string,
  parseItem: (item: unknown) => T | undefined,
): T[] {
  if (!Array.isArray(value)) {
    throw new ElectionDataLoadError(
      `${fileName} must contain a top-level JSON array.`,
    )
  }

  const parsedItems = value.map(parseItem)
  const invalidIndex = parsedItems.findIndex((item) => item === undefined)
  if (invalidIndex !== -1) {
    throw new ElectionDataLoadError(
      `${fileName} contains an invalid record at index ${invalidIndex}.`,
    )
  }

  return parsedItems as T[]
}

function createDataUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}data/${fileName}`
}

async function fetchJson(
  fileName: string,
  fetcher: JsonFetcher,
): Promise<unknown> {
  const dataUrl = createDataUrl(fileName)
  let response: Response

  try {
    response = await fetcher(dataUrl)
  } catch (cause) {
    throw new ElectionDataLoadError(
      `The election data file ${fileName} could not be requested.`,
      { cause },
    )
  }

  if (!response.ok) {
    throw new ElectionDataLoadError(
      `The election data file ${fileName} is missing or unavailable (HTTP ${response.status}).`,
    )
  }

  try {
    const json: unknown = await response.json()
    return json
  } catch (cause) {
    throw new ElectionDataLoadError(
      `${fileName} does not contain valid JSON.`,
      { cause },
    )
  }
}

async function fetchBinary(
  fileName: string,
  fetcher: JsonFetcher,
): Promise<ArrayBuffer> {
  const dataUrl = createDataUrl(fileName)
  let response: Response

  try {
    response = await fetcher(dataUrl)
  } catch (cause) {
    throw new ElectionDataLoadError(
      `The election data file ${fileName} could not be requested.`,
      { cause },
    )
  }

  if (!response.ok) {
    throw new ElectionDataLoadError(
      `The election data file ${fileName} is missing or unavailable (HTTP ${response.status}).`,
    )
  }

  try {
    return await response.arrayBuffer()
  } catch (cause) {
    throw new ElectionDataLoadError(
      `${fileName} does not contain readable binary data.`,
      { cause },
    )
  }
}

function basename(path: string): string {
  const separatorIndex = path.lastIndexOf('/')
  return separatorIndex === -1 ? path : path.slice(separatorIndex + 1)
}

function decodeVoteFile(
  buffer: ArrayBuffer,
  metadata: VoteBinaryFileMetadata,
  expectedVoteType: VoteType,
  fileName: string,
): VoteEntry[] {
  if (metadata.file !== basename(fileName)) {
    throw new ElectionDataLoadError(
      `${fileName} does not match the file declared by the vote-data manifest.`,
    )
  }

  try {
    return decodeBinaryVoteEntries(
      buffer,
      metadata,
      expectedVoteType,
      fileName,
    )
  } catch (cause) {
    throw new ElectionDataLoadError(
      `${fileName} does not contain valid binary vote data.`,
      { cause },
    )
  }
}

function collectDistrictStates(
  entries: readonly VoteEntry[],
  fileName: string,
): Map<number, string> {
  const statesByDistrict = new Map<number, string>()

  for (const entry of entries) {
    const existingState = statesByDistrict.get(entry.districtId)
    if (existingState !== undefined && existingState !== entry.state) {
      throw new ElectionDataLoadError(
        `${fileName} assigns district ${entry.districtId} to both ${existingState} and ${entry.state}.`,
      )
    }
    statesByDistrict.set(entry.districtId, entry.state)
  }

  return statesByDistrict
}

function verifyDistrictCoverage(
  firstVotes: readonly VoteEntry[],
  secondVotes: readonly VoteEntry[],
  files: Readonly<ElectionDataFiles>,
): void {
  const firstVoteDistricts = collectDistrictStates(firstVotes, files.firstVotes)
  const secondVoteDistricts = collectDistrictStates(
    secondVotes,
    files.secondVotes,
  )
  const firstOnly = [...firstVoteDistricts.keys()].filter(
    (districtId) => !secondVoteDistricts.has(districtId),
  )
  const secondOnly = [...secondVoteDistricts.keys()].filter(
    (districtId) => !firstVoteDistricts.has(districtId),
  )
  const conflictingStates = [...firstVoteDistricts].filter(
    ([districtId, state]) =>
      secondVoteDistricts.has(districtId) &&
      secondVoteDistricts.get(districtId) !== state,
  )

  if (
    firstOnly.length === 0 &&
    secondOnly.length === 0 &&
    conflictingStates.length === 0
  ) {
    return
  }

  throw new ElectionDataLoadError(
    `${files.firstVotes} and ${files.secondVotes} do not contain the same constituency-to-state coverage.`,
  )
}

function verifyStateCoverage(
  firstVotes: readonly VoteEntry[],
  secondVotes: readonly VoteEntry[],
  germanyStates: GermanyStatesGeoJson,
): void {
  const firstVoteStates = new Set(firstVotes.map((entry) => entry.state))
  const secondVoteStates = new Set(secondVotes.map((entry) => entry.state))
  const mapStateNames = new Set(
    germanyStates.features.map((feature) => feature.properties.name),
  )
  const voteStateNames = new Set([...firstVoteStates, ...secondVoteStates])
  const inconsistentVoteStates = [...voteStateNames].filter(
    (state) => !firstVoteStates.has(state) || !secondVoteStates.has(state),
  )
  const statesMissingFromMap = [...voteStateNames].filter(
    (state) => !mapStateNames.has(state),
  )
  const statesMissingFromVotes = [...mapStateNames].filter(
    (state) => !voteStateNames.has(state),
  )

  if (
    inconsistentVoteStates.length === 0 &&
    statesMissingFromMap.length === 0 &&
    statesMissingFromVotes.length === 0
  ) {
    return
  }

  const details = [
    inconsistentVoteStates.length > 0
      ? `first- and second-vote state coverage differs for ${inconsistentVoteStates.join(', ')}`
      : undefined,
    statesMissingFromMap.length > 0
      ? `missing map geometry for ${statesMissingFromMap.join(', ')}`
      : undefined,
    statesMissingFromVotes.length > 0
      ? `map states without vote data: ${statesMissingFromVotes.join(', ')}`
      : undefined,
  ]
    .filter((detail): detail is string => detail !== undefined)
    .join('; ')

  throw new ElectionDataLoadError(
    `The prepared vote files do not match ${sharedDataFiles.germanyStates}: ${details}.`,
  )
}

function parseStateSeatContingents(
  value: unknown,
  fileName: string,
  electionYear: ElectionYear,
  germanyStates: GermanyStatesGeoJson,
): {
  stateSeatContingents: Readonly<Record<string, number>>
  stateSeatContingentYear: number
} {
  if (
    !isRecord(value) ||
    value.schemaVersion !== HISTORICAL_STATE_SEAT_CONTINGENT_SCHEMA_VERSION ||
    value.systemId !== 'de-2021-bwahlg' ||
    value.electionYear !== electionYear ||
    value.baseSeatCount !== HISTORICAL_STATE_SEAT_COUNT ||
    !Array.isArray(value.stateSeatContingents)
  ) {
    throw new ElectionDataLoadError(
      `${fileName} has invalid fixture metadata.`,
    )
  }

  const expectedStates = new Set(
    germanyStates.features.map((feature) => feature.properties.name),
  )
  if (value.stateSeatContingents.length !== expectedStates.size) {
    throw new ElectionDataLoadError(
      `${fileName} must contain every federal state exactly once.`,
    )
  }

  const stateSeatContingents: Record<string, number> = {}
  let totalSeats = 0
  for (const entry of value.stateSeatContingents) {
    if (
      !isRecord(entry) ||
      typeof entry.state !== 'string' ||
      !expectedStates.has(entry.state) ||
      typeof entry.seats !== 'number' ||
      !Number.isInteger(entry.seats) ||
      entry.seats < 0 ||
      stateSeatContingents[entry.state] !== undefined
    ) {
      throw new ElectionDataLoadError(
        `${fileName} contains an invalid or duplicate state entry.`,
      )
    }
    stateSeatContingents[entry.state] = entry.seats
    totalSeats += entry.seats
  }

  const missingStates = [...expectedStates].filter(
    (state) => stateSeatContingents[state] === undefined,
  )
  if (missingStates.length > 0 || totalSeats !== HISTORICAL_STATE_SEAT_COUNT) {
    throw new ElectionDataLoadError(
      `${fileName} must contain all 16 states and add up to 598 seats.`,
    )
  }

  return {
    stateSeatContingents,
    stateSeatContingentYear: electionYear,
  }
}

export async function loadElectionData(
  electionYear: ElectionYear = DEFAULT_ELECTION_YEAR,
  fetcher: JsonFetcher = fetch,
): Promise<ElectionData> {
  const files = getElectionDataFiles(electionYear)
  const [
    partiesJson,
    voteManifestJson,
    firstVotesBinary,
    secondVotesBinary,
    germanyStatesJson,
    stateSeatContingentsJson,
  ] = await Promise.all([
    fetchJson(sharedDataFiles.parties, fetcher),
    fetchJson(files.voteManifest, fetcher),
    fetchBinary(files.firstVotes, fetcher),
    fetchBinary(files.secondVotes, fetcher),
    fetchJson(sharedDataFiles.germanyStates, fetcher),
    fetchJson(files.stateSeatContingents, fetcher),
  ])

  let voteManifest
  try {
    voteManifest = parseVoteDataManifest(voteManifestJson, files.voteManifest)
  } catch (cause) {
    throw new ElectionDataLoadError(
      `${files.voteManifest} does not contain valid binary vote metadata.`,
      { cause },
    )
  }

  const firstVotes = decodeVoteFile(
    firstVotesBinary,
    voteManifest.files.firstVotes,
    '1',
    files.firstVotes,
  )
  const secondVotes = decodeVoteFile(
    secondVotesBinary,
    voteManifest.files.secondVotes,
    '2',
    files.secondVotes,
  )

  if (!isGermanyStatesGeoJson(germanyStatesJson)) {
    throw new ElectionDataLoadError(
      `${sharedDataFiles.germanyStates} does not contain a valid state FeatureCollection.`,
    )
  }

  verifyDistrictCoverage(firstVotes, secondVotes, files)
  verifyStateCoverage(firstVotes, secondVotes, germanyStatesJson)
  const historicalStateSeatContingents = parseStateSeatContingents(
    stateSeatContingentsJson,
    files.stateSeatContingents,
    electionYear,
    germanyStatesJson,
  )

  return {
    electionYear,
    parties: parseArray(partiesJson, sharedDataFiles.parties, (item) =>
      isParty(item) ? item : undefined,
    ),
    firstVotes,
    secondVotes,
    germanyStates: germanyStatesJson,
    ...historicalStateSeatContingents,
  }
}
