import assert from 'node:assert/strict'
import test from 'node:test'

import {
  parseVoteBinaryEntries,
  parseVoteBinaryMetadata,
  VoteBinaryDataError,
} from '../../src/lib/data/vote-binary.ts'

const HEADER_SIZE = 16
const RECORD_SIZE = 13

function createMetadata() {
  return {
    schemaVersion: 1,
    format: 'mdb-vote-binary',
    headerSize: HEADER_SIZE,
    recordSize: RECORD_SIZE,
    genders: ['m', 'w'],
    ageGroups: ['18-24', '25-34', '35-44', '45-59', '60-69', '70+'],
    electionMethods: ['postal', 'in-person'],
    districtStates: {
      '1': 'Schleswig-Holstein',
      '2': 'Hamburg',
    },
    files: {
      firstVotes: {
        file: 'first_votes.bin',
        voteType: '1',
        recordCount: 2,
        parties: ['CDU', 'SPD'],
        sourceBytes: 1000,
        binaryBytes: HEADER_SIZE + 2 * RECORD_SIZE,
        sourceSha256: 'a'.repeat(64),
        binarySha256: 'b'.repeat(64),
      },
      secondVotes: {
        file: 'second_votes.bin',
        voteType: '2',
        recordCount: 2,
        parties: ['CDU', 'SPD'],
        sourceBytes: 1000,
        binaryBytes: HEADER_SIZE + 2 * RECORD_SIZE,
        sourceSha256: 'c'.repeat(64),
        binarySha256: 'd'.repeat(64),
      },
    },
  }
}

function createBinary(
  voteType: '1' | '2',
  records: readonly {
    districtId: number
    partyId: number
    groupId: number
    votes: number
  }[],
): ArrayBuffer {
  const buffer = new ArrayBuffer(HEADER_SIZE + records.length * RECORD_SIZE)
  const view = new DataView(buffer)
  const magic = 'MDBVOTE1'

  for (let index = 0; index < magic.length; index += 1) {
    view.setUint8(index, magic.charCodeAt(index))
  }
  view.setUint16(8, 1, true)
  view.setUint8(10, Number(voteType))
  view.setUint8(11, RECORD_SIZE)
  view.setUint32(12, records.length, true)

  records.forEach((record, index) => {
    const offset = HEADER_SIZE + index * RECORD_SIZE
    view.setUint16(offset, record.districtId, true)
    view.setUint16(offset + 2, record.partyId, true)
    view.setUint8(offset + 4, record.groupId)
    view.setFloat64(offset + 5, record.votes, true)
  })

  return buffer
}

test('parses binary vote records back into the VoteEntry contract', () => {
  const metadata = parseVoteBinaryMetadata(createMetadata())
  const buffer = createBinary('2', [
    {
      districtId: 1,
      partyId: 1,
      // m × 18-24 × postal
      groupId: 0,
      votes: 12.5,
    },
    {
      districtId: 2,
      partyId: 0,
      // w × 70+ × in-person
      groupId: 23,
      votes: 8.25,
    },
  ])

  const entries = parseVoteBinaryEntries(
    buffer,
    metadata,
    metadata.files.secondVotes,
  )

  assert.deepEqual(entries, [
    {
      districtId: 1,
      state: 'Schleswig-Holstein',
      gender: 'm',
      ageGroup: '18-24',
      party: 'SPD',
      voteType: '2',
      electionMethod: 'postal',
      votes: 12.5,
    },
    {
      districtId: 2,
      state: 'Hamburg',
      gender: 'w',
      ageGroup: '70+',
      party: 'CDU',
      voteType: '2',
      electionMethod: 'in-person',
      votes: 8.25,
    },
  ])
})

test('rejects binary files whose header does not match metadata', () => {
  const metadata = parseVoteBinaryMetadata(createMetadata())
  const buffer = createBinary('1', [
    { districtId: 1, partyId: 0, groupId: 0, votes: 1 },
    { districtId: 2, partyId: 1, groupId: 1, votes: 2 },
  ])

  assert.throws(
    () =>
      parseVoteBinaryEntries(
        buffer,
        metadata,
        metadata.files.secondVotes,
      ),
    VoteBinaryDataError,
  )
})

test('rejects metadata whose dimension order would change group decoding', () => {
  const invalidMetadata = createMetadata()
  invalidMetadata.ageGroups = [...invalidMetadata.ageGroups].reverse()

  assert.throws(
    () => parseVoteBinaryMetadata(invalidMetadata),
    VoteBinaryDataError,
  )
})
