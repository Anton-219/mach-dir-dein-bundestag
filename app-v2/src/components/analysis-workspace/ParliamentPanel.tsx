export function ParliamentPanel() {
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
            <strong>630</strong> seats
          </span>
          <span>
            <strong>316</strong> majority
          </span>
        </div>
      </div>

      <div className="parliament-visual" aria-hidden="true">
        <div className="parliament-arc">
          <div className="parliament-cutout">
            <strong>630</strong>
            <span>total seats</span>
          </div>
        </div>
        <span className="majority-axis">Majority threshold: 316</span>
      </div>

      <p className="panel-placeholder-note parliament-note">
        The final seat visualization will use the calculated scenario result in
        Ticket 07.
      </p>
    </section>
  )
}
