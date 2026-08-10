import type {
  AgeGroup,
  ElectionMethod,
  Gender,
  VoteEntry,
  VoteType,
} from '../../models/json-contracts.ts'

const MAGIC = [77, 68, 66, 86, 79, 84, 69, 49] as const
const SCHEMA_VERSION = 1
const HEADER_SIZE = 16
const RECORD_SIZE = 13

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

type JsonRecord = Record<string, unknown>

export interface VoteBinaryFileMetadata {
  file: string
  voteType: VoteType
  recordCount: number
  parties: readonly string[]
  sourceBytes: number
  binaryBytes: number
  sourceSha256: string
  binarySha256: string
}

export interface VoteBinaryMetadata {
  schemaVersion: 1
  format: 'mdb-vote-binary'
  headerSize: 16
  recordSize: 13
  genders: readonly Gender[]
  ageGroups: readonly AgeGroup[]
  electionMethods: readonly ElectionMethod[]
  districtStates: Readonly<Record<string, string>>
  files: {
    firstVotes: VoteBinaryFileMetadata
    secondVotes: VoteBinaryFileMetadata
  }
}

export class VoteBinaryDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VoteBinaryDataError'
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    Number.isFinite(value) &&
    value >= 0
  )
}

function arraysEqual(
  actual: readonly unknown[],
  expected: readonly string[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  )
}

function parseVoteFileMetadata(
  value: unknown,
  expectedVoteType: VoteType,
  key: string,
): VoteBinaryFileMetadata {
  if (
    !isRecord(value) ||
    typeof value.file !== 'string' ||
    value.file.length === 0 ||
    value.voteType !== expectedVoteType ||
    !isFiniteNonNegativeInteger(value.recordCount) ||
    !Array.isArray(value.parties) ||
    !value.parties.every(
      (party) => typeof party === 'string' && party.length > 0,
    ) ||
    new Set(value.parties).size !== value.parties.length ||
    !isFiniteNonNegativeInteger(value.sourceBytes) ||
    !isFiniteNonNegativeInteger(value.binaryBytes) ||
    typeof value.sourceSha256 !== 'string' ||
    !/^[0-9a-f]{64}$/.test(value.sourceSha256) ||
    typeof value.binarySha256 !== 'string' ||
    !/^[0-9a-f]{64}$/.test(value.binarySha256)
  ) {
    throw new VoteBinaryDataError(
      `vote_data.json contains invalid metadata for ${key}.`,
    )
  }

  return {
    file: value.file,
    voteType: expectedVoteType,
    recordCount: value.recordCount,
    parties: value.parties as string[],
    sourceBytes: value.sourceBytes,
    binaryBytes: value.binaryBytes,
    sourceSha256: value.sourceSha256,
    binarySha256: value.binarySha256,
  }
}

export function parseVoteBinaryMetadata(value: unknown): VoteBinaryMetadata {
  if (
    !isRecord(value) ||
    value.schemaVersion !== SCHEMA_VERSION ||
    value.format !== 'mdb-vote-binary' ||
    value.headerSize !== HEADER_SIZE ||
    value.recordSize !== RECORD_SIZE ||
    !Array.isArray(value.genders) ||
    !arraysEqual(value.genders, GENDERS) ||
    !Array.isArray(value.ageGroups) ||
    !arraysEqual(value.ageGroups, AGE_GROUPS) ||
    !Array.isArray(value.electionMethods) ||
    !arraysEqual(value.electionMethods, ELECTION_METHODS) ||
    !isRecord(value.districtStates) ||
    !isRecord(value.files)
  ) {
    throw new VoteBinaryDataError(
      'vote_data.json does not match the supported binary vote schema.',
    )
  }

  const districtStates: Record<string, string> = {}
  for (const [districtId, state] of Object.entries(value.districtStates)) {
    const numericDistrictId = Number(districtId)
    if (
      !Number.isInteger(numericDistrictId) ||
      numericDistrictId <= 0 ||
      numericDistrictId > 0xffff ||
      typeof state !== 'string' ||
      state.length === 0
    ) {
      throw new VoteBinaryDataError(
        'vote_data.json contains an invalid constituency-to-state mapping.',
      )
    }
    districtStates[districtId] = state
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    format: 'mdb-vote-binary',
    headerSize: HEADER_SIZE,
    recordSize: RECORD_SIZE,
    genders: GENDERS,
    ageGroups: AGE_GROUPS,
    electionMethods: ELECTION_METHODS,
    districtStates,
    files: {
      firstVotes: parseVoteFileMetadata(
        value.files.firstVotes,
        '1',
        'firstVotes',
      ),
      secondVotes: parseVoteFileMetadata(
        value.files.secondVotes,
        '2',
        'secondVotes',
      ),
    },
  }
}

