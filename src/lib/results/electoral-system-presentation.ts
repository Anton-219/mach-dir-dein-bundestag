import type {
  ElectoralSystemId,
  ElectoralSystemResult,
} from '../election/index.ts'

export interface ElectoralSystemPresentation {
  systemId: ElectoralSystemId
  totalSeats: number
  majorityThreshold: number
  directSeats: number
  listSeats: number
  uncoveredDistrictWins: number
}

export function createElectoralSystemPresentation(
  result: ElectoralSystemResult,
): ElectoralSystemPresentation {
  return {
    systemId: result.systemId,
    totalSeats: result.totalSeats,
    majorityThreshold: result.majorityThreshold,
    directSeats: result.parties.reduce(
      (total, party) => total + party.directSeats,
      0,
    ),
    listSeats: result.parties.reduce(
      (total, party) => total + party.listSeats,
      0,
    ),
    uncoveredDistrictWins: result.parties.reduce(
      (total, party) => total + party.uncoveredDistrictWins,
      0,
    ),
  }
}
