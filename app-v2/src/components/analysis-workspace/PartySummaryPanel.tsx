const partyRows = [
  { name: 'CDU/CSU', width: '86%' },
  { name: 'SPD', width: '77%' },
  { name: 'Alliance 90/The Greens', width: '61%' },
  { name: 'FDP', width: '45%' },
  { name: 'AfD', width: '40%' },
  { name: 'The Left', width: '31%' },
] as const

export function PartySummaryPanel() {
  return (
    <section className="workspace-panel party-panel" aria-labelledby="parties-title">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Current result</p>
          <h2 id="parties-title">Parties</h2>
        </div>
        <span className="panel-badge">Vote share · seats</span>
      </div>

      <div className="party-list" aria-label="Party result placeholders">
        {partyRows.map((party) => (
          <div className="party-row" key={party.name}>
            <span className="party-name">{party.name}</span>
            <span className="party-track" aria-hidden="true">
              <span className="party-fill" style={{ width: party.width }} />
            </span>
            <span className="party-value">— · —</span>
          </div>
        ))}
      </div>

      <p className="panel-placeholder-note">
        Vote shares and seats will update from the active scenario in Ticket 07.
      </p>
    </section>
  )
}
