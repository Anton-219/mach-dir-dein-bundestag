import type { CSSProperties } from 'react'

import type { StatePartyLandscape } from '../../lib/results/state-party-landscape.ts'
import type { Party } from '../../models/json-contracts.ts'

interface StatePartyLandscapePanelProps {
  state: string | null
  landscape: StatePartyLandscape | undefined
  parties: readonly Party[]
  excluded: boolean
}

export function StatePartyLandscapePanel({
  state,
  landscape,
  parties,
  excluded,
}: StatePartyLandscapePanelProps) {
  if (state === null) {
    return (
      <section
        className="workspace-panel state-landscape-panel"
        aria-labelledby="state-landscape-title"
        aria-live="polite"
      >
        <div className="panel-heading state-landscape-heading">
          <div>
            <h2 id="state-landscape-title">Federal state</h2>
          </div>
          <span className="panel-badge">Explore the map</span>
        </div>

        <p className="result-empty state-landscape-placeholder">
          Hover over or focus a federal state on the map to see its party shares.
        </p>
      </section>
    )
  }

  const results = landscape?.status === 'ready' ? landscape.results : []
  const partiesByAbbreviation = new Map(
    parties.map((party) => [party.abbreviation, party]),
  )
  const partyRows = results.map((result) => {
    const party = partiesByAbbreviation.get(result.partyAbbreviation)

    return {
      ...result,
      name: party?.name ?? result.partyAbbreviation,
      color: party?.color ?? '#6f7b75',
    }
  })

  return (
    <section
      className="workspace-panel state-landscape-panel"
      aria-labelledby="state-landscape-title"
      aria-live="polite"
    >
      <div className="panel-heading state-landscape-heading">
        <div>
          <h2 id="state-landscape-title">{state}</h2>
        </div>
        <span className="panel-badge">
          {landscape?.status === 'invalid'
            ? 'Data error'
            : excluded
              ? 'Excluded from scenario'
              : 'Included in scenario'}
        </span>
      </div>

      {landscape?.status === 'ready' ? (
        <p className="state-landscape-weight">
          <strong>
            {landscape.shareOfVoters.toLocaleString('en-US', {
              style: 'percent',
              maximumFractionDigits: 1,
            })}
          </strong>{' '}
          <span>
            of all voters · {landscape.votes.toLocaleString('en-US')} votes
          </span>
        </p>
      ) : null}

      {landscape?.status === 'invalid' ? (
        <p className="result-empty" role="alert">
          {landscape.message}
        </p>
      ) : landscape?.status !== 'ready' ? (
        <p className="result-empty">The state result is not available yet.</p>
      ) : partyRows.length > 0 ? (
        <ul className="state-party-list" aria-labelledby="state-landscape-title">
          {partyRows.map((result) => {
            const percentage = Math.min(Math.max(result.percentage, 0), 1)
            const formattedPercentage = percentage.toLocaleString('en-US', {
              style: 'percent',
              maximumFractionDigits: 1,
            })

            return (
              <li
                className="state-party-row"
                key={result.partyAbbreviation}
                style={{ '--party-color': result.color } as CSSProperties}
              >
                <span className="state-party-identity" title={result.name}>
                  <span
                    className="party-swatch"
                    style={{ backgroundColor: result.color }}
                    aria-hidden="true"
                  />
                  <strong>{result.partyAbbreviation}</strong>
                  <span className="visually-hidden"> — {result.name}</span>
                </span>

                <span className="state-party-share">
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
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="result-empty">
          No votes match the active demographic filters for this state.
        </p>
      )}

      {landscape?.status === 'ready' ? (
        <p className="state-landscape-note">
          Shares respect age, gender, and voting-method filters. State exclusions do not
          hide this comparison.
        </p>
      ) : null}
    </section>
  )
}
