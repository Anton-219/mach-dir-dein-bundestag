import {
  getElectoralSystemCatalog,
  getElectoralSystemModelCopy,
  getScenarioReasonText,
  summarizeFilterState,
  useI18n,
  type TranslationTools,
} from '../../i18n/index.ts'
import type { ElectoralSystemId } from '../../lib/election/index.ts'
import type { FilterState } from '../../lib/filters/index.ts'
import { createElectoralSystemPresentation } from '../../lib/results/electoral-system-presentation.ts'
import { ElectoralSystemSelector } from './ElectoralSystemSelector.tsx'
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
  systemId: ElectoralSystemId,
  i18n: TranslationTools,
) {
  if (!scenario || scenario.status === 'invalid') {
    return ''
  }

  const scenarioName = summarizeFilterState(filters, i18n)
  const copy = getElectoralSystemCatalog(i18n.locale)
  const model = getElectoralSystemModelCopy(systemId, i18n.locale)
  const activeModelAnnouncement = copy.announcement.activeModel(model.name)

  if (scenario.status === 'empty') {
    return `${i18n.messages.scenario.emptyAnnouncement(scenarioName)} ${activeModelAnnouncement}`
  }

  const resultAnnouncement = i18n.messages.scenario.readyAnnouncement(
    scenarioName,
    i18n.formatNumber(scenario.includedVotes),
    i18n.formatPercent(scenario.includedShare),
    scenario.totalSeats,
    scenario.majorityThreshold,
  )
  const result = scenario.electoralSystemResult
  if (result === undefined) {
    return `${resultAnnouncement} ${activeModelAnnouncement}`
  }
  const presentation = createElectoralSystemPresentation(result)
  return `${resultAnnouncement} ${activeModelAnnouncement} ${copy.announcement.resultComponents(presentation.directSeats, presentation.listSeats)}`
}

interface ScenarioSummaryProps {
  dataState: DataState
  filters: FilterState
  scenario?: ScenarioResult
  electoralSystemId: ElectoralSystemId
  onElectoralSystemChange: (systemId: ElectoralSystemId) => void
}

export function ScenarioSummary({
  dataState,
  filters,
  scenario,
  electoralSystemId,
  onElectoralSystemChange,
}: ScenarioSummaryProps) {
  const i18n = useI18n()
  const { messages } = i18n
  const electoralSystemCopy = getElectoralSystemCatalog(i18n.locale)
  const voteScenario =
    scenario?.status === 'ready' || scenario?.status === 'empty'
      ? scenario
      : undefined
  const scenarioAnnouncement = describeScenarioForAssistiveTechnology(
    filters,
    scenario,
    electoralSystemId,
    i18n,
  )

  return (
    <section className="scenario-summary" aria-labelledby="scenario-summary-title">
      <h2 className="visually-hidden" id="scenario-summary-title">
        {messages.scenario.overviewTitle}
      </h2>

      <div className="scenario-summary-main">
        <dl className="scenario-facts">
          <div className="scenario-fact-votes">
            <dt>{messages.scenario.includedVotes}</dt>
            <dd>
              {voteScenario
                ? `${i18n.formatNumber(voteScenario.includedVotes)} · ${i18n.formatPercent(voteScenario.includedShare)}`
                : '—'}
            </dd>
          </div>
          <div className="scenario-fact-model">
            <dt className="visually-hidden">
              {electoralSystemCopy.selector.activeLabel}
            </dt>
            <dd>
              <ElectoralSystemSelector
                selectedSystemId={electoralSystemId}
                onChange={onElectoralSystemChange}
              />
            </dd>
          </div>
          <div className="scenario-fact-election">
            <dt>{messages.scenario.election}</dt>
            <dd>{messages.scenario.confirmedResult}</dd>
          </div>
        </dl>
      </div>

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
