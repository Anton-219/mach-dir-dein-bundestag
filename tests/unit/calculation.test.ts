import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateMinimalWinningCoalitions,
  normalizeCoalitionPartners,
} from '../../src/lib/coalitions/index.ts'
import {
  aggregateElectionResults,
  allocateSeats,
  filterEligibleParties,
  filterVoteEntries,
} from '../../src/lib/election/index.ts'
import type {
  ElectionResult,
  SeatResult,
} from '../../src/models/calculation-results.ts'
import type { Party, VoteEntry } from '../../src/models/json-contracts.ts'

const parties: Party[] = [
  { name: 'SPD', abbreviation: 'SPD', color: '#f00', seatPosition: -15 },
  { name: 'CDU', abbreviation: 'CDU', color: '#000', seatPosition: 33 },
]

const entries: VoteEntry[] = [
  {
    districtId: 1,
    state: 'Berlin',
    gender: 'm',
    ageGroup: '18-24',
    party: 'SPD',
    voteType: '2',
    electionMethod: 'postal',
    votes: 100,
  },
  {
    districtId: 1,
    state: 'Berlin',
    gender: 'w',
    ageGroup: '18-24',
    party: 'CDU',
    voteType: '2',
    electionMethod: 'postal',
    votes: 50,
  },
  {
    districtId: 18,
    state: 'Hamburg',
    gender: 'm',
    ageGroup: '25-34',
    party: 'SPD',
    voteType: '2',
    electionMethod: 'in-person',
    votes: 25,
  },
  {
    districtId: 18,
    state: 'Hamburg',
    gender: 'm',
    ageGroup: '25-34',
    party: 'UNKNOWN',
    voteType: '2',
    electionMethod: 'in-person',
    votes: 25,
  },
]

test('applies all vote-entry filters without mutating the input', () => {
  const filtered = filterVoteEntries(entries, [
    { id: 'male', matches: (entry) => entry.gender === 'm' },
    { id: 'hamburg', matches: (entry) => entry.state === 'Hamburg' },
  ])

  assert.deepEqual(
    filtered.map((entry) => entry.party),
    ['SPD', 'UNKNOWN'],
  )
  assert.equal(entries.length, 4)
})

test('aggregates votes, percentages, and party positions in input order', () => {
  assert.deepEqual(aggregateElectionResults(entries, parties), [
    {
      partyAbbreviation: 'SPD',
      votes: 125,
      percentage: 0.625,
      seatPosition: -15,
    },
    {
      partyAbbreviation: 'CDU',
      votes: 50,
      percentage: 0.25,
      seatPosition: 33,
    },
    {
      partyAbbreviation: 'UNKNOWN',
      votes: 25,
      percentage: 0.125,
      seatPosition: 999,
    },
  ])
})

test('applies threshold, direct-mandate, minority-party, and aggregate-bucket rules', () => {
  const results: ElectionResult[] = [
    {
      partyAbbreviation: 'ABOVE',
      votes: 60_000,
      percentage: 0.06,
      seatPosition: 1,
    },
    {
      partyAbbreviation: 'EXACT',
      votes: 50_000,
      percentage: 0.05,
      seatPosition: 2,
    },
    {
      partyAbbreviation: 'DIRECT',
      votes: 20_000,
      percentage: 0.02,
      seatPosition: 3,
    },
    {
      partyAbbreviation: 'SSW',
      votes: 1,
      percentage: 0.000001,
      seatPosition: 4,
    },
    {
      partyAbbreviation: 'Sonstige',
      votes: 200_000,
      percentage: 0.2,
      seatPosition: 5,
    },
  ]

  const eligible = filterEligibleParties(results, [
    { party: 'DIRECT', districtsWon: 3 },
  ])

  assert.deepEqual(
    eligible.map((result) => result.partyAbbreviation),
    ['ABOVE', 'EXACT', 'DIRECT', 'SSW'],
  )
})

test('matches the legacy odd-divisor reference allocation', () => {
  const results: ElectionResult[] = [
    {
      partyAbbreviation: 'A',
      votes: 100,
      percentage: 100 / 210,
      seatPosition: 1,
    },
    {
      partyAbbreviation: 'B',
      votes: 80,
      percentage: 80 / 210,
      seatPosition: 2,
    },
    {
      partyAbbreviation: 'C',
      votes: 30,
      percentage: 30 / 210,
      seatPosition: 3,
    },
  ]

  assert.deepEqual(allocateSeats(results, [], { totalSeats: 7 }), [
    { partyAbbreviation: 'A', seats: 3, seatPosition: 1 },
    { partyAbbreviation: 'B', seats: 3, seatPosition: 2 },
    { partyAbbreviation: 'C', seats: 1, seatPosition: 3 },
  ])
})

test('returns only the legacy minimal winning combinations', () => {
  const seats: SeatResult[] = [
    { partyAbbreviation: 'A', seats: 40, seatPosition: 1 },
    { partyAbbreviation: 'B', seats: 35, seatPosition: 2 },
    { partyAbbreviation: 'C', seats: 20, seatPosition: 3 },
    { partyAbbreviation: 'D', seats: 5, seatPosition: 4 },
  ]

  const coalitions = calculateMinimalWinningCoalitions(seats, 51)

  assert.deepEqual(
    coalitions.map((coalition) => ({
      parties: coalition.members.map((member) => member.partyAbbreviation),
      seats: coalition.seats,
      surplus: coalition.surplus,
    })),
    [
      { parties: ['A', 'B'], seats: 75, surplus: 24 },
      { parties: ['A', 'C'], seats: 60, surplus: 9 },
      { parties: ['B', 'C'], seats: 55, surplus: 4 },
    ],
  )
})

test('merges CDU and CSU before enumerating coalitions', () => {
  const seats: SeatResult[] = [
    { partyAbbreviation: 'CDU', seats: 20, seatPosition: 1 },
    { partyAbbreviation: 'CSU', seats: 10, seatPosition: 2 },
    { partyAbbreviation: 'SPD', seats: 25, seatPosition: 3 },
    { partyAbbreviation: 'GRÜNE', seats: 20, seatPosition: 4 },
  ]

  const coalitions = calculateMinimalWinningCoalitions(seats, 41)

  assert.deepEqual(
    coalitions.map((coalition) => ({
      parties: coalition.members.map((member) => member.partyAbbreviation),
      seats: coalition.seats,
    })),
    [
      { parties: ['CDU+CSU', 'SPD'], seats: 55 },
      { parties: ['CDU+CSU', 'GRÜNE'], seats: 50 },
      { parties: ['SPD', 'GRÜNE'], seats: 45 },
    ],
  )
  assert.deepEqual(
    seats.map((result) => result.partyAbbreviation),
    ['CDU', 'CSU', 'SPD', 'GRÜNE'],
  )
})

test('keeps a single CDU or CSU result unchanged', () => {
  const seats: SeatResult[] = [
    { partyAbbreviation: 'CSU', seats: 10, seatPosition: 1 },
    { partyAbbreviation: 'SPD', seats: 20, seatPosition: 2 },
  ]

  assert.deepEqual(normalizeCoalitionPartners(seats), seats)
  assert.notStrictEqual(normalizeCoalitionPartners(seats), seats)
})

test('returns no coalitions for an inactive threshold', () => {
  const seats: SeatResult[] = [
    { partyAbbreviation: 'A', seats: 40, seatPosition: 1 },
  ]

  assert.deepEqual(calculateMinimalWinningCoalitions(seats, 0), [])
})
