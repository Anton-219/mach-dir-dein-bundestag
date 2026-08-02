import {
  getScenarioReasonText,
  summarizeFilterState,
  useI18n,
  type TranslationTools,
} from '../../i18n/index.ts'
import type { FilterState } from '../../lib/filters/index.ts'
import type { DataState, ScenarioResult } from './types.ts'

function DataStatus({
  dataState,
  scenario,
}: {
  dataState: DataState
  scenario?: ScenarioResult
}) {
  const i18n = useI18n()
  const { messages } = i18n

  if (dataState.status === 'loading') {
    return (
      <output className="scenario-data-status" aria-live="polite">
        {messages.scenario.loading}
      </output>
    )
  }

  if (dataState.status === 'error') {
    return (
      <p className="scenario-data-status scenario-data-status-error" role="alert">
        <strong>{messages.scenario.loadErrorTitle}</strong>
      </p>
    )
  }

  if (scenario?.status === 'invalid') {
    return (
      <p className="scenario-data-status scenario-data-status-error" role="alert">
        <strong>{messages.scenario.invalidTitle}</strong>{' '}
        <span>{getScenarioReasonText(scenario.reason, i18n)}</span>
      </p>
    )
  }

  if (scenario?.status === 'empty') {
    return (
      <p className="scenario-data-status">
        <strong>{messages.scenario.emptyTitle}</strong>{' '}
        {getScenarioReasonText(scenario.reason, i18n)}
      </p>
    )
  }

  return null
}

function describeScenarioForAssistiveTechnology(
  filters: FilterState,
  scenario: ScenarioResult | undefined,
  i18n: TranslationTools,
) {
  if (!scenario || scenario.status === 'invalid') {
    return ''
  }

  const scenarioName = summarizeFilterState(filters, i18n)

  if (scenario.status === 'empty') {
    return i18n.messages.scenario.emptyAnnouncement(scenarioName)
  }

  return i18n.messages.scenario.readyAnnouncement(
    scenarioName,
    i18n.formatNumber(scenario.includedVotes),
    i18n.formatPercent(scenario.includedShare),
    scenario.totalSeats,
    scenario.majorityThreshold,
  )
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
  const i18n = useI18n()
  const { messages } = i18n
  const voteScenario =
    scenario?.status === 'ready' || scenario?.status === 'empty'
      ? scenario
      : undefined
  const scenarioAnnouncement = describeScenarioForAssistiveTechnology(
    filters,
    scenario,
    i18n,
  )

  return (
    <section className="scenario-summary" aria-labelledby="scenario-summary-title">
      <h2 className="visually-hidden" id="scenario-summary-title">
        {messages.scenario.overviewTitle}
      </h2>

      <dl className="scenario-facts">
        <div>
          <dt>{messages.scenario.includedVotes}</dt>
          <dd>
            {voteScenario
              ? `${i18n.formatNumber(voteScenario.includedVotes)} · ${i18n.formatPercent(voteScenario.includedShare)}`
              : '—'}
          </dd>
        </div>
        <div className="scenario-fact-election">
          <dt>{messages.scenario.election}</dt>
          <dd>{messages.scenario.confirmedResult}</dd>
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
