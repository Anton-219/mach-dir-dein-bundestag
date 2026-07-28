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

function isVoteEntry(value: unknown): value is VoteEntry {
  return (
    isRecord(value) &&
    typeof value.state === 'string' &&
    isOneOf(value.gender, genders) &&
    isOneOf(value.ageGroup, ageGroups) &&
    typeof value.party === 'string' &&
    isOneOf(value.voteType, voteTypes) &&
    isOneOf(value.electionMethod, electionMethods) &&
    isFiniteNumber(value.votes)
  )
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
  isItem: (item: unknown) => item is T,
): T[] {
  if (!Array.isArray(value)) {
    throw new ElectionDataLoadError(
      `${fileName} must contain a top-level JSON array.`,
    )
  }

  const invalidIndex = value.findIndex((item) => !isItem(item))
  if (invalidIndex !== -1) {
    throw new ElectionDataLoadError(
      `${fileName} contains an invalid record at index ${invalidIndex}.`,
    )
  }

  return value
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

export async function loadElectionData(
  fetcher: JsonFetcher = fetch,
): Promise<ElectionData> {
  const [partiesJson, secondVotesJson, statVotesJson, directMandatesJson] =
    await Promise.all([
      fetchJson(dataFiles.parties, fetcher),
      fetchJson(dataFiles.secondVotes, fetcher),
      fetchJson(dataFiles.statVotes, fetcher),
      fetchJson(dataFiles.directMandates, fetcher),
    ])

  const directMandates = parseArray(
    directMandatesJson,
    dataFiles.directMandates,
    isDirectMandateWinnerJson,
  ).map(({ party, districts_won }) => ({
    party,
    districtsWon: districts_won,
  }))

  return {
    parties: parseArray(partiesJson, dataFiles.parties, isParty),
    secondVotes: parseArray(
      secondVotesJson,
      dataFiles.secondVotes,
      isVoteEntry,
    ),
    statVotes: parseArray(statVotesJson, dataFiles.statVotes, isStatVotes),
    directMandates,
  }
}
