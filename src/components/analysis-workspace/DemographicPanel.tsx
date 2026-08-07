import { useMemo } from 'react'

import { useI18n } from '../../i18n/index.ts'
import type { FilterState } from '../../lib/filters/index.ts'
import type {
  AgeGroup,
  ElectionMethod,
  Gender,
  VoteEntry,
} from '../../models/json-contracts.ts'

const ageGroups = [
  { value: '70+', label: '70+' },
  { value: '60-69', label: '60–69' },
  { value: '45-59', label: '45–59' },
  { value: '35-44', label: '35–44' },
  { value: '25-34', label: '25–34' },
  { value: '18-24', label: '18–24' },
] as const satisfies readonly { value: AgeGroup; label: string }[]

/**
 * Aggregates the demographic reference distribution from the prepared
 * second-vote records in a single pass. The panel shows the unfiltered
 * electorate, so the caller passes the raw records and the filter state only
 * mutes the affected bars.
 */
function buildDemographicTotals(secondVotes: readonly VoteEntry[]) {
  const ageGenderTotals: Record<Gender, Record<AgeGroup, number>> = {
    m: {
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45-59': 0,
      '60-69': 0,
      '70+': 0,
    },
    w: {
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45-59': 0,
      '60-69': 0,
      '70+': 0,
    },
  }
  const methodTotals: Record<ElectionMethod, number> = {
    postal: 0,
    'in-person': 0,
  }

  for (const entry of secondVotes) {
    ageGenderTotals[entry.gender][entry.ageGroup] += entry.votes
    methodTotals[entry.electionMethod] += entry.votes
  }

  return { ageGenderTotals, methodTotals }
}

export function DemographicPanel({
  secondVotes,
  filters,
}: {
  secondVotes: readonly VoteEntry[]
  filters: FilterState
}) {
  const { messages, formatPercent } = useI18n()
  const { ageGenderTotals, methodTotals } = useMemo(
    () => buildDemographicTotals(secondVotes),
    [secondVotes],
  )
  const maximumAgeGenderValue = Math.max(
    1,
    ...ageGroups.flatMap(({ value }) => [
      ageGenderTotals.m[value],
      ageGenderTotals.w[value],
    ]),
  )
  const totalMethodVotes = methodTotals.postal + methodTotals['in-person']
  const postalShare = totalMethodVotes > 0 ? methodTotals.postal / totalMethodVotes : 0
  const inPersonShare = totalMethodVotes > 0 ? methodTotals['in-person'] / totalMethodVotes : 0

  return (
    <section
      className="workspace-panel demographic-panel"
      aria-labelledby="demographic-title"
    >
      <div className="panel-heading demographic-heading">
        <div>
          <p className="panel-kicker">{messages.demographics.kicker}</p>
          <h2 id="demographic-title">{messages.demographics.title}</h2>
        </div>
        <span className="panel-badge">{messages.demographics.badge}</span>
      </div>

      <div className="demographic-content">
        <figure className="age-gender-chart">
          <figcaption>{messages.demographics.ageGenderTitle}</figcaption>
          <p className="visually-hidden">
            {messages.demographics.ageGenderDescription}
          </p>
          <div className="age-gender-plot" aria-hidden="true">
            {ageGroups.map(({ value, label }) => {
              const ageExcluded = filters.ageGroups.includes(value)
              const menExcluded = ageExcluded || filters.genders.includes('m')
              const womenExcluded = ageExcluded || filters.genders.includes('w')

              return (
                <div className="age-gender-row" key={value}>
                  <div className="age-gender-side age-gender-side-men">
                    <span
                      className={`demographic-bar${menExcluded ? ' demographic-bar-excluded' : ''}`}
                      style={{
                        width: `${(ageGenderTotals.m[value] / maximumAgeGenderValue) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="age-gender-label">{label}</span>
                  <div className="age-gender-side age-gender-side-women">
                    <span
                      className={`demographic-bar${womenExcluded ? ' demographic-bar-excluded' : ''}`}
                      style={{
                        width: `${(ageGenderTotals.w[value] / maximumAgeGenderValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="demographic-axis" aria-hidden="true">
            <span>{messages.demographics.men}</span>
            <span>{messages.demographics.women}</span>
          </div>
        </figure>

        <figure className="method-chart">
          <figcaption>{messages.demographics.votingMethod}</figcaption>
          <div className="method-track" aria-hidden="true">
            <span
              className={`method-segment method-segment-postal${filters.electionMethods.includes('postal') ? ' demographic-bar-excluded' : ''}`}
              style={{ width: `${postalShare * 100}%` }}
            />
            <span
              className={`method-segment method-segment-in-person${filters.electionMethods.includes('in-person') ? ' demographic-bar-excluded' : ''}`}
              style={{ width: `${inPersonShare * 100}%` }}
            />
          </div>
          <div className="method-labels">
            <span>
              <strong>{messages.demographics.postal}</strong>
              {formatPercent(postalShare)}
            </span>
            <span>
              <strong>{messages.demographics.inPerson}</strong>
              {formatPercent(inPersonShare)}
            </span>
          </div>
        </figure>
      </div>
    </section>
  )
}
