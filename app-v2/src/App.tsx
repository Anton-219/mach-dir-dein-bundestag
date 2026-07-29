import { useEffect, useState } from 'react'

import { loadElectionData } from './data/loaders.ts'
import type { ElectionData } from './data/loaders.ts'

type DataState =
  | { status: 'loading' }
  | { status: 'ready'; data: ElectionData }
  | { status: 'error'; message: string }

const partyResultLabels = [
  'CDU/CSU',
  'SPD',
  'Alliance 90/The Greens',
  'FDP',
  'AfD',
  'The Left',
] as const

const filterGroups = [
  {
    label: 'Region',
    value: 'All federal states',
    description: 'Compare Germany as a whole or focus on one state.',
  },
  {
    label: 'Age',
    value: 'All age groups',
    description: 'Explore how the result changes between voter generations.',
  },
  {
    label: 'Gender',
    value: 'All recorded groups',
    description: 'Use the categories available in the source statistics.',
  },
  {
    label: 'Education',
    value: 'All education groups',
    description: 'Narrow the scenario by the reported education level.',
  },
] as const

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'The election data could not be loaded for an unknown reason.'
}

function DataStatus({ dataState }: { dataState: DataState }) {
  if (dataState.status === 'loading') {
    return (
      <p className="data-status" aria-live="polite">
        Loading the confirmed 2021 election data…
      </p>
    )
  }

  if (dataState.status === 'error') {
    return (
      <div className="data-status data-status-error" role="alert">
        <strong>Election data could not be loaded.</strong>
        <span>{dataState.message}</span>
      </div>
    )
  }

  return (
    <p className="data-status" aria-live="polite">
      Data ready: {dataState.data.parties.length} parties,{' '}
      {dataState.data.secondVotes.length.toLocaleString('en-US')} second-vote
      entries, {dataState.data.statVotes.length.toLocaleString('en-US')}{' '}
      statistical vote entries, and {dataState.data.directMandates.length}{' '}
      direct-mandate results.
    </p>
  )
}

