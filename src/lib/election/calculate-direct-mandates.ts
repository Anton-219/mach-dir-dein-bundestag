import type { VoteEntry } from '../../models/json-contracts.ts'
import type {
  DirectMandateCount,
  DistrictWinnerResolver,
} from './types.ts'

export const resolveDistrictWinner: DistrictWinnerResolver = (results) => {
  let winner: string | undefined
  let highestVotes = -1
  let hasTie = false

  for (const result of results) {
    if (!Number.isFinite(result.votes) || result.votes < 0) {
      throw new RangeError(
        `Votes for ${result.party} in district ${result.districtId} must be finite and non-negative.`,
      )
    }

    if (result.votes > highestVotes) {
      winner = result.party
      highestVotes = result.votes
      hasTie = false
    } else if (result.votes === highestVotes) {
      hasTie = true
    }
  }

  return hasTie ? undefined : winner
}

export function calculateDirectMandates(
  firstVotes: readonly VoteEntry[],
  resolveWinner: DistrictWinnerResolver = resolveDistrictWinner,
): DirectMandateCount[] {
  const votesByDistrict = new Map<number, Map<string, number>>()

  for (const entry of firstVotes) {
    if (entry.voteType !== '1') {
      throw new RangeError(
        `Direct mandates can only be calculated from first votes; district ${entry.districtId} contains vote type ${entry.voteType}.`,
      )
    }
    if (!Number.isInteger(entry.districtId) || entry.districtId <= 0) {
      throw new RangeError('District IDs must be positive integers.')
    }
    if (!entry.party) {
      throw new RangeError('Party identifiers must not be empty.')
    }
    if (!Number.isFinite(entry.votes) || entry.votes < 0) {
      throw new RangeError(
        `Votes for ${entry.party} in district ${entry.districtId} must be finite and non-negative.`,
      )
    }

    const districtVotes = votesByDistrict.get(entry.districtId) ?? new Map()
    districtVotes.set(
      entry.party,
      (districtVotes.get(entry.party) ?? 0) + entry.votes,
    )
    votesByDistrict.set(entry.districtId, districtVotes)
  }

  const winsByParty = new Map<string, number>()

  for (const [districtId, districtVotes] of votesByDistrict) {
    const results = [...districtVotes].map(([party, votes]) => ({
      districtId,
      party,
      votes,
    }))
    const winner = resolveWinner(results)

    if (winner === undefined) {
      continue
    }
    if (!districtVotes.has(winner)) {
      throw new RangeError(
        `The district winner resolver returned unknown party ${winner} for district ${districtId}.`,
      )
    }

    winsByParty.set(winner, (winsByParty.get(winner) ?? 0) + 1)
  }

  return [...winsByParty].map(([party, districtsWon]) => ({
    party,
    districtsWon,
  }))
}
