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
  const partyResults =
    scenario?.status === 'ready'
      ? buildPresentedPartyResults(
          parties,
          scenario.electionResults,
          scenario.seatResults,
        )
      : []
  const segments = buildParliamentSegments(partyResults)
  const hasResult = scenario?.status === 'ready' && segments.length > 0
  const resultMessage =
    scenario?.message ?? 'Results are unavailable until the election data has loaded.'

  return (
    <section
      className="workspace-panel parliament-panel"
      aria-labelledby="parliament-title"
    >
      <div className="panel-heading parliament-heading">
        <div>
          <p className="panel-kicker">Calculated result</p>
          <h2 id="parliament-title">Bundestag</h2>
        </div>
        <div className="parliament-totals" aria-live="polite">
          <span>
            <strong>{scenario?.status === 'ready' ? scenario.totalSeats : '—'}</strong>{' '}
            seats
          </span>
          <span>
            <strong>
              {scenario?.status === 'ready' ? scenario.majorityThreshold : '—'}
            </strong>{' '}
            majority
          </span>
          <span>
            <strong>{hasResult ? partyResults.length : '—'}</strong> parties
          </span>
        </div>
      </div>

      {hasResult ? (
        <div className="parliament-result" aria-live="polite">
          <div className="parliament-chart">
            <svg
              viewBox="0 0 184 104"
              role="img"
              aria-labelledby="parliament-chart-title parliament-chart-description"
            >
              <title id="parliament-chart-title">Bundestag seat distribution</title>
              <desc id="parliament-chart-description">
                {partyResults
                  .map((result) => `${result.abbreviation}: ${result.seats} seats`)
                  .join(', ')}
                . The majority threshold is {scenario.majorityThreshold} seats.
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
                    {segment.name}: {segment.seats} seats
                  </title>
                </path>
              ))}
              <line
                className="majority-marker"
                x1="92"
                x2="92"
                y1="3"
                y2="24"
              />
            </svg>

            <div className="parliament-cutout" aria-hidden="true">
              <strong>{scenario.totalSeats}</strong>
              <span>total seats</span>
            </div>
          </div>

          <p className="majority-axis">
            Majority threshold: <strong>{scenario.majorityThreshold} seats</strong>
          </p>

          <ul className="parliament-legend" aria-label="Parties represented in parliament">
            {partyResults.map((result) => (
              <li key={result.abbreviation}>
                <span
                  className="party-swatch"
                  style={{ backgroundColor: result.color }}
                  aria-hidden="true"
                />
                <span>{result.abbreviation}</span>
                <strong>{result.seats}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p
          className={`result-empty${scenario?.status === 'invalid' ? ' result-empty-error' : ''}`}
          aria-live="polite"
        >
          {resultMessage}
        </p>
      )}

      <p className="result-note parliament-note">
        Parties follow their left-to-right seat positions. CDU and CSU remain separate
        here and are grouped only for coalition calculations.
      </p>
    </section>
  )
}
