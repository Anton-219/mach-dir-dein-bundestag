import { ELECTION_YEARS, type ElectionYear } from '../../data/elections.ts'
import { getElectionSelectionLabel } from '../../i18n/election-messages.ts'
import { useI18n } from '../../i18n/index.ts'

interface ElectionSelectorProps {
  electionYear: ElectionYear
  onChange: (electionYear: ElectionYear) => void
}

export function ElectionSelector({
  electionYear,
  onChange,
}: ElectionSelectorProps) {
  const i18n = useI18n()

  return (
    <fieldset
      className="scenario-link-options"
      aria-label={getElectionSelectionLabel(i18n.locale)}
    >
      {ELECTION_YEARS.map((year, index) => (
        <span className="scenario-link-option-wrap" key={year}>
          {index > 0 ? (
            <span className="scenario-link-separator" aria-hidden="true">
              |
            </span>
          ) : null}
          <button
            className={`scenario-link-option${year === electionYear ? ' scenario-link-option-active' : ''}`}
            type="button"
            aria-pressed={year === electionYear}
            onClick={() => onChange(year)}
          >
            {year}
          </button>
        </span>
      ))}
    </fieldset>
  )
}
