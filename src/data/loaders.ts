import { isGermanyStatesGeoJson } from '../lib/map/germany-map.ts'
import type { GermanyStatesGeoJson } from '../lib/map/germany-map.ts'
import type {
  AgeGroup,
  ElectionMethod,
  Gender,
  Party,
  StatVotes,
  VoteEntry,
  VoteType,
} from '../models/index.ts'

const dataFiles = {
  parties: 'partyData.json',
  firstVotes: 'first_votes.json',
  secondVotes: 'second_votes.json',
  statVotes: 'stat_votes.json',
  germanyStates: 'germany_states_map.geo.json',
} as const

const genders = ['m', 'w'] as const satisfies readonly Gender[]
const ageGroups = [
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65+',
] as const satisfies readonly AgeGroup[]
const electionMethods = [
  'postal',
  'in-person',
] as const satisfies readonly ElectionMethod[]

type JsonFetcher = typeof fetch

type JsonRecord = Record<string, unknown>

export interface ElectionData {
  parties: Party[]
  firstVotes: VoteEntry[]
  secondVotes: VoteEntry[]
  statVotes: StatVotes[]
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

function normalizeVoteEntry(
  value: unknown,
  expectedVoteType: VoteType,
): VoteEntry | undefined {
  if (
    !isRecord(value) ||
    !Number.isInteger(value.districtId) ||
    (value.districtId as number) <= 0 ||
    typeof value.state !== 'string' ||
    !isOneOf(value.gender, genders) ||
    !isOneOf(value.ageGroup, ageGroups) ||
    typeof value.party !== 'string' ||
    value.voteType !== expectedVoteType ||
    !isOneOf(value.electionMethod, electionMethods) ||
    !isFiniteNumber(value.votes)
  ) {
    return undefined
  }

  return {
    districtId: value.districtId as number,
    state: value.state,
    gender: value.gender,
    ageGroup: value.ageGroup,
    party: value.party,
    voteType: expectedVoteType,
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

function parseVoteEntries(
  value: unknown,
  fileName: string,
  expectedVoteType: VoteType,
): VoteEntry[] {
  return parseArray(value, fileName, (item) =>
    normalizeVoteEntry(item, expectedVoteType),
  )
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
      `The election data file ${fileName} does not contain valid JSON.`,
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
): void {
  const firstVoteDistricts = collectDistrictStates(firstVotes, dataFiles.firstVotes)
  const secondVoteDistricts = collectDistrictStates(
    secondVotes,
    dataFiles.secondVotes,
  )
  const firstOnly = [...firstVoteDistricts.keys()].filter(
    (districtId) => !secondVoteDistricts.has(districtId),
  )
  const secondOnly = [...secondVoteDistricts.keys()].filter(
    (districtId) => !firstVoteDistricts.has(districtId),
  )
  const conflictingStates = [...firstVoteDistricts].filter(
    ([districtId, state]) => secondVoteDistricts.get(districtId) !== state,
  )

  if (
    firstOnly.length === 0 &&
    secondOnly.length === 0 &&
    conflictingStates.length === 0
  ) {
    return
  }

  throw new ElectionDataLoadError(
    `${dataFiles.firstVotes} and ${dataFiles.secondVotes} do not contain the same constituency-to-state coverage.`,
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
    `The prepared vote files do not match ${dataFiles.germanyStates}: ${details}.`,
  )
}

export async function loadElectionData(
  fetcher: JsonFetcher = fetch,
): Promise<ElectionData> {
  const [
    partiesJson,
    firstVotesJson,
    secondVotesJson,
    statVotesJson,
    germanyStatesJson,
  ] = await Promise.all([
    fetchJson(dataFiles.parties, fetcher),
    fetchJson(dataFiles.firstVotes, fetcher),
    fetchJson(dataFiles.secondVotes, fetcher),
    fetchJson(dataFiles.statVotes, fetcher),
    fetchJson(dataFiles.germanyStates, fetcher),
  ])

  const firstVotes = parseVoteEntries(
    firstVotesJson,
    dataFiles.firstVotes,
    '1',
  )
  const secondVotes = parseVoteEntries(
    secondVotesJson,
    dataFiles.secondVotes,
    '2',
  )

  if (!isGermanyStatesGeoJson(germanyStatesJson)) {
    throw new ElectionDataLoadError(
      `${dataFiles.germanyStates} does not contain a valid state FeatureCollection.`,
    )
  }

  verifyDistrictCoverage(firstVotes, secondVotes)
  verifyStateCoverage(firstVotes, secondVotes, germanyStatesJson)

  return {
    parties: parseArray(partiesJson, dataFiles.parties, (item) =>
      isParty(item) ? item : undefined,
    ),
    firstVotes,
    secondVotes,
    statVotes: parseArray(statVotesJson, dataFiles.statVotes, (item) =>
      isStatVotes(item) ? item : undefined,
    ),
    germanyStates: germanyStatesJson,
  }
}
