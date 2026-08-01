import type {
  AgeGroup,
  DirectMandateWinnerJson,
  ElectionMethod,
  Gender,
  Party,
  StatVotes,
  VoteEntry,
  VoteType,
} from './json-contracts.ts'

/**
 * Compile-time compatibility fixtures copied from representative restored JSON
 * records. This file is included by the app TypeScript build, so incompatible
 * contract changes fail compilation without adding a runtime test dependency.
 */

export const genderValues = ['m', 'w'] as const satisfies readonly Gender[]

export const ageGroupValues = [
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65+',
] as const satisfies readonly AgeGroup[]

export const voteTypeValues = ['1', '2'] as const satisfies readonly VoteType[]

export const electionMethodValues = [
  'postal',
  'in-person',
] as const satisfies readonly ElectionMethod[]

export const representativePartyRecord = {
  name: 'Sozialdemokratische Partei Deutschlands',
  abbreviation: 'SPD',
  color: '#E3000F',
  seatPosition: -15,
} satisfies Party

export const representativeDirectMandateRecord = {
  party: 'SPD',
  districts_won: 121,
} satisfies DirectMandateWinnerJson

export const representativeVoteEntryRecord = {
  state: 'Schleswig-Holstein',
  gender: 'm',
  ageGroup: '18-24',
  party: 'CDU',
  voteType: '2',
  electionMethod: 'in-person',
  votes: 3696.789641579922,
} satisfies VoteEntry

export const representativeStatVotesRecord = {
  gender: 'm',
  ageGroup: '18-24',
  party: 'CDU',
  votes: 144724,
} satisfies StatVotes
