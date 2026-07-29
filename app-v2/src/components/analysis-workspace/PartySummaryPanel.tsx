import type { Party } from '../../models/json-contracts.ts'
import type { ScenarioResult } from './types.ts'

interface PartySummaryPanelProps {
  parties: readonly Party[]
  scenario?: ScenarioResult
}

export function PartySummaryPanel({
  parties,
  scenario,
}: PartySummaryPanelProps) {
  const partiesByAbbreviation = new Map(
    parties.map((party) => [party.abbreviation, party]),
  )
  const electionResultsByParty = new Map(
    scenario?.electionResults.map((result) => [result.partyAbbreviation, result]) ?? [],
  )
  const partyRows =
    scenario?.seatResults
      .filter((result) => result.seats > 0)
      .map((seatResult) => ({
        seatResult,
        electionResult: electionResultsByParty.get(seatResult.partyAbbreviation),
        party: partiesByAbbreviation.get(seatResult.partyAbbreviation),
      }))
      .sort(
        (left, right) =>
          right.seatResult.seats - left.seatResult.seats ||
          (right.electionResult?.votes ?? 0) - (left.electionResult?.votes ?? 0),
      )
      .slice(0, 6) ?? []

  return (
    <section className="workspace-panel party-panel" aria-labelledby="parties-title">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Current result</p>
          <h2 id="parties-title">Parties</h2>
        </div>
        <span className="panel-badge">Live preview</span>
      </div>

      {partyRows.length > 0 ? (
        <div className="party-list" aria-label="Current party result preview" aria-live="polite">
          {partyRows.map(({ seatResult, electionResult, party }) => {
            const percentage = electionResult?.percentage ?? 0
            const label = party?.name ?? seatResult.partyAbbreviation

            return (
              <div className="party-row" key={seatResult.partyAbbreviation}>
                <span className="party-name">{label}</span>
                <span className="party-track" aria-hidden="true">
                  <span
                    className="party-fill"
                    style={{ width: `${Math.min(percentage * 100, 100)}%` }}
                  />
                </span>
                <span className="party-value">
                  {percentage.toLocaleString('en-US', {
                    style: 'percent',
                    maximumFractionDigits: 1,
                  })}{' '}
                  · {seatResult.seats}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="result-empty" aria-live="polite">
          No party result is available for the current scenario.
        </p>
      )}

      <p className="panel-placeholder-note">
        Vote shares and seat counts already react to filters. Ticket 07 will provide
        the final result hierarchy and comparison details.
      </p>
    </section>
  )
}
