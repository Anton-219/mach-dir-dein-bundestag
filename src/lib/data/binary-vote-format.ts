import type {
  AgeGroup,
  ElectionMethod,
  Gender,
  VoteEntry,
  VoteType,
} from '../../models/json-contracts.ts'

export const BINARY_VOTE_SCHEMA_VERSION = 1
export const BINARY_VOTE_FORMAT = 'mdb-vote-columnar'
export const BINARY_VOTE_HEADER_BYTES = 32

const BINARY_VOTE_MAGIC = new Uint8Array([77, 68, 66, 86, 79, 84, 69, 0])
const GENDERS = ['m', 'w'] as const satisfies readonly Gender[]
const AGE_GROUPS = [
  '18-24',
  '25-34',
  '35-44',
  '45-59',
  '60-69',
  '70+',
] as const satisfies readonly AgeGroup[]
const ELECTION_METHODS = [
  'postal',
  'in-person',
] as const satisfies readonly ElectionMethod[]
const GROUP_COUNT = GENDERS.length * AGE_GROUPS.length * ELECTION_METHODS.length

export interface VoteBinaryFileMetadata {
  file: string
  voteType: VoteType
  recordCount: number
  byteLength: number
  parties: string[]
  districtStates: Array<string | null>
  sourceSha256: string
  binarySha256: string
}

export interface VoteDataManifest {
  schemaVersion: number
  format: string
  genders: Gender[]
  ageGroups: AgeGroup[]
  electionMethods: ElectionMethod[]
  files: {
    firstVotes: VoteBinaryFileMetadata
    secondVotes: VoteBinaryFileMetadata
  }
}

