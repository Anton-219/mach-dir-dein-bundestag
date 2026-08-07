import {
  ELECTION_YEARS,
  isElectionYear,
  type ElectionYear,
} from '../../data/elections.ts'
import { getElectionCopy } from '../../i18n/election-messages.ts'
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
    <select
      className="electoral-system-select election-select"
      value={electionYear}
      aria-label={i18n.messages.scenario.election}
      onChange={(event) => {
        const nextYear = Number(event.currentTarget.value)
        if (isElectionYear(nextYear)) {
          onChange(nextYear)
        }
      }}
    >
      {ELECTION_YEARS.map((year) => (
        <option value={year} key={year}>
          {getElectionCopy(i18n.locale, year).confirmedResult}
        </option>
      ))}
    </select>
  )
}
