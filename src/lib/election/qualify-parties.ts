import type { ElectionResult } from '../../models/calculation-results.ts'
import { DEFAULT_PARTY_QUALIFICATION_RULES } from './constants.ts'
import type {
  DirectMandateCount,
  PartyQualificationRules,
} from './types.ts'

export function isPartyEligible(
  electionResult: ElectionResult,
  directMandates: readonly DirectMandateCount[],
  rules: PartyQualificationRules = DEFAULT_PARTY_QUALIFICATION_RULES,
): boolean {
  if (rules.excludedParties.includes(electionResult.partyAbbreviation)) {
    return false
  }

  if (rules.thresholdExemptParties.includes(electionResult.partyAbbreviation)) {
    return true
  }

  const directMandateCount = directMandates.find(
    (result) => result.party === electionResult.partyAbbreviation,
  )?.districtsWon

  return (
    electionResult.percentage > rules.voteShareThreshold ||
    (directMandateCount ?? 0) >= rules.minimumDirectMandates
  )
}

export function filterEligibleParties(
  electionResults: readonly ElectionResult[],
  directMandates: readonly DirectMandateCount[],
  rules: PartyQualificationRules = DEFAULT_PARTY_QUALIFICATION_RULES,
): ElectionResult[] {
  return electionResults.filter((result) =>
    isPartyEligible(result, directMandates, rules),
  )
}
