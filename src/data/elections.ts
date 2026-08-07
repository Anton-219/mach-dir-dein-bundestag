export const ELECTION_YEARS = [2021, 2025] as const

export type ElectionYear = (typeof ELECTION_YEARS)[number]

export const DEFAULT_ELECTION_YEAR: ElectionYear = 2021

export function isElectionYear(value: number): value is ElectionYear {
  return (ELECTION_YEARS as readonly number[]).includes(value)
}