export interface BinaryVoteColumns {
  districtIds: Uint16Array
  partyIds: Uint16Array
  groupIds: Uint8Array
  votes: Float64Array
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function arraysEqual<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function parseFileMetadata(
  value: unknown,
  expectedVoteType: VoteType,
  label: string,
): VoteBinaryFileMetadata {
  if (!isRecord(value)) {
    throw new Error(`${label} metadata must be an object.`)
  }

  const districtStates = value.districtStates
  if (
    typeof value.file !== 'string' ||
    value.file.length === 0 ||
    value.file.includes('/') ||
    value.file.includes('\\') ||
    value.voteType !== expectedVoteType ||
    typeof value.recordCount !== 'number' ||
    !Number.isInteger(value.recordCount) ||
    value.recordCount < 0 ||
    typeof value.byteLength !== 'number' ||
    !Number.isInteger(value.byteLength) ||
    value.byteLength < BINARY_VOTE_HEADER_BYTES ||
    !isStringArray(value.parties) ||
    !Array.isArray(districtStates) ||
    districtStates.some(
      (state) => state !== null && (typeof state !== 'string' || state.length === 0),
    ) ||
    !isSha256(value.sourceSha256) ||
    !isSha256(value.binarySha256)
  ) {
    throw new Error(`${label} metadata is invalid.`)
  }

  return {
    file: value.file,
    voteType: expectedVoteType,
    recordCount: value.recordCount,
    byteLength: value.byteLength,
    parties: value.parties,
    districtStates: districtStates as Array<string | null>,
    sourceSha256: value.sourceSha256,
    binarySha256: value.binarySha256,
  }
}

export function parseVoteDataManifest(
  value: unknown,
  fileName = 'vote_data.json',
): VoteDataManifest {
  if (
    !isRecord(value) ||
    value.schemaVersion !== BINARY_VOTE_SCHEMA_VERSION ||
    value.format !== BINARY_VOTE_FORMAT ||
    !Array.isArray(value.genders) ||
    !arraysEqual(value.genders, GENDERS) ||
    !Array.isArray(value.ageGroups) ||
    !arraysEqual(value.ageGroups, AGE_GROUPS) ||
    !Array.isArray(value.electionMethods) ||
    !arraysEqual(value.electionMethods, ELECTION_METHODS) ||
    !isRecord(value.files)
  ) {
    throw new Error(`${fileName} has an unsupported binary vote schema.`)
  }

  return {
    schemaVersion: BINARY_VOTE_SCHEMA_VERSION,
    format: BINARY_VOTE_FORMAT,
    genders: [...GENDERS],
    ageGroups: [...AGE_GROUPS],
    electionMethods: [...ELECTION_METHODS],
    files: {
      firstVotes: parseFileMetadata(value.files.firstVotes, '1', 'firstVotes'),
      secondVotes: parseFileMetadata(value.files.secondVotes, '2', 'secondVotes'),
    },
  }
}

function align(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment
}

function isLittleEndian(): boolean {
  const buffer = new ArrayBuffer(2)
  new DataView(buffer).setUint16(0, 0x00ff, true)
  return new Uint16Array(buffer)[0] === 0x00ff
}

const LITTLE_ENDIAN = isLittleEndian()

export function readBinaryVoteColumns(
  buffer: ArrayBuffer,
  metadata: VoteBinaryFileMetadata,
  expectedVoteType: VoteType,
  fileName = metadata.file,
): BinaryVoteColumns {
  if (!LITTLE_ENDIAN) {
    throw new Error(`${fileName} requires a little-endian JavaScript runtime.`)
  }
  if (buffer.byteLength !== metadata.byteLength) {
    throw new Error(`${fileName} has an unexpected byte length.`)
  }
  if (buffer.byteLength < BINARY_VOTE_HEADER_BYTES) {
    throw new Error(`${fileName} is too short to contain a binary vote header.`)
  }

  const bytes = new Uint8Array(buffer, 0, BINARY_VOTE_MAGIC.length)
  if (!bytes.every((byte, index) => byte === BINARY_VOTE_MAGIC[index])) {
    throw new Error(`${fileName} has an invalid binary vote signature.`)
  }

  const header = new DataView(buffer, 0, BINARY_VOTE_HEADER_BYTES)
  const schemaVersion = header.getUint16(8, true)
  const voteTypeCode = header.getUint8(10)
  const reserved = header.getUint8(11)
  const recordCount = header.getUint32(12, true)
  const districtOffset = header.getUint32(16, true)
  const partyOffset = header.getUint32(20, true)
  const groupOffset = header.getUint32(24, true)
  const votesOffset = header.getUint32(28, true)

  const expectedDistrictOffset = BINARY_VOTE_HEADER_BYTES
  const expectedPartyOffset = expectedDistrictOffset + recordCount * 2
  const expectedGroupOffset = expectedPartyOffset + recordCount * 2
  const expectedVotesOffset = align(expectedGroupOffset + recordCount, 8)
  const expectedByteLength = expectedVotesOffset + recordCount * 8

  if (
    schemaVersion !== BINARY_VOTE_SCHEMA_VERSION ||
    voteTypeCode !== Number(expectedVoteType) ||
    metadata.voteType !== expectedVoteType ||
    reserved !== 0 ||
    recordCount !== metadata.recordCount ||
    districtOffset !== expectedDistrictOffset ||
    partyOffset !== expectedPartyOffset ||
    groupOffset !== expectedGroupOffset ||
    votesOffset !== expectedVotesOffset ||
    expectedByteLength !== buffer.byteLength
  ) {
    throw new Error(`${fileName} has an invalid binary vote layout.`)
  }

  return {
    districtIds: new Uint16Array(buffer, districtOffset, recordCount),
    partyIds: new Uint16Array(buffer, partyOffset, recordCount),
    groupIds: new Uint8Array(buffer, groupOffset, recordCount),
    votes: new Float64Array(buffer, votesOffset, recordCount),
  }
}

function decodeGroupId(groupId: number): {
  gender: Gender
  ageGroup: AgeGroup
  electionMethod: ElectionMethod
} {
  if (!Number.isInteger(groupId) || groupId < 0 || groupId >= GROUP_COUNT) {
    throw new Error(`Invalid demographic group id ${groupId}.`)
  }

  const methodSpan = AGE_GROUPS.length * GENDERS.length
  const methodIndex = Math.floor(groupId / methodSpan)
  const withinMethod = groupId % methodSpan
  const genderIndex = Math.floor(withinMethod / AGE_GROUPS.length)
  const ageIndex = withinMethod % AGE_GROUPS.length

  return {
    gender: GENDERS[genderIndex],
    ageGroup: AGE_GROUPS[ageIndex],
    electionMethod: ELECTION_METHODS[methodIndex],
  }
}

export function decodeBinaryVoteEntries(
  buffer: ArrayBuffer,
  metadata: VoteBinaryFileMetadata,
  expectedVoteType: VoteType,
  fileName = metadata.file,
): VoteEntry[] {
  const columns = readBinaryVoteColumns(
    buffer,
    metadata,
    expectedVoteType,
    fileName,
  )
  const entries: VoteEntry[] = []

  for (let index = 0; index < metadata.recordCount; index += 1) {
    const districtId = columns.districtIds[index]
    const party = metadata.parties[columns.partyIds[index]]
    const state = metadata.districtStates[districtId]
    const votes = columns.votes[index]
    const group = decodeGroupId(columns.groupIds[index])

    if (party === undefined) {
      throw new Error(`${fileName} contains an unknown party id at record ${index}.`)
    }
    if (typeof state !== 'string') {
      throw new Error(
        `${fileName} contains an unmapped district at record ${index}.`,
      )
    }
    if (!Number.isFinite(votes) || votes < 0) {
      throw new Error(`${fileName} contains invalid votes at record ${index}.`)
    }

    entries.push({
      districtId,
      state,
      gender: group.gender,
      ageGroup: group.ageGroup,
      party,
      voteType: expectedVoteType,
      electionMethod: group.electionMethod,
      votes,
    })
  }

  return entries
}