function assertBinaryHeader(
  view: DataView,
  fileMetadata: VoteBinaryFileMetadata,
): void {
  if (view.byteLength < HEADER_SIZE) {
    throw new VoteBinaryDataError(
      `${fileMetadata.file} is shorter than the binary vote header.`,
    )
  }

  for (let index = 0; index < MAGIC.length; index += 1) {
    if (view.getUint8(index) !== MAGIC[index]) {
      throw new VoteBinaryDataError(
        `${fileMetadata.file} has an invalid binary vote signature.`,
      )
    }
  }

  const schemaVersion = view.getUint16(8, true)
  const voteType = view.getUint8(10)
  const recordSize = view.getUint8(11)
  const recordCount = view.getUint32(12, true)

  if (
    schemaVersion !== SCHEMA_VERSION ||
    voteType !== Number(fileMetadata.voteType) ||
    recordSize !== RECORD_SIZE ||
    recordCount !== fileMetadata.recordCount
  ) {
    throw new VoteBinaryDataError(
      `${fileMetadata.file} header does not match vote_data.json.`,
    )
  }

  const expectedByteLength = HEADER_SIZE + recordCount * RECORD_SIZE
  if (
    view.byteLength !== expectedByteLength ||
    fileMetadata.binaryBytes !== expectedByteLength
  ) {
    throw new VoteBinaryDataError(
      `${fileMetadata.file} has an unexpected binary length.`,
    )
  }
}

function decodeGroupId(groupId: number): {
  gender: Gender
  ageGroup: AgeGroup
  electionMethod: ElectionMethod
} {
  const methodCount = ELECTION_METHODS.length
  const ageCount = AGE_GROUPS.length
  const groupCount = GENDERS.length * ageCount * methodCount

  if (groupId < 0 || groupId >= groupCount) {
    throw new VoteBinaryDataError(`Unknown demographic group id ${groupId}.`)
  }

  const electionMethodIndex = groupId % methodCount
  const demographicIndex = Math.floor(groupId / methodCount)
  const ageGroupIndex = demographicIndex % ageCount
  const genderIndex = Math.floor(demographicIndex / ageCount)

  return {
    gender: GENDERS[genderIndex],
    ageGroup: AGE_GROUPS[ageGroupIndex],
    electionMethod: ELECTION_METHODS[electionMethodIndex],
  }
}

export function parseVoteBinaryEntries(
  buffer: ArrayBuffer,
  metadata: VoteBinaryMetadata,
  fileMetadata: VoteBinaryFileMetadata,
): VoteEntry[] {
  const view = new DataView(buffer)
  assertBinaryHeader(view, fileMetadata)

  const entries = new Array<VoteEntry>(fileMetadata.recordCount)

  for (let index = 0; index < fileMetadata.recordCount; index += 1) {
    const offset = HEADER_SIZE + index * RECORD_SIZE
    const districtId = view.getUint16(offset, true)
    const partyId = view.getUint16(offset + 2, true)
    const groupId = view.getUint8(offset + 4)
    const votes = view.getFloat64(offset + 5, true)

    const state = metadata.districtStates[String(districtId)]
    const party = fileMetadata.parties[partyId]

    if (state === undefined) {
      throw new VoteBinaryDataError(
        `${fileMetadata.file} references unknown constituency ${districtId}.`,
      )
    }
    if (party === undefined) {
      throw new VoteBinaryDataError(
        `${fileMetadata.file} references unknown party id ${partyId}.`,
      )
    }
    if (!Number.isFinite(votes) || votes < 0) {
      throw new VoteBinaryDataError(
        `${fileMetadata.file} contains an invalid vote value at record ${index}.`,
      )
    }

    const { gender, ageGroup, electionMethod } = decodeGroupId(groupId)
    entries[index] = {
      districtId,
      state,
      gender,
      ageGroup,
      party,
      voteType: fileMetadata.voteType,
      electionMethod,
      votes,
    }
  }

  return entries
}
