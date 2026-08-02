import type { SeatResult } from '../../models/calculation-results.ts'

const CDU = 'CDU'
const CSU = 'CSU'
const CDU_CSU_UNION = 'CDU+CSU'

export function normalizeCoalitionPartners(
  seatResults: readonly SeatResult[],
): SeatResult[] {
  const hasCdu = seatResults.some(
    (result) => result.partyAbbreviation === CDU,
  )
  const hasCsu = seatResults.some(
    (result) => result.partyAbbreviation === CSU,
  )

  if (!hasCdu || !hasCsu) {
    return [...seatResults]
  }

  const normalized = new Map<string, SeatResult>()

  for (const result of seatResults) {
    const partyAbbreviation =
      result.partyAbbreviation === CDU || result.partyAbbreviation === CSU
        ? CDU_CSU_UNION
        : result.partyAbbreviation
    const existing = normalized.get(partyAbbreviation)

    if (existing) {
      normalized.set(partyAbbreviation, {
        ...existing,
        seats: existing.seats + result.seats,
      })
      continue
    }

    normalized.set(partyAbbreviation, {
      ...result,
      partyAbbreviation,
    })
  }

  return [...normalized.values()]
}
