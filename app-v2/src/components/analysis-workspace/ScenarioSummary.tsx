import {
  countActiveFilterDimensions,
  summarizeFilterState,
  type FilterState,
} from '../../lib/filters/index.ts'
import type { DataState } from './types.ts'

function DataStatus({ dataState }: { dataState: DataState }) {
  if (dataState.status === 'loading') {
    return (
      <p className="scenario-data-status" aria-live="polite">
        Loading confirmed election data…
      </p>
    )
  }

  if (dataState.status === 'error') {
    return (
      <p className="scenario-data-status scenario-data-status-error" role="alert">
        <strong>Election data could not be loaded.</strong>{' '}
        <span>{dataState.message}</span>
      </p>
    )
  }

  return (
    <p className="scenario-data-status" aria-live="polite">
      Data ready · {dataState.data.parties.length} parties ·{' '}
      {dataState.data.secondVotes.length.toLocaleString('en-US')} vote entries
    </p>
  )
}

interface ScenarioSummaryProps {
  dataState: DataState
  filters: FilterState
  includedVotes: number
  totalVotes: number
  onReset: () => void
}

export function ScenarioSummary({
  dataState,
  filters,
  includedVotes,
  totalVotes,
  onReset,
}: ScenarioSummaryProps) {
  const activeDimensions = countActiveFilterDimensions(filters)
  const includedShare = totalVotes === 0 ? 0 : includedVotes / totalVotes

  return (
    <section className="scenario-summary" aria-labelledby="scenario-title">
      <div className="scenario-title-group">
        <p className="panel-kicker">Active scenario</p>
        <h2 id="scenario-title">{summarizeFilterState(filters)}</h2>
      </div>

      <dl className="scenario-facts">
        <div>
          <dt>Election</dt>
          <dd>2021 confirmed result</dd>
        </div>
        <div>
          <dt>Filters</dt>
          <dd>{activeDimensions === 0 ? 'None active' : `${activeDimensions} active`}</dd>
        </div>
        <div>
          <dt>Included votes</dt>
          <dd>
            {includedVotes.toLocaleString('en-US')} ·{' '}
            {includedShare.toLocaleString('en-US', {
              style: 'percent',
              maximumFractionDigits: 1,
            })}
          </dd>
        </div>
      </dl>

      <DataStatus dataState={dataState} />

      <button
        className="secondary-action"
        type="button"
        disabled={activeDimensions === 0}
        onClick={onReset}
      >
        Reset all filters
      </button>
    </section>
  )
}
