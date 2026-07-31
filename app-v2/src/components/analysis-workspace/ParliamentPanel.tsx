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
  const readyScenario = scenario?.status === 'ready' ? scenario : undefined
  const partyResults = readyScenario
    ? buildPresentedPartyResults(
        parties,
        readyScenario.electionResults,
        readyScenario.seatResults,
      )
    : []
  const segments = buildParliamentSegments(partyResults)
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
        <div className="parliament-totals">
          <span>
            <strong>{readyScenario?.totalSeats ?? '—'}</strong> seats
          </span>
          <span>
            <strong>{readyScenario?.majorityThreshold ?? '—'}</strong> majority
          </span>
          <span>
            <strong>{segments.length > 0 ? partyResults.length : '—'}</strong> parties
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
              <title id="parliament-chart-title">Bundestag seat distribution</title>
              <desc id="parliament-chart-description">
                {partyResults
                  .map((result) => `${result.name}: ${result.seats} seats`)
                  .join(', ')}
                . The majority threshold is {readyScenario.majorityThreshold} seats.
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
            </svg>

            <div className="parliament-cutout" aria-hidden="true">
              <strong>{readyScenario.totalSeats}</strong>
              <span>total seats</span>
            </div>
          </div>

          <p className="majority-axis">
            Majority threshold:{' '}
            <strong>{readyScenario.majorityThreshold} seats</strong>
          </p>

          <ul className="parliament-legend" aria-label="Parties represented in parliament">
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
                <span className="visually-hidden"> seats</span>
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

      <p className="result-note parliament-note">
        Parties follow their left-to-right seat positions. CDU and CSU remain separate
        here and are grouped only for coalition calculations.
      </p>
    </section>
  )
}