function App() {
  const [dataState, setDataState] = useState<DataState>({ status: 'loading' })

  useEffect(() => {
    let isCurrent = true

    loadElectionData()
      .then((data) => {
        if (isCurrent) {
          setDataState({ status: 'ready', data })
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setDataState({ status: 'error', message: getErrorMessage(error) })
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  return (
    <div className="page-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Build Your Bundestag home">
          Build Your Bundestag
        </a>
        <nav className="page-navigation" aria-label="Page sections">
          <a href="#result">Result</a>
          <a href="#filters">Filters</a>
          <a href="#coalitions">Coalitions</a>
          <a href="#methodology">Methodology</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero content-width" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="eyebrow">Explore the 2021 federal election</p>
            <h1 id="page-title">What would your Bundestag look like?</h1>
            <p className="hero-summary">
              Build a voter scenario and see how the composition of Germany&apos;s
              federal parliament could change. The resulting Bundestag remains
              the centre of the page while filters, coalition options, and data
              notes stay close at hand.
            </p>
          </div>

          <div className="interaction-guide" aria-label="How the page works">
            <p className="interaction-kicker">One page, three steps</p>
            <ol>
              <li>Review the active scenario.</li>
              <li>Adjust the available voter filters.</li>
              <li>Compare seats and possible majorities.</li>
            </ol>
          </div>
        </section>

        <section className="scenario-band" aria-labelledby="scenario-title">
          <div className="content-width scenario-content">
            <div className="scenario-heading">
              <p className="section-label">Active scenario</p>
              <h2 id="scenario-title">All voters in Germany</h2>
            </div>

            <dl className="scenario-facts">
              <div>
                <dt>Election</dt>
                <dd>2021 confirmed result</dd>
              </div>
              <div>
                <dt>Filters</dt>
                <dd>No demographic filters</dd>
              </div>
              <div>
                <dt>Parliament size</dt>
                <dd>630 seats</dd>
              </div>
            </dl>

            <DataStatus dataState={dataState} />
          </div>
        </section>

        <section
          className="page-section result-section content-width"
          id="result"
          aria-labelledby="result-title"
        >
          <div className="section-introduction result-introduction">
            <div>
              <p className="section-label">Primary result</p>
              <h2 id="result-title">The resulting Bundestag</h2>
            </div>
            <p>
              The final interactive seat distribution will appear here. This
              preview establishes its position as the page&apos;s main visual and
              keeps the party result summary directly connected to it.
            </p>
          </div>

          <div className="result-stage">
            <div className="parliament-panel">
              <div
                className="parliament-arc"
                role="img"
                aria-label="Placeholder for a semicircular Bundestag seat distribution"
              >
                <div className="parliament-cutout">
                  <strong>630</strong>
                  <span>seats</span>
                </div>
              </div>
              <div className="majority-marker">
                <span>Majority threshold</span>
                <strong>316 seats</strong>
              </div>
            </div>

            <aside className="party-results" aria-labelledby="party-results-title">
              <div className="party-results-heading">
                <p className="section-label">Party results</p>
                <h3 id="party-results-title">Seat distribution</h3>
              </div>
              <p className="placeholder-note">
                Result bars will be calculated from the active scenario in a
                later ticket.
              </p>
              <div className="party-result-list" aria-hidden="true">
                {partyResultLabels.map((party) => (
                  <div className="party-result-row" key={party}>
                    <span>{party}</span>
                    <span className="party-result-track">
                      <span className="party-result-fill" />
                    </span>
                    <strong>—</strong>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section
          className="page-section filters-section"
          id="filters"
          aria-labelledby="filters-title"
        >
          <div className="content-width filters-layout">
            <div className="section-introduction filters-introduction">
              <div>
                <p className="section-label">Build a scenario</p>
                <h2 id="filters-title">Filter the electorate</h2>
              </div>
              <p>
                Filters are grouped in one clearly integrated workspace. Their
                final behaviour arrives later; these controls show the intended
                hierarchy without competing with the result above.
              </p>
            </div>

            <div className="filter-workspace">
              {filterGroups.map((filter) => (
                <div className="filter-row" key={filter.label}>
                  <div>
                    <h3>{filter.label}</h3>
                    <p>{filter.description}</p>
                  </div>
                  <button type="button" disabled>
                    {filter.value}
                    <span aria-hidden="true">⌄</span>
                  </button>
                </div>
              ))}

              <div className="filter-actions">
                <p>Interactive filtering will be connected in a later ticket.</p>
                <button type="button" className="primary-action" disabled>
                  Apply scenario
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          className="page-section coalitions-section content-width"
          id="coalitions"
          aria-labelledby="coalitions-title"
        >
          <div className="section-introduction coalition-introduction">
            <div>
              <p className="section-label">Majority options</p>
              <h2 id="coalitions-title">Possible coalitions</h2>
            </div>
            <p>
              Minimal winning combinations will be listed against the same
              316-seat threshold used in the result. Political compatibility is
              not implied by the calculation.
            </p>
          </div>

          <div className="coalition-placeholder" aria-label="Coalition result placeholder">
            {[1, 2, 3].map((position) => (
              <div className="coalition-row" key={position}>
                <span className="coalition-rank">0{position}</span>
                <div>
                  <strong>Coalition combination</strong>
                  <span>Calculated party members will appear here.</span>
                </div>
                <span className="coalition-seats">— seats</span>
              </div>
            ))}
          </div>
        </section>

        <section
          className="page-section methodology-section"
          id="methodology"
          aria-labelledby="methodology-title"
        >
          <div className="content-width methodology-layout">
            <div>
              <p className="section-label">Methodology and data</p>
              <h2 id="methodology-title">How to read this experiment</h2>
            </div>
            <div className="methodology-copy">
              <p>
                The application starts with confirmed 2021 federal election data
                and combines it with published statistical voting groups. Filtered
                scenarios are exploratory comparisons, not forecasts or surveys.
              </p>
              <p>
                Seat allocation and coalition calculations follow the documented
                project assumptions. Later tickets will connect the calculations,
                add the final visualisation, and polish responsive and accessible
                interaction details.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer content-width">
        <p>Build Your Bundestag · An exploratory data project</p>
        <a href="#top">Back to top</a>
      </footer>
    </div>
  )
}

export default App
