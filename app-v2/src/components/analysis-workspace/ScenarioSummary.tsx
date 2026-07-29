import {
  countActiveFilterDimensions,
  getActiveFilterSummaries,
  summarizeFilterState,
  type FilterDimension,
  type FilterState,
} from '../../lib/filters/index.ts'
import type { DataState, ScenarioResult } from './types.ts'

function DataStatus({
  dataState,
  scenario,
}: {
  dataState: DataState
  scenario?: ScenarioResult
}) {
  if (dataState.status === 'loading') {
    return (
      <p className="scenario-data-status" role="status">
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

  if (scenario?.status === 'invalid') {
    return (
      <p className="scenario-data-status scenario-data-status-error" role="alert">
        <strong>Result could not be calculated.</strong>{' '}
        <span>{scenario.message}</span>
      </p>
    )
  }

  if (scenario?.status === 'empty') {
    return (
      <p className="scenario-data-status">
        <strong>No votes included.</strong> {scenario.message}
      </p>
    )
  }

  return (
    <p className="scenario-data-status">
      Data ready · {dataState.data.parties.length} parties ·{' '}
      {dataState.data.secondVotes.length.toLocaleString('en-US')} vote entries
    </p>
  )
}

function describeScenarioForAssistiveTechnology(
  filters: FilterState,
  scenario?: ScenarioResult,
) {
  if (!scenario || scenario.status === 'invalid') {
    return ''
  }

  const scenarioName = summarizeFilterState(filters)

  if (scenario.status === 'empty') {
    return `${scenarioName}. No votes are included in this scenario.`
  }

  const includedShare = scenario.includedShare.toLocaleString('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
  })

  return `${scenarioName}. ${scenario.includedVotes.toLocaleString('en-US')} votes included, ${includedShare} of the dataset. Parliament: ${scenario.totalSeats} seats, ${scenario.majorityThreshold} seats required for a majority.`
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
  const voteScenario =
    scenario?.status === 'ready' || scenario?.status === 'empty'
      ? scenario
      : undefined
  const scenarioAnnouncement = describeScenarioForAssistiveTechnology(
    filters,
    scenario,
  )

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
            {voteScenario
              ? `${voteScenario.includedVotes.toLocaleString('en-US')} · ${voteScenario.includedShare.toLocaleString('en-US', {
                  style: 'percent',
                  maximumFractionDigits: 1,
                })}`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Parliament</dt>
          <dd>
            {scenario?.status === 'ready'
              ? `${scenario.totalSeats} seats · ${scenario.majorityThreshold} majority`
              : scenario?.status === 'empty'
                ? 'No included votes'
                : '—'}
          </dd>
        </div>
      </dl>

      <DataStatus dataState={dataState} scenario={scenario} />

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

      {scenarioAnnouncement ? (
        <p className="visually-hidden" role="status" aria-atomic="true">
          {scenarioAnnouncement}
        </p>
      ) : null}
    </section>
  )
}
