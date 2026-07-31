import {
  summarizeFilterState,
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
      <output className="scenario-data-status" aria-live="polite">
        Loading confirmed election data…
      </output>
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

  return null
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
}

export function ScenarioSummary({
  dataState,
  filters,
  scenario,
}: ScenarioSummaryProps) {
  const voteScenario =
    scenario?.status === 'ready' || scenario?.status === 'empty'
      ? scenario
      : undefined
  const scenarioAnnouncement = describeScenarioForAssistiveTechnology(
    filters,
    scenario,
  )

  return (
    <section className="scenario-summary" aria-labelledby="scenario-summary-title">
      <h2 className="visually-hidden" id="scenario-summary-title">
        Election scenario overview
      </h2>

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

      {scenarioAnnouncement ? (
        <output
          className="visually-hidden"
          aria-live="polite"
          aria-atomic="true"
        >
          {scenarioAnnouncement}
        </output>
      ) : null}
    </section>
  )
}
