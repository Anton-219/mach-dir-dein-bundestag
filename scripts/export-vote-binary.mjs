import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const MAGIC = Buffer.from('MDBVOTE1', 'ascii')
const SCHEMA_VERSION = 1
const HEADER_SIZE = 16
const RECORD_SIZE = 13

const GENDERS = ['m', 'w']
const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-59', '60-69', '70+']
const ELECTION_METHODS = ['postal', 'in-person']

const VOTE_FILES = [
  { key: 'firstVotes', file: 'first_votes.json', binaryFile: 'first_votes.bin', voteType: '1' },
  { key: 'secondVotes', file: 'second_votes.json', binaryFile: 'second_votes.bin', voteType: '2' },
]

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function assertRecord(value, index, expectedVoteType) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Vote record ${index} must be an object.`)
  }

  if (
    !Number.isInteger(value.districtId) ||
    value.districtId <= 0 ||
    value.districtId > 0xffff
  ) {
    throw new Error(`Vote record ${index} has an invalid districtId.`)
  }

  if (typeof value.state !== 'string' || value.state.length === 0) {
    throw new Error(`Vote record ${index} has an invalid state.`)
  }

  if (!GENDERS.includes(value.gender)) {
    throw new Error(`Vote record ${index} has an invalid gender.`)
  }

  if (!AGE_GROUPS.includes(value.ageGroup)) {
    throw new Error(`Vote record ${index} has an invalid ageGroup.`)
  }

  if (typeof value.party !== 'string' || value.party.length === 0) {
    throw new Error(`Vote record ${index} has an invalid party.`)
  }

  if (value.voteType !== expectedVoteType) {
    throw new Error(
      `Vote record ${index} has voteType ${String(value.voteType)} instead of ${expectedVoteType}.`,
    )
  }

  if (!ELECTION_METHODS.includes(value.electionMethod)) {
    throw new Error(`Vote record ${index} has an invalid electionMethod.`)
  }

  if (
    typeof value.votes !== 'number' ||
    !Number.isFinite(value.votes) ||
    value.votes < 0
  ) {
    throw new Error(`Vote record ${index} has an invalid votes value.`)
  }
}

function encodeGroupId(entry) {
  const genderIndex = GENDERS.indexOf(entry.gender)
  const ageGroupIndex = AGE_GROUPS.indexOf(entry.ageGroup)
  const electionMethodIndex = ELECTION_METHODS.indexOf(entry.electionMethod)

  return (
    genderIndex * AGE_GROUPS.length * ELECTION_METHODS.length +
    ageGroupIndex * ELECTION_METHODS.length +
    electionMethodIndex
  )
}

function compareDistrictCoverage(firstDistrictIds, secondDistrictIds, electionDirectory) {
  if (
    firstDistrictIds.size !== secondDistrictIds.size ||
    [...firstDistrictIds].some((districtId) => !secondDistrictIds.has(districtId))
  ) {
    throw new Error(
      `${electionDirectory} first- and second-vote JSON files do not contain the same constituencies.`,
    )
  }
}

async function exportVoteFile({
  sourcePath,
  outputPath,
  binaryFile,
  expectedVoteType,
  districtStates,
}) {
  const source = await readFile(sourcePath, 'utf8')
  const parsed = JSON.parse(source)

  if (!Array.isArray(parsed)) {
    throw new Error(`${sourcePath} must contain a top-level JSON array.`)
  }

  const parties = new Set()
  const districtIds = new Set()

  parsed.forEach((entry, index) => {
    assertRecord(entry, index, expectedVoteType)
    parties.add(entry.party)
    districtIds.add(entry.districtId)

    const existingState = districtStates.get(entry.districtId)
    if (existingState !== undefined && existingState !== entry.state) {
      throw new Error(
        `Constituency ${entry.districtId} is assigned to both ${existingState} and ${entry.state}.`,
      )
    }
    districtStates.set(entry.districtId, entry.state)
  })

  const partyNames = [...parties].sort()
  if (partyNames.length > 0x10000) {
    throw new Error(`${sourcePath} contains too many parties for the binary format.`)
  }

  const partyIds = new Map(partyNames.map((party, index) => [party, index]))
  const binary = Buffer.allocUnsafe(HEADER_SIZE + parsed.length * RECORD_SIZE)

  MAGIC.copy(binary, 0)
  binary.writeUInt16LE(SCHEMA_VERSION, 8)
  binary.writeUInt8(Number(expectedVoteType), 10)
  binary.writeUInt8(RECORD_SIZE, 11)
  binary.writeUInt32LE(parsed.length, 12)

  parsed.forEach((entry, index) => {
    const offset = HEADER_SIZE + index * RECORD_SIZE
    const partyId = partyIds.get(entry.party)

    if (partyId === undefined) {
      throw new Error(`Could not encode party ${entry.party}.`)
    }

    binary.writeUInt16LE(entry.districtId, offset)
    binary.writeUInt16LE(partyId, offset + 2)
    binary.writeUInt8(encodeGroupId(entry), offset + 4)
    binary.writeDoubleLE(entry.votes, offset + 5)
  })

  // Decode every generated record once. This makes the conversion step fail
  // immediately if a layout change would stop reproducing the JSON values.
  parsed.forEach((entry, index) => {
    const offset = HEADER_SIZE + index * RECORD_SIZE
    const districtId = binary.readUInt16LE(offset)
    const partyId = binary.readUInt16LE(offset + 2)
    const groupId = binary.readUInt8(offset + 4)
    const votes = binary.readDoubleLE(offset + 5)

    if (
      districtId !== entry.districtId ||
      partyNames[partyId] !== entry.party ||
      groupId !== encodeGroupId(entry) ||
      votes !== entry.votes
    ) {
      throw new Error(`Binary round-trip validation failed at vote record ${index}.`)
    }
  })

  await writeFile(outputPath, binary)

  return {
    file: binaryFile,
    voteType: expectedVoteType,
    recordCount: parsed.length,
    parties: partyNames,
    sourceBytes: Buffer.byteLength(source),
    binaryBytes: binary.byteLength,
    sourceSha256: sha256(source),
    binarySha256: sha256(binary),
    districtIds,
  }
}

async function exportElectionDirectory(dataRoot, electionDirectory) {
  const directory = join(dataRoot, electionDirectory)
  const districtStates = new Map()
  const descriptors = {}

  for (const voteFile of VOTE_FILES) {
    const descriptor = await exportVoteFile({
      sourcePath: join(directory, voteFile.file),
      outputPath: join(directory, voteFile.binaryFile),
      binaryFile: voteFile.binaryFile,
      expectedVoteType: voteFile.voteType,
      districtStates,
    })
    descriptors[voteFile.key] = descriptor
  }

  compareDistrictCoverage(
    descriptors.firstVotes.districtIds,
    descriptors.secondVotes.districtIds,
    electionDirectory,
  )

  const metadata = {
    schemaVersion: SCHEMA_VERSION,
    format: 'mdb-vote-binary',
    headerSize: HEADER_SIZE,
    recordSize: RECORD_SIZE,
    genders: GENDERS,
    ageGroups: AGE_GROUPS,
    electionMethods: ELECTION_METHODS,
    districtStates: Object.fromEntries(
      [...districtStates.entries()]
        .sort(([left], [right]) => left - right)
        .map(([districtId, state]) => [String(districtId), state]),
    ),
    files: Object.fromEntries(
      VOTE_FILES.map(({ key }) => {
        const { districtIds: _districtIds, ...descriptor } = descriptors[key]
        return [key, descriptor]
      }),
    ),
  }

  await writeFile(
    join(directory, 'vote_data.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
    'utf8',
  )

  return metadata
}

export async function exportVoteBinaryData(dataRoot = resolve('public/data')) {
  const entries = await readdir(dataRoot, { withFileTypes: true })
  const electionDirectories = entries
    .filter((entry) => entry.isDirectory() && /^btw\d{4}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort()

  if (electionDirectories.length === 0) {
    throw new Error(`No election data directories found in ${dataRoot}.`)
  }

  const results = {}
  for (const electionDirectory of electionDirectories) {
    results[electionDirectory] = await exportElectionDirectory(
      dataRoot,
      electionDirectory,
    )
  }

  return results
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href

if (isDirectExecution) {
  const dataRoot = process.argv[2] === undefined
    ? resolve('public/data')
    : resolve(process.argv[2])

  exportVoteBinaryData(dataRoot)
    .then((results) => {
      for (const [electionDirectory, metadata] of Object.entries(results)) {
        const sourceBytes =
          metadata.files.firstVotes.sourceBytes +
          metadata.files.secondVotes.sourceBytes
        const binaryBytes =
          metadata.files.firstVotes.binaryBytes +
          metadata.files.secondVotes.binaryBytes
        const reduction = sourceBytes === 0
          ? 0
          : (1 - binaryBytes / sourceBytes) * 100

        console.log(
          `${electionDirectory}: ${(sourceBytes / 1024 / 1024).toFixed(1)} MiB JSON -> ` +
            `${(binaryBytes / 1024 / 1024).toFixed(1)} MiB binary ` +
            `(${reduction.toFixed(1)}% smaller)`,
        )
      }
    })
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
}
