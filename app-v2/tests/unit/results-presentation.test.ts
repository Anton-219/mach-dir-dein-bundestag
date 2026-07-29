import assert from 'node:assert/strict'
import test from 'node:test'

import type { CoalitionResult } from '../../src/lib/coalitions/index.ts'
import {
  buildParliamentSegments,
  buildPresentedPartyResults,
  getPartyIdentity,
  prioritizeCoalitions,
  sortPartyResultsBySeats,
} from '../../src/lib/results/presentation.ts'
import type {
  ElectionResult,
  SeatResult,
} from '../../src/models/calculation-results.ts'
import type { Party } from '../../src/models/json-contracts.ts'

const parties: Party[] = [
  { name: 'Left party', abbreviation: 'LEFT', color: '#a00', seatPosition: -50 },
  { name: 'Centre party', abbreviation: 'CENTRE', color: '#0a0', seatPosition: 0 },
  { name: 'Right party', abbreviation: 'RIGHT', color: '#00a', seatPosition: 50 },
  {
    name: 'Union parties',
    abbreviation: 'CDU+CSU',
    color: '#111',
    seatPosition: 33,
  },
]

const electionResults: ElectionResult[] = [
  { partyAbbreviation: 'RIGHT', votes: 500, percentage: 0.5, seatPosition: 50 },
  { partyAbbreviation: 'LEFT', votes: 200, percentage: 0.2, seatPosition: -50 },
  { partyAbbreviation: 'CENTRE', votes: 300, percentage: 0.3, seatPosition: 0 },
]

const seatResults: SeatResult[] = [
  { partyAbbreviation: 'RIGHT', seats: 50, seatPosition: 50 },
  { partyAbbreviation: 'LEFT', seats: 20, seatPosition: -50 },
  { partyAbbreviation: 'CENTRE', seats: 30, seatPosition: 0 },
  { partyAbbreviation: 'NO-SEATS', seats: 0, seatPosition: 80 },
]

test('builds represented party results in parliamentary left-to-right order', () => {
  const results = buildPresentedPartyResults(parties, electionResults, seatResults)

  assert.deepEqual(
    results.map((result) => ({
      abbreviation: result.abbreviation,
      name: result.name,
      color: result.color,
      seats: result.seats,
    })),
    [
      { abbreviation: 'LEFT', name: 'Left party', color: '#a00', seats: 20 },
      {
        abbreviation: 'CENTRE',
        name: 'Centre party',
        color: '#0a0',
        seats: 30,
      },
      { abbreviation: 'RIGHT', name: 'Right party', color: '#00a', seats: 50 },
    ],
  )
})

test('builds contiguous parliament segments for every represented party', () => {
  const results = buildPresentedPartyResults(parties, electionResults, seatResults)
  const segments = buildParliamentSegments(results)

  assert.deepEqual(
    segments.map((segment) => ({
      abbreviation: segment.abbreviation,
      start: Math.round(segment.startPercentage),
      share: Math.round(segment.sharePercentage),
    })),
    [
      { abbreviation: 'LEFT', start: 0, share: 20 },
      { abbreviation: 'CENTRE', start: 20, share: 30 },
      { abbreviation: 'RIGHT', start: 50, share: 50 },
    ],
  )
})

test('orders party summary rows by seats without mutating parliamentary order', () => {
  const results = buildPresentedPartyResults(parties, electionResults, seatResults)

  assert.deepEqual(
    sortPartyResultsBySeats(results).map((result) => result.abbreviation),
    ['RIGHT', 'CENTRE', 'LEFT'],
  )
  assert.deepEqual(
    results.map((result) => result.abbreviation),
    ['LEFT', 'CENTRE', 'RIGHT'],
  )
})

test('prioritises concise coalitions before smaller majority margins', () => {
  const single: SeatResult = { partyAbbreviation: 'RIGHT', seats: 55, seatPosition: 50 }
  const left: SeatResult = { partyAbbreviation: 'LEFT', seats: 30, seatPosition: -50 }
  const centre: SeatResult = { partyAbbreviation: 'CENTRE', seats: 23, seatPosition: 0 }
  const extra: SeatResult = { partyAbbreviation: 'EXTRA', seats: 8, seatPosition: 10 }
  const coalitions: CoalitionResult[] = [
    { members: [left, centre, extra], seats: 61, threshold: 51, surplus: 10 },
    { members: [left, centre], seats: 53, threshold: 51, surplus: 2 },
    { members: [single], seats: 55, threshold: 51, surplus: 4 },
    { members: [left, extra], seats: 58, threshold: 51, surplus: 7 },
  ]

  assert.deepEqual(
    prioritizeCoalitions(coalitions).map((coalition) =>
      coalition.members.map((member) => member.partyAbbreviation).join('+'),
    ),
    ['RIGHT', 'LEFT+CENTRE', 'LEFT+EXTRA', 'LEFT+CENTRE+EXTRA'],
  )
  assert.equal(coalitions[0]?.members.length, 3)
})

test('uses the explicit CDU+CSU metadata for coalition labels', () => {
  assert.deepEqual(getPartyIdentity('CDU+CSU', parties), {
    abbreviation: 'CDU+CSU',
    name: 'Union parties',
    color: '#111',
  })
})
