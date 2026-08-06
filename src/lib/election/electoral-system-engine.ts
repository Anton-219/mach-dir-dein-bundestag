import type { SeatResult } from '../../models/calculation-results.ts'
import type { Party } from '../../models/json-contracts.ts'
import { validateElectoralScenario } from './build-electoral-scenario.ts'
import {
  ELECTORAL_SYSTEM_IDS,
  ElectoralSystemCalculationError,
  type ElectoralScenario,
  type ElectoralSystemCalculationInput,
  type ElectoralSystemCalculator,
  type ElectoralSystemId,
  type ElectoralSystemResult,
  type ElectoralSystemSupportingData,
  type ElectoralSystemWarning,
} from './electoral-system-types.ts'
import { fixed630Calculator } from './fixed-630-calculator.ts'
import { parallelCalculator } from './parallel-calculator.ts'
import { pre2023Calculator } from './pre-2023-calculator.ts'
import { resolveDistrictWinners } from './resolve-district-winners.ts'

export const DEFAULT_ELECTORAL_SYSTEM_ID: ElectoralSystemId =
  'de-2023-fixed-630'

export type ElectoralSystemRegistryErrorCode =
  | 'INVALID_ELECTORAL_SYSTEM_ID'
  | 'UNREGISTERED_ELECTORAL_SYSTEM'

export class ElectoralSystemRegistryError extends RangeError {
  readonly code: ElectoralSystemRegistryErrorCode
  readonly systemId: string

  constructor(
    code: ElectoralSystemRegistryErrorCode,
    systemId: string,
    message: string,
  ) {
    super(message)
    this.name = 'ElectoralSystemRegistryError'
    this.code = code
    this.systemId = systemId
  }
}

