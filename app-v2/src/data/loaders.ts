import { isGermanyStatesGeoJson } from '../lib/map/germany-map.ts'
import type { GermanyStatesGeoJson } from '../lib/map/germany-map.ts'
import type {
  AgeGroup,
  DirectMandateWinner,
  DirectMandateWinnerJson,
  ElectionMethod,
  Gender,
  Party,
  StatVotes,
  VoteEntry,
  VoteType,
} from '../models/index.ts'

const dataFiles = {
  parties: 'partyData.json',
  secondVotes: 'second_votes.json',
  statVotes: 'stat_votes.json',
  directMandates: 'election_results_direktmandate.json',
  germanyStates: 'germany_states_map.geo.json',
} as const

const germanyStatesMapUrl = new URL(
  '../../../src/data/germany_states_map.geo.json',
  import.meta.url,
).href

const genders = ['m', 'w'] as const satisfies readonly Gender[]
const ageGroups = [
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65+',
] as const satisfies readonly AgeGroup[]
const voteTypes = ['1', '2'] as const satisfies readonly VoteType[]
const electionMethods = [
  'postal',
  'in-person',
] as const satisfies readonly ElectionMethod[]

type JsonFetcher = typeof fetch

type JsonRecord = Record<string, unknown>

export interface ElectionData {
  parties: Party[]
  secondVotes: VoteEntry[]
  statVotes: StatVotes[]
  directMandates: DirectMandateWinner[]
  germanyStates: GermanyStatesGeoJson
}

export class ElectionDataLoadError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ElectionDataLoadError'
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isOneOf<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
): value is T {
  return (
    typeof value === 'string' &&
    (allowedValues as readonly string[]).includes(value)
  )
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

function normalizeVoteEntry(value: unknown): VoteEntry | undefined {
  if (
    !isRecord(value) ||
    typeof value.state !== 'string' ||
    !isOneOf(value.gender, genders) ||
    !isOneOf(value.ageGroup, ageGroups) ||
    typeof value.party !== 'string' ||
    !isOneOf(value.electionMethod, electionMethods) ||
    !isFiniteNumber(value.votes)
  ) {
    return undefined
  }

  let voteType: VoteType
  if (isOneOf(value.voteType, voteTypes)) {
    voteType = value.voteType
  } else if (
    value.state === 'Schleswig-Holstein' &&
    value.party === 'SSW' &&
    value.voteType === value.electionMethod
  ) {
    // The restored legacy file contains 24 appended SSW second-vote records
    // whose voteType accidentally repeats the election method. The old app
    // accepted these through a type assertion. Keep the raw file unchanged and
    // normalize this narrowly identified legacy defect at the data boundary.
    voteType = '2'
  } else {
    return undefined
  }

  return {
    state: value.state,
    gender: value.gender,
    ageGroup: value.ageGroup,
    party: value.party,
    voteType,
    electionMethod: value.electionMethod,
    votes: value.votes,
  }
}

function isStatVotes(value: unknown): value is StatVotes {
  return (
    isRecord(value) &&
    isOneOf(value.gender, genders) &&
    isOneOf(value.ageGroup, ageGroups) &&
    typeof value.party === 'string' &&
    isFiniteNumber(value.votes)
  )
}

function isDirectMandateWinnerJson(
  value: unknown,
): value is DirectMandateWinnerJson {
  return (
    isRecord(value) &&
    typeof value.party === 'string' &&
    isFiniteNumber(value.districts_won)
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
  dataUrl = createDataUrl(fileName),
): Promise<unknown> {
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
      `The election data file ${fileName} does not contain valid JSON.`,
      { cause },
    )
  }
}

export async function loadElectionData(
  fetcher: JsonFetcher = fetch,
): Promise<ElectionData> {
  const [
    partiesJson,
    secondVotesJson,
    statVotesJson,
    directMandatesJson,
    germanyStatesJson,
  ] = await Promise.all([
    fetchJson(dataFiles.parties, fetcher),
    fetchJson(dataFiles.secondVotes, fetcher),
    fetchJson(dataFiles.statVotes, fetcher),
    fetchJson(dataFiles.directMandates, fetcher),
    fetchJson(dataFiles.germanyStates, fetcher, germanyStatesMapUrl),
  ])

  const directMandates = parseArray(
    directMandatesJson,
    dataFiles.directMandates,
    (item) => (isDirectMandateWinnerJson(item) ? item : undefined),
  ).map(({ party, districts_won }) => ({
    party,
    districtsWon: districts_won,
  }))

  if (!isGermanyStatesGeoJson(germanyStatesJson)) {
    throw new ElectionDataLoadError(
      `${dataFiles.germanyStates} does not contain a valid state FeatureCollection.`,
    )
  }

  return {
    parties: parseArray(partiesJson, dataFiles.parties, (item) =>
      isParty(item) ? item : undefined,
    ),
    secondVotes: parseArray(
      secondVotesJson,
      dataFiles.secondVotes,
      normalizeVoteEntry,
    ),
    statVotes: parseArray(statVotesJson, dataFiles.statVotes, (item) =>
      isStatVotes(item) ? item : undefined,
    ),
    directMandates,
    germanyStates: germanyStatesJson,
  }
}
