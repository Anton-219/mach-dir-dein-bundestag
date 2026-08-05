import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

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

interface RegressionSummary {
  totalSeats: number
  majorityThreshold: number
  parties: Readonly<Record<string, {
    totalSeats: number
    directWins: number
    listSeats: number
  }>>
}

const ALL_AGE_GROUPS: readonly AgeGroup[] = [
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65+',
]

async function readJson<T>(fileName: string): Promise<T> {
  const filePath = join(process.cwd(), 'public', 'data', fileName)
  return JSON.parse(await readFile(filePath, 'utf8')) as T
}

async function loadRegressionData(): Promise<RegressionData> {
  const [parties, firstVotes, secondVotes, contingentFixture] =
    await Promise.all([
      readJson<Party[]>('partyData.json'),
      readJson<VoteEntry[]>('first_votes.json'),
      readJson<VoteEntry[]>('second_votes.json'),
      readJson<StateSeatContingentFixture>(
        'state_seat_contingents_2021.json',
      ),
    ])

  return {
    parties,
    firstVotes,
    secondVotes,
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
        .sort((left, right) => left.party.localeCompare(right.party))
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

const data = await loadRegressionData()
const reference = createElectoralScenarioReference({
  firstVotes: data.firstVotes,
  secondVotes: data.secondVotes,
  parties: data.parties,
})

test('reproduces the complete 2021 result from the prepared vote files', () => {
  const result = calculateScenario(
    data,
    reference,
    'de-2021-bwahlg',
    createEmptyFilterState(),
  )

  assert.deepEqual(summarize(result), {
    totalSeats: 736,
    majorityThreshold: 369,
    parties: {
      AfD: { totalSeats: 83, directWins: 16, listSeats: 67 },
      CDU: { totalSeats: 152, directWins: 98, listSeats: 54 },
      CSU: { totalSeats: 45, directWins: 45, listSeats: 0 },
      FDP: { totalSeats: 92, directWins: 0, listSeats: 92 },
      GRÜNE: { totalSeats: 118, directWins: 16, listSeats: 102 },
      'DIE LINKE': { totalSeats: 39, directWins: 3, listSeats: 36 },
      SPD: { totalSeats: 206, directWins: 121, listSeats: 85 },
      SSW: { totalSeats: 1, directWins: 0, listSeats: 1 },
    },
  })
})

test('keeps the extreme young male in-person scenario stable', () => {
  const filters: FilterState = {
    states: [],
    ageGroups: ALL_AGE_GROUPS.filter((ageGroup) => ageGroup !== '18-24'),
    genders: ['w'],
    electionMethods: ['postal'],
  }
  const historicalResult = calculateScenario(
    data,
    reference,
    'de-2021-bwahlg',
    filters,
  )
  const fixedResult = calculateScenario(
    data,
    reference,
    'de-2023-fixed-630',
    filters,
  )

  assert.equal(historicalResult.totalSeats, 1_445)
  assert.equal(historicalResult.majorityThreshold, 723)
  assert.equal(fixedResult.totalSeats, 630)
  assert.equal(fixedResult.majorityThreshold, 316)
  assert.ok(
    historicalResult.parties.every(
      (party) => party.totalSeats === party.directSeats + party.listSeats,
    ),
  )
  console.log(
    `REGRESSION young-male-in-person ${JSON.stringify(summarize(historicalResult))}`,
  )
})

test('calculates previously fragile filters from the prepared vote files', () => {
  const scenarios: Readonly<Record<string, FilterState>> = {
    'without-age-45-54': {
      ...createEmptyFilterState(),
      ageGroups: ['45-54'],
    },
    'postal-only': {
      ...createEmptyFilterState(),
      electionMethods: ['in-person'],
    },
    'without-hessen': {
      ...createEmptyFilterState(),
      states: ['Hessen'],
    },
  }

  for (const [name, filters] of Object.entries(scenarios)) {
    const historicalResult = calculateScenario(
      data,
      reference,
      'de-2021-bwahlg',
      filters,
    )
    const fixedResult = calculateScenario(
      data,
      reference,
      'de-2023-fixed-630',
      filters,
    )

    assert.ok(historicalResult.totalSeats >= 598)
    assert.equal(
      historicalResult.majorityThreshold,
      Math.floor(historicalResult.totalSeats / 2) + 1,
    )
    assert.equal(fixedResult.totalSeats, 630)
    assert.equal(fixedResult.majorityThreshold, 316)
    console.log(
      `REGRESSION ${name} ${JSON.stringify(summarize(historicalResult))}`,
    )
  }
})
