import type { CSSProperties } from 'react'

import type { ElectionResult } from '../../models/calculation-results.ts'
import type { Party } from '../../models/json-contracts.ts'

interface StatePartyLandscapePanelProps {
  state: string | null
  results: readonly ElectionResult[]
  parties: readonly Party[]
  excluded: boolean
}

export function StatePartyLandscapePanel({
  state,
  results,
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
            <p className="panel-kicker">State election landscape</p>
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
          <p className="panel-kicker">State election landscape</p>
          <h2 id="state-landscape-title">{state}</h2>
        </div>
        <span className="panel-badge">
          {excluded ? 'Excluded from scenario' : 'Included in scenario'}
        </span>
      </div>

      {partyRows.length > 0 ? (
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
                <span className="state-party-identity">
                  <span
                    className="party-swatch"
                    style={{ backgroundColor: result.color }}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{result.partyAbbreviation}</strong>
                    <small title={result.name}>{result.name}</small>
                  </span>
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

      <p className="state-landscape-note">
        Shares respect age, gender, and voting-method filters. State exclusions do not
        hide this comparison.
      </p>
    </section>
  )
}
