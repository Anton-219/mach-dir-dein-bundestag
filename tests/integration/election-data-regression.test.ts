import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

import {
  decodeBinaryVoteEntries,
  parseVoteDataManifest,
} from '../../src/lib/data/binary-vote-format.ts'
import {
  buildElectoralScenario,
  calculateElectoralSystem,
  createElectoralScenarioReference,
  type ElectoralSystemId,
  type ElectoralSystemResult,
} from '../../src/lib/election/index.ts'
import {
  applyFilterState,
  createEmptyFilterState,
  type FilterState,
} from '../../src/lib/filters/index.ts'
import type {
  AgeGroup,
  Party,
  VoteEntry,
} from '../../src/models/json-contracts.ts'

interface StateSeatContingentFixture {
  electionYear: number
  stateSeatContingents: readonly {
    state: string
    seats: number
  }[]
}

interface RegressionData {
  parties: readonly Party[]
  firstVotes: readonly VoteEntry[]
  secondVotes: readonly VoteEntry[]
  stateSeatContingents: Readonly<Record<string, number>>
  stateSeatContingentYear: number
}

interface PartyRegressionSummary {
  totalSeats: number
  directWins: number
  listSeats: number
}

interface RegressionSummary {
  totalSeats: number
  majorityThreshold: number
  parties: Readonly<Record<string, PartyRegressionSummary>>
}

interface RegressionCase {
  name: string
  filters: FilterState
  expectedHistoricalResult: RegressionSummary
}

const ALL_AGE_GROUPS: readonly AgeGroup[] = [
  '18-24',
  '25-34',
  '35-44',
  '45-59',
  '60-69',
  '70+',
]

function dataPath(fileName: string): string {
  return join(process.cwd(), 'public', 'data', fileName)
}

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await readFile(dataPath(fileName), 'utf8')) as T
}

async function readBinary(fileName: string): Promise<ArrayBuffer> {
  const buffer = await readFile(dataPath(fileName))
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer
}

async function loadRegressionData(): Promise<RegressionData> {
  const [parties, manifestJson, contingentFixture] = await Promise.all([
    readJson<Party[]>('partyData.json'),
    readJson<unknown>('btw2021/vote_data.json'),
    readJson<StateSeatContingentFixture>('state_seat_contingents_2021.json'),
  ])
  const manifest = parseVoteDataManifest(manifestJson, 'btw2021/vote_data.json')
  const [firstVotesBuffer, secondVotesBuffer] = await Promise.all([
    readBinary(`btw2021/${manifest.files.firstVotes.file}`),
    readBinary(`btw2021/${manifest.files.secondVotes.file}`),
  ])

  return {
    parties,
    firstVotes: decodeBinaryVoteEntries(
      firstVotesBuffer,
      manifest.files.firstVotes,
      '1',
      `btw2021/${manifest.files.firstVotes.file}`,
    ),
    secondVotes: decodeBinaryVoteEntries(
      secondVotesBuffer,
      manifest.files.secondVotes,
      '2',
      `btw2021/${manifest.files.secondVotes.file}`,
    ),
    stateSeatContingents: Object.fromEntries(
      contingentFixture.stateSeatContingents.map(({ state, seats }) => [
        state,
        seats,
      ]),
    ),
    stateSeatContingentYear: contingentFixture.electionYear,
  }
}

function hasActiveFilters(filters: FilterState): boolean {
  return Object.values(filters).some((values) => values.length > 0)
}

function summarize(result: ElectoralSystemResult): RegressionSummary {
  return {
    totalSeats: result.totalSeats,
    majorityThreshold: result.majorityThreshold,
    parties: Object.fromEntries(
      result.parties
        .filter((party) => party.totalSeats > 0)
        .sort((left, right) =>
          left.party < right.party ? -1 : left.party > right.party ? 1 : 0,
        )
        .map((party) => [
          party.party,
          {
            totalSeats: party.totalSeats,
            directWins: party.directWins,
            listSeats: party.listSeats,
          },
        ]),
    ),
  }
}

function calculateScenario(
  data: RegressionData,
  reference: ReturnType<typeof createElectoralScenarioReference>,
  systemId: ElectoralSystemId,
  filters: FilterState,
): ElectoralSystemResult {
  const firstVotes = applyFilterState(data.firstVotes, filters)
  const secondVotes = applyFilterState(data.secondVotes, filters)
  const scenario = buildElectoralScenario({
    mode: hasActiveFilters(filters)
      ? 'filtered-model'
      : 'unfiltered-reference',
    firstVotes,
    secondVotes,
    reference,
    inactiveStates: filters.states,
  })

  return calculateElectoralSystem(systemId, scenario, {
    stateSeatContingents: data.stateSeatContingents,
    stateSeatContingentYear: data.stateSeatContingentYear,
  })
}

function assertSeatAccounting(result: ElectoralSystemResult): void {
  assert.ok(
    result.parties.every(
      (party) => party.totalSeats === party.directSeats + party.listSeats,
    ),
  )
  assert.equal(
    result.majorityThreshold,
    Math.floor(result.totalSeats / 2) + 1,
  )
}

const data = await loadRegressionData()
const reference = createElectoralScenarioReference({
  firstVotes: data.firstVotes,
  secondVotes: data.secondVotes,
  parties: data.parties,
})

