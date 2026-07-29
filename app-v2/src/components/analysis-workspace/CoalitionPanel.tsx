const coalitionRows = [1, 2, 3] as const

export function CoalitionPanel() {
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
        <span className="panel-badge">316 needed</span>
      </div>

      <div className="coalition-list" aria-label="Coalition result placeholders">
        {coalitionRows.map((position) => (
          <div className="coalition-row" key={position}>
            <span className="coalition-rank">0{position}</span>
            <span className="coalition-combination">
              <strong>Party combination</strong>
              <small>Minimal winning coalition</small>
            </span>
            <span className="coalition-seat-count">—</span>
          </div>
        ))}
      </div>

      <p className="panel-placeholder-note">
        Calculated members, seats, and majority margins arrive in Ticket 07.
      </p>
    </section>
  )
}
