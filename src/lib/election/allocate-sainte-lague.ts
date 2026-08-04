import {
  ElectoralSystemCalculationError,
  type ElectoralSystemWarning,
} from './electoral-system-types.ts'

export interface SainteLagueInput {
  key: string
  votes: number
}

export interface SainteLagueAllocation {
  key: string
  seats: number
}

export interface SainteLagueResult {
  allocations: readonly SainteLagueAllocation[]
  warnings: readonly ElectoralSystemWarning[]
}

function compareStableKeys(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

export function allocateSainteLague(
  inputs: readonly SainteLagueInput[],
  seatCount: number,
): SainteLagueResult {
  if (!Number.isInteger(seatCount) || seatCount < 0) {
    throw new RangeError('The seat count must be a non-negative integer.')
  }

  const sortedInputs = [...inputs].sort((left, right) =>
    compareStableKeys(left.key, right.key),
  )
  const seenKeys = new Set<string>()
  let totalVotes = 0
  for (const input of sortedInputs) {
    if (!input.key || seenKeys.has(input.key)) {
      throw new RangeError(
        'Sainte-Laguë allocation keys must be unique and non-empty.',
      )
    }
    seenKeys.add(input.key)
    if (!Number.isFinite(input.votes) || input.votes < 0) {
      throw new RangeError(
        `Votes for ${input.key} must be finite and non-negative.`,
      )
    }
    totalVotes += input.votes
  }

  const seatsByKey = new Map(sortedInputs.map((input) => [input.key, 0]))
  if (seatCount === 0) {
    return {
      allocations: sortedInputs.map((input) => ({ key: input.key, seats: 0 })),
      warnings: [],
    }
  }
  if (totalVotes <= 0) {
    throw new ElectoralSystemCalculationError(
      'NO_VALID_SECOND_VOTES',
      'A positive seat pool cannot be allocated without positive votes.',
    )
  }

  const tiedKeys = new Set<string>()
  for (let seat = 0; seat < seatCount; seat += 1) {
    let highestQuotient = -1
    let candidates: string[] = []

    for (const input of sortedInputs) {
      const allocatedSeats = seatsByKey.get(input.key) ?? 0
      const quotient = input.votes / (2 * allocatedSeats + 1)
      if (quotient > highestQuotient) {
        highestQuotient = quotient
        candidates = [input.key]
      } else if (quotient === highestQuotient) {
        candidates.push(input.key)
      }
    }

    const winner = candidates[0]
    if (winner === undefined || highestQuotient <= 0) {
      throw new ElectoralSystemCalculationError(
        'NO_VALID_SECOND_VOTES',
        'The remaining seat pool has no positive allocation quotient.',
      )
    }
    if (candidates.length > 1) {
      for (const key of candidates) {
        tiedKeys.add(key)
      }
    }
    seatsByKey.set(winner, (seatsByKey.get(winner) ?? 0) + 1)
  }

  const warnings: ElectoralSystemWarning[] = []
  if (tiedKeys.size > 0) {
    warnings.push({
      code: 'LEGAL_LOT_REPLACED_BY_STABLE_ORDER',
      details: { allocationKeys: [...tiedKeys].sort(compareStableKeys) },
    })
  }

  return {
    allocations: sortedInputs.map((input) => ({
      key: input.key,
      seats: seatsByKey.get(input.key) ?? 0,
    })),
    warnings,
  }
}
