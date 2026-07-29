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
        <span className="panel-badge">
          {partyRows.length > 0 ? `${partyRows.length} represented` : 'No result'}
        </span>
      </div>

      {partyRows.length > 0 ? (
        <ul
          className="party-list"
          role="region"
          tabIndex={0}
          aria-labelledby="parties-title"
          aria-describedby="party-result-note"
        >
          {partyRows.map((result) => {
            const percentage = Math.min(Math.max(result.percentage, 0), 1)
            const formattedPercentage = percentage.toLocaleString('en-US', {
              style: 'percent',
              maximumFractionDigits: 1,
            })

            return (
              <li className="party-row" key={result.abbreviation}>
                <span className="party-identity">
                  <span
                    className="party-swatch"
                    style={{ backgroundColor: result.color }}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>
                      {result.abbreviation}
                      <span className="visually-hidden"> — {result.name}</span>
                    </strong>
                    <small title={result.name} aria-hidden="true">
                      {result.name}
                    </small>
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
                    <span className="visually-hidden">Vote share: </span>
                    {formattedPercentage}
                  </strong>
                </span>

                <span className="party-seats">
                  <strong>
                    <span className="visually-hidden">Seats: </span>
                    {result.seats}
                  </strong>
                  <small aria-hidden="true">seats</small>
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p
          className={`result-empty${scenario?.status === 'invalid' ? ' result-empty-error' : ''}`}
        >
          {resultMessage}
        </p>
      )}

      <p className="result-note" id="party-result-note">
        Rows include every party with seats and are ordered by seat count. Labels and
        numbers carry the result independently of party color.
      </p>
    </section>
  )
}
