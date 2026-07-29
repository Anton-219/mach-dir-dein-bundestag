const filterGroups = [
  { label: 'Federal state', value: 'All states' },
  { label: 'Age group', value: 'All ages' },
  { label: 'Gender', value: 'All recorded groups' },
  { label: 'Voting method', value: 'Postal and in-person' },
] as const

export function FilterPanel() {
  return (
    <section className="workspace-panel filter-panel" aria-labelledby="filters-title">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Scenario controls</p>
          <h2 id="filters-title">Filters</h2>
        </div>
        <span className="panel-badge">0 active</span>
      </div>

      <div className="filter-list">
        {filterGroups.map((filter) => (
          <button
            className="filter-control"
            type="button"
            disabled
            key={filter.label}
            aria-label={`${filter.label}: ${filter.value}`}
          >
            <span>
              <strong>{filter.label}</strong>
              <small>{filter.value}</small>
            </span>
            <span aria-hidden="true">⌄</span>
          </button>
        ))}
      </div>

      <p className="panel-placeholder-note">
        Interactive inclusion and exclusion controls arrive in Ticket 06.
      </p>
    </section>
  )
}
