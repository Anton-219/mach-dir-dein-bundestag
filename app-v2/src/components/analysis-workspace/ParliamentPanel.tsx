import type { ScenarioResult } from './types.ts'

export function ParliamentPanel({ scenario }: { scenario?: ScenarioResult }) {
  const representedParties =
    scenario?.seatResults.filter((result) => result.seats > 0).length ?? 0

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
            <strong>{scenario?.totalSeats ?? '—'}</strong> seats
          </span>
          <span>
            <strong>{scenario?.majorityThreshold ?? '—'}</strong> majority
          </span>
          <span>
            <strong>{representedParties}</strong> parties
          </span>
        </div>
      </div>

      <div className="parliament-visual" aria-hidden="true">
        <div className="parliament-arc">
          <div className="parliament-cutout">
            <strong>{scenario?.totalSeats ?? '—'}</strong>
            <span>total seats</span>
          </div>
        </div>
        <span className="majority-axis">
          Majority threshold: {scenario?.majorityThreshold ?? '—'}
        </span>
      </div>

      <p className="panel-placeholder-note parliament-note">
        Seat totals now follow the active scenario. Ticket 07 will replace the
        neutral preview with the final party-based seat visualization.
      </p>
    </section>
  )
}