function compareStableKeys(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

export function isElectoralSystemId(value: string): value is ElectoralSystemId {
  return (ELECTORAL_SYSTEM_IDS as readonly string[]).includes(value)
}

export class ElectoralSystemRegistry {
  readonly calculators: ReadonlyMap<ElectoralSystemId, ElectoralSystemCalculator>

  constructor(calculators: readonly ElectoralSystemCalculator[]) {
    const byId = new Map<ElectoralSystemId, ElectoralSystemCalculator>()
    for (const calculator of calculators) {
      if (byId.has(calculator.systemId)) {
        throw new RangeError(
          `Electoral system ${calculator.systemId} is registered twice.`,
        )
      }
      byId.set(calculator.systemId, calculator)
    }
    this.calculators = byId
  }

  get(systemId: string): ElectoralSystemCalculator {
    if (!isElectoralSystemId(systemId)) {
      throw new ElectoralSystemRegistryError(
        'INVALID_ELECTORAL_SYSTEM_ID',
        systemId,
        `Unknown electoral-system identifier ${systemId}.`,
      )
    }
    const calculator = this.calculators.get(systemId)
    if (calculator === undefined) {
      throw new ElectoralSystemRegistryError(
        'UNREGISTERED_ELECTORAL_SYSTEM',
        systemId,
        `Electoral system ${systemId} has no registered calculator.`,
      )
    }
    return calculator
  }
}

function deduplicateWarnings(
  warnings: readonly ElectoralSystemWarning[],
): ElectoralSystemWarning[] {
  const seen = new Set<string>()
  return warnings.filter((warning) => {
    const key = `${warning.code}:${JSON.stringify(warning.details ?? {})}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function invalidResult(message: string): never {
  throw new RangeError(`Invalid electoral-system result: ${message}`)
}

export function normalizeElectoralSystemResult(
  result: ElectoralSystemResult,
  scenario: ElectoralScenario,
): ElectoralSystemResult {
  if (!Number.isInteger(result.totalSeats) || result.totalSeats <= 0) {
    invalidResult('the total seat count must be a positive integer')
  }
  const expectedMajority = Math.floor(result.totalSeats / 2) + 1
  if (result.majorityThreshold !== expectedMajority) {
    invalidResult('the majority threshold does not match the total seat count')
  }

  const parties = [...result.parties].sort(
    (left, right) =>
      right.totalSeats - left.totalSeats ||
      compareStableKeys(left.party, right.party),
  )
  const seenParties = new Set<string>()
  let totalSeats = 0
  let directWins = 0
  for (const party of parties) {
    if (!party.party || seenParties.has(party.party)) {
      invalidResult('party identifiers must be unique and non-empty')
    }
    seenParties.add(party.party)
    if (!Number.isFinite(party.secondVotes) || party.secondVotes < 0) {
      invalidResult(
        `second votes for ${party.party} must be finite and non-negative`,
      )
    }
    for (const seats of [
      party.totalSeats,
      party.directWins,
      party.directSeats,
      party.listSeats,
      party.uncoveredDistrictWins,
    ]) {
      if (!Number.isInteger(seats) || seats < 0) {
        invalidResult(
          `seat values for ${party.party} must be non-negative integers`,
        )
      }
    }
    if (party.totalSeats !== party.directSeats + party.listSeats) {
      invalidResult(
        `total seats do not match direct and list seats for ${party.party}`,
      )
    }
    if (party.directWins !== party.directSeats + party.uncoveredDistrictWins) {
      invalidResult(
        `direct wins do not match covered and uncovered wins for ${party.party}`,
      )
    }
    totalSeats += party.totalSeats
    directWins += party.directWins
  }

  if (totalSeats !== result.totalSeats) {
    invalidResult('party seats do not add up to the parliament total')
  }
  if (directWins !== result.metadata.allocatedDirectSeatCount) {
    invalidResult(
      'party direct wins do not match allocated-district metadata',
    )
  }
  if (
    result.metadata.emptyDistrictCount !==
    scenario.districts.length - result.metadata.allocatedDirectSeatCount
  ) {
    invalidResult('empty-district metadata does not match the scenario')
  }

  return {
    ...result,
    parties,
    warnings: deduplicateWarnings(result.warnings),
    metadata: {
      ...result.metadata,
      inactiveStates: [...result.metadata.inactiveStates].sort(
        compareStableKeys,
      ),
    },
  }
}

export const DEFAULT_ELECTORAL_SYSTEM_REGISTRY = new ElectoralSystemRegistry([
  pre2023Calculator,
  fixed630Calculator,
  parallelCalculator,
])

export function calculateElectoralSystem(
  systemId: string,
  scenario: ElectoralScenario,
  supportingData?: ElectoralSystemSupportingData,
  registry: ElectoralSystemRegistry = DEFAULT_ELECTORAL_SYSTEM_REGISTRY,
): ElectoralSystemResult {
  validateElectoralScenario(scenario)
  if (scenario.validSecondVotes <= 0) {
    throw new ElectoralSystemCalculationError(
      'NO_VALID_SECOND_VOTES',
      'The scenario contains no valid second votes.',
    )
  }

  const resolution = resolveDistrictWinners(scenario)
  const input: ElectoralSystemCalculationInput = {
    scenario,
    districtWinners: resolution.winners,
    directWinsByParty: resolution.directWinsByParty,
    supportingData,
  }
  const calculator = registry.get(systemId)
  const calculated = calculator.calculate(input)
  if (calculated.systemId !== calculator.systemId) {
    invalidResult(
      'the calculator returned a result for a different electoral system',
    )
  }

  return normalizeElectoralSystemResult(
    {
      ...calculated,
      warnings: [...resolution.warnings, ...calculated.warnings],
    },
    scenario,
  )
}

export function toSeatResults(
  result: ElectoralSystemResult,
  parties: readonly Party[],
): SeatResult[] {
  const seatPositions = new Map(
    parties.map((party) => [party.abbreviation, party.seatPosition]),
  )
  return result.parties
    .filter((party) => party.totalSeats > 0)
    .map((party) => ({
      partyAbbreviation: party.party,
      seats: party.totalSeats,
      seatPosition: seatPositions.get(party.party) ?? 999,
    }))
}