const regressionCases: readonly RegressionCase[] = [
  {
    name: 'unfiltered prepared election data',
    filters: createEmptyFilterState(),
    expectedHistoricalResult: {
      // The committed files contain the result after the partial Berlin repeat
      // election, which reduced the FDP and total parliament size by one seat.
      totalSeats: 735,
      majorityThreshold: 368,
      parties: {
        AfD: { totalSeats: 83, directWins: 16, listSeats: 67 },
        CDU: { totalSeats: 152, directWins: 98, listSeats: 54 },
        CSU: { totalSeats: 45, directWins: 45, listSeats: 0 },
        'DIE LINKE': { totalSeats: 39, directWins: 3, listSeats: 36 },
        FDP: { totalSeats: 91, directWins: 0, listSeats: 91 },
        GRÜNE: { totalSeats: 118, directWins: 16, listSeats: 102 },
        SPD: { totalSeats: 206, directWins: 121, listSeats: 85 },
        SSW: { totalSeats: 1, directWins: 0, listSeats: 1 },
      },
    },
  },
  {
    name: 'only young male in-person voters',
    filters: {
      states: [],
      ageGroups: ALL_AGE_GROUPS.filter((ageGroup) => ageGroup !== '18-24'),
      genders: ['w'],
      electionMethods: ['postal'],
    },
    expectedHistoricalResult: {
      totalSeats: 1_445,
      majorityThreshold: 723,
      parties: {
        AfD: { totalSeats: 170, directWins: 31, listSeats: 139 },
        CDU: { totalSeats: 139, directWins: 11, listSeats: 128 },
        CSU: { totalSeats: 34, directWins: 34, listSeats: 0 },
        'DIE LINKE': { totalSeats: 121, directWins: 4, listSeats: 117 },
        FDP: { totalSeats: 438, directWins: 95, listSeats: 343 },
        GRÜNE: { totalSeats: 296, directWins: 52, listSeats: 244 },
        SPD: { totalSeats: 243, directWins: 72, listSeats: 171 },
        SSW: { totalSeats: 4, directWins: 0, listSeats: 4 },
      },
    },
  },
  {
    name: 'age group 45-59 excluded',
    filters: {
      ...createEmptyFilterState(),
      ageGroups: ['45-59'],
    },
    expectedHistoricalResult: {
      totalSeats: 721,
      majorityThreshold: 361,
      parties: {
        AfD: { totalSeats: 74, directWins: 11, listSeats: 63 },
        CDU: { totalSeats: 151, directWins: 99, listSeats: 52 },
        CSU: { totalSeats: 45, directWins: 45, listSeats: 0 },
        'DIE LINKE': { totalSeats: 41, directWins: 3, listSeats: 38 },
        FDP: { totalSeats: 90, directWins: 0, listSeats: 90 },
        GRÜNE: { totalSeats: 116, directWins: 16, listSeats: 100 },
        SPD: { totalSeats: 203, directWins: 125, listSeats: 78 },
        SSW: { totalSeats: 1, directWins: 0, listSeats: 1 },
      },
    },
  },
  {
    name: 'postal voting only',
    filters: {
      ...createEmptyFilterState(),
      electionMethods: ['in-person'],
    },
    expectedHistoricalResult: {
      totalSeats: 664,
      majorityThreshold: 333,
      parties: {
        AfD: { totalSeats: 49, directWins: 0, listSeats: 49 },
        CDU: { totalSeats: 137, directWins: 116, listSeats: 21 },
        CSU: { totalSeats: 51, directWins: 45, listSeats: 6 },
        'DIE LINKE': { totalSeats: 33, directWins: 3, listSeats: 30 },
        FDP: { totalSeats: 84, directWins: 0, listSeats: 84 },
        GRÜNE: { totalSeats: 121, directWins: 21, listSeats: 100 },
        SPD: { totalSeats: 188, directWins: 114, listSeats: 74 },
        SSW: { totalSeats: 1, directWins: 0, listSeats: 1 },
      },
    },
  },
  {
    name: 'Hessen excluded',
    filters: {
      ...createEmptyFilterState(),
      states: ['Hessen'],
    },
    expectedHistoricalResult: {
      totalSeats: 682,
      majorityThreshold: 342,
      parties: {
        AfD: { totalSeats: 78, directWins: 16, listSeats: 62 },
        CDU: { totalSeats: 139, directWins: 91, listSeats: 48 },
        CSU: { totalSeats: 45, directWins: 45, listSeats: 0 },
        'DIE LINKE': { totalSeats: 36, directWins: 3, listSeats: 33 },
        FDP: { totalSeats: 84, directWins: 0, listSeats: 84 },
        GRÜNE: { totalSeats: 109, directWins: 15, listSeats: 94 },
        SPD: { totalSeats: 190, directWins: 107, listSeats: 83 },
        SSW: { totalSeats: 1, directWins: 0, listSeats: 1 },
      },
    },
  },
]

for (const regressionCase of regressionCases) {
  test(`keeps ${regressionCase.name} stable`, () => {
    const historicalResult = calculateScenario(
      data,
      reference,
      'de-2021-bwahlg',
      regressionCase.filters,
    )
    const fixedResult = calculateScenario(
      data,
      reference,
      'de-2023-fixed-630',
      regressionCase.filters,
    )

    assert.deepEqual(
      summarize(historicalResult),
      regressionCase.expectedHistoricalResult,
    )
    assertSeatAccounting(historicalResult)
    assert.equal(fixedResult.totalSeats, 630)
    assert.equal(fixedResult.majorityThreshold, 316)
    assertSeatAccounting(fixedResult)
  })
}
