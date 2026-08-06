import {
  getElectoralSystemCatalog,
  getScenarioReasonText,
  useI18n,
} from '../../i18n/index.ts'
import { createElectoralSystemPresentation } from '../../lib/results/electoral-system-presentation.ts'
import {
  buildParliamentSegments,
  buildPresentedPartyResults,
} from '../../lib/results/presentation.ts'
import type { Party } from '../../models/json-contracts.ts'
import type { ScenarioResult } from './types.ts'

interface ParliamentPanelProps {
  parties: readonly Party[]
  scenario?: ScenarioResult
}

const parliamentArc = 'M 12 92 A 80 80 0 0 1 172 92'

export function ParliamentPanel({ parties, scenario }: ParliamentPanelProps) {
  const i18n = useI18n()
  const { messages } = i18n
  const electoralSystemCopy = getElectoralSystemCatalog(i18n.locale)
  const readyScenario = scenario?.status === 'ready' ? scenario : undefined
  const seatBreakdown = readyScenario?.electoralSystemResult
    ? createElectoralSystemPresentation(readyScenario.electoralSystemResult)
    : undefined
  const partyResults = readyScenario
    ? buildPresentedPartyResults(
        parties,
        readyScenario.electionResults,
        readyScenario.seatResults,
      )
    : []
  const segments = buildParliamentSegments(partyResults)
  const resultMessage = getScenarioReasonText(scenario?.reason, i18n)

  return (
    <section
      className="workspace-panel parliament-panel"
      aria-labelledby="parliament-title"
    >
      <div className="panel-heading parliament-heading">
        <div>
          <p className="panel-kicker">{messages.parliament.kicker}</p>
          <h2 id="parliament-title">{messages.parliament.title}</h2>
        </div>
        <div className="parliament-totals">
          <span>
            <strong>{readyScenario?.totalSeats ?? '—'}</strong>{' '}
            {messages.parliament.seats}
          </span>
          <span>
            <strong>{readyScenario?.majorityThreshold ?? '—'}</strong>{' '}
            {messages.parliament.majority}
          </span>
          <span>
            <strong>{segments.length > 0 ? partyResults.length : '—'}</strong>{' '}
            {messages.parliament.parties}
          </span>
        </div>
      </div>

      {readyScenario && segments.length > 0 ? (
        <div className="parliament-result">
          <div className="parliament-chart">
            <svg
              viewBox="0 0 184 104"
              aria-labelledby="parliament-chart-title parliament-chart-description"
            >
              <title id="parliament-chart-title">
                {messages.parliament.chartTitle}
              </title>
              <desc id="parliament-chart-description">
                {messages.parliament.chartDescription(
                  i18n.formatList(
                    partyResults.map((result) =>
                      messages.parliament.partySeatDescription(
                        result.name,
                        result.seats,
                      ),
                    ),
                  ),
                  readyScenario.majorityThreshold,
                )}
              </desc>
              <path
                className="parliament-track"
                d={parliamentArc}
                pathLength={100}
              />
              {segments.map((segment) => (
                <path
                  className="parliament-segment"
                  d={parliamentArc}
                  pathLength={100}
                  stroke={segment.color}
                  strokeDasharray={`${segment.sharePercentage} ${100 - segment.sharePercentage}`}
                  strokeDashoffset={-segment.startPercentage}
                  key={segment.abbreviation}
                >
                  <title>
                    {messages.parliament.partySeatDescription(
                      segment.name,
                      segment.seats,
                    )}
                  </title>
                </path>
              ))}
            </svg>

            <div className="parliament-cutout" aria-hidden="true">
              <strong>{readyScenario.totalSeats}</strong>
              <span>{messages.parliament.totalSeats}</span>
            </div>
          </div>

          <div className="parliament-majority-row">
            <p className="majority-axis">
              {messages.parliament.majorityThreshold}{' '}
              <strong>
                {messages.common.seatCount(readyScenario.majorityThreshold)}
              </strong>
            </p>

            {seatBreakdown ? (
              <dl className="parliament-seat-breakdown">
                <div>
                  <dt>{electoralSystemCopy.seatBreakdown.directSeats}</dt>
                  <dd>{i18n.formatNumber(seatBreakdown.directSeats)}</dd>
                </div>
                <div>
                  <dt>{electoralSystemCopy.seatBreakdown.listSeats}</dt>
                  <dd>{i18n.formatNumber(seatBreakdown.listSeats)}</dd>
                </div>
              </dl>
            ) : null}
          </div>

          <ul
            className="parliament-legend"
            aria-label={messages.parliament.representedPartiesAriaLabel}
          >
            {partyResults.map((result) => (
              <li key={result.abbreviation}>
                <span
                  className="party-swatch"
                  style={{ backgroundColor: result.color }}
                  aria-hidden="true"
                />
                <span className="visually-hidden">{result.name}, </span>
                <span>{result.abbreviation}</span>
                <strong>{result.seats}</strong>
                <span className="visually-hidden">
                  {' '}
                  {messages.parliament.seats}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p
          className={`result-empty${scenario?.status === 'invalid' ? ' result-empty-error' : ''}`}
        >
          {resultMessage}
        </p>
      )}
    </section>
  )
}
