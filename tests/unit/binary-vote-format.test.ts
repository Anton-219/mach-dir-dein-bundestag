import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  BINARY_VOTE_FORMAT,
  BINARY_VOTE_HEADER_BYTES,
  BINARY_VOTE_SCHEMA_VERSION,
  decodeBinaryVoteEntries,
  parseVoteDataManifest,
  type VoteBinaryFileMetadata,
} from '../../src/lib/data/binary-vote-format.ts'

const SHA = '0'.repeat(64)

function buildBinaryFixture(): {
  buffer: ArrayBuffer
  metadata: VoteBinaryFileMetadata
} {
  const recordCount = 2
  const districtOffset = BINARY_VOTE_HEADER_BYTES
  const partyOffset = districtOffset + recordCount * 2
  const groupOffset = partyOffset + recordCount * 2
  const votesOffset = Math.ceil((groupOffset + recordCount) / 8) * 8
  const byteLength = votesOffset + recordCount * 8
  const buffer = new ArrayBuffer(byteLength)
  const bytes = new Uint8Array(buffer)
  bytes.set([77, 68, 66, 86, 79, 84, 69, 0])
  const view = new DataView(buffer)
  view.setUint16(8, BINARY_VOTE_SCHEMA_VERSION, true)
  view.setUint8(10, 2)
  view.setUint8(11, 0)
  view.setUint32(12, recordCount, true)
  view.setUint32(16, districtOffset, true)
  view.setUint32(20, partyOffset, true)
  view.setUint32(24, groupOffset, true)
  view.setUint32(28, votesOffset, true)
  view.setUint16(districtOffset, 1, true)
  view.setUint16(districtOffset + 2, 2, true)
  view.setUint16(partyOffset, 0, true)
  view.setUint16(partyOffset + 2, 1, true)
  bytes[groupOffset] = 12
  bytes[groupOffset + 1] = 11
  view.setFloat64(votesOffset, 12.5, true)
  view.setFloat64(votesOffset + 8, 3.25, true)

  return {
    buffer,
    metadata: {
      file: 'second_votes.bin',
      voteType: '2',
      recordCount,
      byteLength,
      parties: ['AAA', 'BBB'],
      districtStates: [null, 'State A', 'State B'],
      sourceSha256: SHA,
      binarySha256: SHA,
    },
  }
}

test('decodes the columnar binary format into VoteEntry records', () => {
  const { buffer, metadata } = buildBinaryFixture()

  assert.deepEqual(decodeBinaryVoteEntries(buffer, metadata, '2'), [
    {
      districtId: 1,
      state: 'State A',
      gender: 'm',
      ageGroup: '18-24',
      party: 'AAA',
      voteType: '2',
      electionMethod: 'in-person',
      votes: 12.5,
    },
    {
      districtId: 2,
      state: 'State B',
      gender: 'w',
      ageGroup: '70+',
      party: 'BBB',
      voteType: '2',
      electionMethod: 'postal',
      votes: 3.25,
    },
  ])
})

test('rejects an invalid binary signature', () => {
  const { buffer, metadata } = buildBinaryFixture()
  new Uint8Array(buffer)[0] = 0

  assert.throws(
    () => decodeBinaryVoteEntries(buffer, metadata, '2'),
    /invalid binary vote signature/,
  )
})

test('parses the versioned vote-data manifest', () => {
  const { metadata } = buildBinaryFixture()
  const manifest = parseVoteDataManifest({
    schemaVersion: BINARY_VOTE_SCHEMA_VERSION,
    format: BINARY_VOTE_FORMAT,
    genders: ['m', 'w'],
    ageGroups: ['18-24', '25-34', '35-44', '45-59', '60-69', '70+'],
    electionMethods: ['postal', 'in-person'],
    files: {
      firstVotes: { ...metadata, file: 'first_votes.bin', voteType: '1' },
      secondVotes: metadata,
    },
  })

  assert.equal(manifest.files.firstVotes.voteType, '1')
  assert.equal(manifest.files.secondVotes.recordCount, 2)
})
