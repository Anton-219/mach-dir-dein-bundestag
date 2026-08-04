import type {
  DistrictWinner,
  DistrictWinnerResolution,
  ElectoralScenario,
  ElectoralSystemWarning,
} from './electoral-system-types.ts'

function compareStableKeys(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

export function resolveDistrictWinners(
  scenario: ElectoralScenario,
): DistrictWinnerResolution {
  const winners: DistrictWinner[] = []
  const directWinsByParty = new Map<string, number>()
  const tiedDistrictIds: string[] = []

  for (const district of scenario.districts) {
    if (district.validFirstVotes === 0) {
      continue
    }

    const results = Object.entries(district.firstVotesByParty)
      .filter(([, votes]) => votes > 0)
      .sort(([left], [right]) => compareStableKeys(left, right))
    if (results.length === 0) {
      throw new RangeError(
        `District ${district.districtId} has valid first votes but no positive party total.`,
      )
    }

    const highestVotes = Math.max(...results.map(([, votes]) => votes))
    const tiedParties = results
      .filter(([, votes]) => votes === highestVotes)
      .map(([party]) => party)
    const party = tiedParties[0]
    if (party === undefined) {
      throw new RangeError(`District ${district.districtId} has no resolvable winner.`)
    }
    if (tiedParties.length > 1) {
      tiedDistrictIds.push(String(district.districtId))
    }

    winners.push({
      districtId: district.districtId,
      state: district.state,
      party,
      firstVotes: highestVotes,
      validFirstVotes: district.validFirstVotes,
      firstVoteShare: highestVotes / district.validFirstVotes,
    })
    directWinsByParty.set(party, (directWinsByParty.get(party) ?? 0) + 1)
  }

  const warnings: ElectoralSystemWarning[] = []
  if (tiedDistrictIds.length > 0) {
    warnings.push({
      code: 'DISTRICT_TIE_REPLACED_BY_STABLE_ORDER',
      details: { districtIds: tiedDistrictIds },
    })
  }

  return {
    winners,
    directWinsByParty: Object.fromEntries(
      [...directWinsByParty].sort(([left], [right]) =>
        compareStableKeys(left, right),
      ),
    ),
    allocatedDistrictCount: winners.length,
    emptyDistrictCount: scenario.districts.length - winners.length,
    warnings,
  }
}
