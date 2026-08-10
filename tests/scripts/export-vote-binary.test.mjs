import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { exportVoteBinaryData } from '../../scripts/export-vote-binary.mjs'

function entry(overrides = {}) {
  return {
    districtId: 1,
    state: 'Schleswig-Holstein',
    gender: 'm',
    ageGroup: '18-24',
    party: 'SPD',
    voteType: '1',
    electionMethod: 'postal',
    votes: 12.5,
    ...overrides,
  }
}

test('exports deterministic binary runtime data without changing VoteEntry JSON', async () => {
  const root = await mkdtemp(join(tmpdir(), 'mdb-vote-binary-'))
  const electionDirectory = join(root, 'btw2099')
  await mkdir(electionDirectory)

  const firstVotes = [
    entry(),
    entry({
      districtId: 2,
      state: 'Hamburg',
      party: 'CDU',
      gender: 'w',
      ageGroup: '70+',
      electionMethod: 'in-person',
      votes: 8.25,
    }),
  ]
  const secondVotes = firstVotes.map((vote) => ({
    ...vote,
    voteType: '2',
    votes: vote.votes + 1,
  }))

  const firstSource = `${JSON.stringify(firstVotes, null, 2)}\n`
  const secondSource = `${JSON.stringify(secondVotes, null, 2)}\n`
  await writeFile(join(electionDirectory, 'first_votes.json'), firstSource)
  await writeFile(join(electionDirectory, 'second_votes.json'), secondSource)

  try {
    await exportVoteBinaryData(root)

    assert.equal(
      await readFile(join(electionDirectory, 'first_votes.json'), 'utf8'),
      firstSource,
    )
    assert.equal(
      await readFile(join(electionDirectory, 'second_votes.json'), 'utf8'),
      secondSource,
    )

    const metadata = JSON.parse(
      await readFile(join(electionDirectory, 'vote_data.json'), 'utf8'),
    )
    assert.equal(metadata.schemaVersion, 1)
    assert.equal(metadata.recordSize, 13)
    assert.deepEqual(metadata.files.firstVotes.parties, ['CDU', 'SPD'])
    assert.deepEqual(metadata.districtStates, {
      '1': 'Schleswig-Holstein',
      '2': 'Hamburg',
    })

    const firstBinary = await readFile(
      join(electionDirectory, 'first_votes.bin'),
    )
    assert.equal(firstBinary.subarray(0, 8).toString('ascii'), 'MDBVOTE1')
    assert.equal(firstBinary.readUInt32LE(12), firstVotes.length)
    assert.equal(firstBinary.byteLength, 16 + firstVotes.length * 13)

    const firstPartyId = firstBinary.readUInt16LE(16 + 2)
    const firstVotesValue = firstBinary.readDoubleLE(16 + 5)
    assert.equal(metadata.files.firstVotes.parties[firstPartyId], 'SPD')
    assert.equal(firstVotesValue, 12.5)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
