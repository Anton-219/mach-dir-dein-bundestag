import type { ScenarioResult } from './types.ts'

export function CoalitionPanel({ scenario }: { scenario?: ScenarioResult }) {
  const coalitionRows = scenario?.coalitions.slice(0, 3) ?? []

  return (
    <section
      className="workspace-panel coalition-panel"
      aria-labelledby="coalitions-title"
    >
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Majority options</p>
          <h2 id="coalitions-title">Coalitions</h2>
        </div>
        <span className="panel-badge" aria-live="polite">
          {scenario?.coalitions.length ?? 0} options
        </span>
      </div>

      {coalitionRows.length > 0 ? (
        <div className="coalition-list" aria-label="Coalition result preview">
          {coalitionRows.map((coalition, index) => (
            <div
              className="coalition-row"
              key={coalition.members
                .map((member) => member.partyAbbreviation)
                .join('-')}
            >
              <span className="coalition-rank">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="coalition-combination">
                <strong>
                  {coalition.members
                    .map((member) => member.partyAbbreviation)
                    .join(' + ')}
                </strong>
                <small>{coalition.surplus} seats above majority</small>
              </span>
              <span className="coalition-seat-count">{coalition.seats}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="result-empty" aria-live="polite">
          No minimal winning coalition is available for the current scenario.
        </p>
      )}

      <p className="panel-placeholder-note">
        Coalition calculations react to filters. Ticket 07 will add the final
        prioritisation and graphical composition.
      </p>
    </section>
  )
}
