import {
  countActiveFilterDimensions,
  getActiveFilterSummaries,
  summarizeFilterState,
  type FilterDimension,
  type FilterState,
} from '../../lib/filters/index.ts'
import type { DataState, ScenarioResult } from './types.ts'

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
  scenario?: ScenarioResult
  onClearFilter: (dimension: FilterDimension) => void
  onReset: () => void
}

export function ScenarioSummary({
  dataState,
  filters,
  scenario,
  onClearFilter,
  onReset,
}: ScenarioSummaryProps) {
  const activeFilters = getActiveFilterSummaries(filters)
  const activeCount = countActiveFilterDimensions(filters)

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
          <dt>Included votes</dt>
          <dd>
            {scenario
              ? `${scenario.includedVotes.toLocaleString('en-US')} · ${scenario.includedShare.toLocaleString('en-US', {
                  style: 'percent',
                  maximumFractionDigits: 1,
                })}`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Parliament</dt>
          <dd>
            {scenario
              ? `${scenario.totalSeats} seats · ${scenario.majorityThreshold} majority`
              : '—'}
          </dd>
        </div>
      </dl>

      <DataStatus dataState={dataState} />

      <button
        className="secondary-action"
        type="button"
        disabled={activeCount === 0}
        onClick={onReset}
      >
        Reset all filters
      </button>

      {activeFilters.length > 0 ? (
        <div className="active-filter-list" aria-label="Active filters">
          {activeFilters.map((filter) => (
            <button
              className="active-filter"
              type="button"
              key={filter.dimension}
              onClick={() => onClearFilter(filter.dimension)}
              aria-label={`Remove filter: ${filter.label}`}
            >
              <span>{filter.label}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
