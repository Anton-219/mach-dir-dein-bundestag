import type { DataState } from './types.ts'

function DataStatus({ dataState }: { dataState: DataState }) {
  if (dataState.status === 'loading') {
    return (
      <p className="scenario-data-status" aria-live="polite">
        Loading confirmed election data…
      </p>
    )
  }

  if (dataState.status === 'error') {
    return (
      <p className="scenario-data-status scenario-data-status-error" role="alert">
        <strong>Election data could not be loaded.</strong>{' '}
        <span>{dataState.message}</span>
      </p>
    )
  }

  return (
    <p className="scenario-data-status" aria-live="polite">
      Data ready · {dataState.data.parties.length} parties ·{' '}
      {dataState.data.secondVotes.length.toLocaleString('en-US')} vote entries
    </p>
  )
}

export function ScenarioSummary({ dataState }: { dataState: DataState }) {
  return (
    <section className="scenario-summary" aria-labelledby="scenario-title">
      <div className="scenario-title-group">
        <p className="panel-kicker">Active scenario</p>
        <h2 id="scenario-title">All voters in Germany</h2>
      </div>

      <dl className="scenario-facts">
        <div>
          <dt>Election</dt>
          <dd>2021 confirmed result</dd>
        </div>
        <div>
          <dt>Filters</dt>
          <dd>None active</dd>
        </div>
        <div>
          <dt>Parliament</dt>
          <dd>630 seats</dd>
        </div>
      </dl>

      <DataStatus dataState={dataState} />

      <button className="secondary-action" type="button" disabled>
        Reset all filters
      </button>
    </section>
  )
}
