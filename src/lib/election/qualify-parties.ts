import type { ElectionResult } from '../../models/calculation-results.ts'
import { DEFAULT_PARTY_QUALIFICATION_RULES } from './constants.ts'
import type { ElectoralScenario } from './electoral-system-types.ts'
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
    electionResult.percentage >= rules.voteShareThreshold ||
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

export function isScenarioPartyEligible(
  party: string,
  scenario: ElectoralScenario,
  directWins: number,
  rules: PartyQualificationRules = DEFAULT_PARTY_QUALIFICATION_RULES,
): boolean {
  const result = scenario.parties[party]
  if (
    result === undefined ||
    scenario.validSecondVotes <= 0 ||
    rules.excludedParties.includes(party)
  ) {
    return false
  }

  if (
    result.isNationalMinorityParty ||
    rules.thresholdExemptParties.includes(party)
  ) {
    return true
  }

  return (
    result.secondVotes / scenario.validSecondVotes >= rules.voteShareThreshold ||
    directWins >= rules.minimumDirectMandates
  )
}
