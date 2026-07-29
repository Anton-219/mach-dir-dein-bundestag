import {
  buildPresentedPartyResults,
  sortPartyResultsBySeats,
} from '../../lib/results/presentation.ts'
import type { Party } from '../../models/json-contracts.ts'
import type { ScenarioResult } from './types.ts'

interface PartySummaryPanelProps {
  parties: readonly Party[]
  scenario?: ScenarioResult
}

export function PartySummaryPanel({
  parties,
  scenario,
}: PartySummaryPanelProps) {
  const partyRows =
    scenario?.status === 'ready'
      ? sortPartyResultsBySeats(
          buildPresentedPartyResults(
            parties,
            scenario.electionResults,
            scenario.seatResults,
          ),
        )
      : []
  const resultMessage =
    scenario?.message ?? 'Results are unavailable until the election data has loaded.'

  return (
    <section className="workspace-panel party-panel" aria-labelledby="parties-title">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Current result</p>
          <h2 id="parties-title">Parties</h2>
        </div>
        <span className="panel-badge" aria-live="polite">
          {partyRows.length > 0 ? `${partyRows.length} represented` : 'No result'}
        </span>
      </div>

      {partyRows.length > 0 ? (
        <div className="party-list" aria-label="Current party results" aria-live="polite">
          {partyRows.map((result) => {
            const percentage = Math.min(Math.max(result.percentage, 0), 1)

            return (
              <div className="party-row" key={result.abbreviation}>
                <span className="party-identity">
                  <span
                    className="party-swatch"
                    style={{ backgroundColor: result.color }}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{result.abbreviation}</strong>
                    <small title={result.name}>{result.name}</small>
                  </span>
                </span>

                <span className="party-share">
                  <span className="party-track" aria-hidden="true">
                    <span
                      className="party-fill"
                      style={{
                        width: `${percentage * 100}%`,
                        backgroundColor: result.color,
                      }}
                    />
                  </span>
                  <strong>
                    {percentage.toLocaleString('en-US', {
                      style: 'percent',
                      maximumFractionDigits: 1,
                    })}
                  </strong>
                </span>

                <span className="party-seats">
                  <strong>{result.seats}</strong>
                  <small>seats</small>
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p
          className={`result-empty${scenario?.status === 'invalid' ? ' result-empty-error' : ''}`}
          aria-live="polite"
        >
          {resultMessage}
        </p>
      )}

      <p className="result-note">
        Rows include every party with seats and are ordered by seat count. Labels and
        numbers carry the result independently of party color.
      </p>
    </section>
  )
}
