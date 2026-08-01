import type { FilterState } from '../../lib/filters/index.ts'
import type {
  AgeGroup,
  Gender,
  StatVotes,
  VoteEntry,
} from '../../models/json-contracts.ts'

const ageGroups = [
  { value: '65+', label: '65+' },
  { value: '55-64', label: '55–64' },
  { value: '45-54', label: '45–54' },
  { value: '35-44', label: '35–44' },
  { value: '25-34', label: '25–34' },
  { value: '18-24', label: '18–24' },
] as const satisfies readonly { value: AgeGroup; label: string }[]

function formatShare(value: number, total: number) {
  return (total > 0 ? value / total : 0).toLocaleString('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
  })
}

function buildAgeGenderTotals(statVotes: readonly StatVotes[]) {
  const totals: Record<Gender, Record<AgeGroup, number>> = {
    m: {
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45-54': 0,
      '55-64': 0,
      '65+': 0,
    },
    w: {
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45-54': 0,
      '55-64': 0,
      '65+': 0,
    },
  }

  for (const entry of statVotes) {
    totals[entry.gender][entry.ageGroup] += entry.votes
  }

  return totals
}

export function DemographicPanel({
  statVotes,
  secondVotes,
  filters,
}: {
  statVotes: readonly StatVotes[]
  secondVotes: readonly VoteEntry[]
  filters: FilterState
}) {
  const ageGenderTotals = buildAgeGenderTotals(statVotes)
  const maximumAgeGenderValue = Math.max(
    1,
    ...ageGroups.flatMap(({ value }) => [
      ageGenderTotals.m[value],
      ageGenderTotals.w[value],
    ]),
  )
  const methodTotals = secondVotes.reduce(
    (totals, entry) => {
      totals[entry.electionMethod] += entry.votes
      return totals
    },
    { postal: 0, 'in-person': 0 },
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
          <p className="panel-kicker">Electorate context</p>
          <h2 id="demographic-title">Demographics</h2>
        </div>
        <span className="panel-badge">Reference data</span>
      </div>

      <div className="demographic-content">
        <figure className="age-gender-chart">
          <figcaption>Age and gender distribution</figcaption>
          <p className="visually-hidden">
            Reference distribution by age group and recorded gender. Excluded filter
            values are visually muted; the filter controls provide the current selection
            state.
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
            <span>Men</span>
            <span>Women</span>
          </div>
        </figure>

        <figure className="method-chart">
          <figcaption>Voting method</figcaption>
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
              <strong>Postal</strong>
              {formatShare(methodTotals.postal, totalMethodVotes)}
            </span>
            <span>
              <strong>In person</strong>
              {formatShare(methodTotals['in-person'], totalMethodVotes)}
            </span>
          </div>
        </figure>
      </div>
    </section>
  )
}
