import {
  getPartyIdentity,
  prioritizeCoalitions,
} from '../../lib/results/presentation.ts'
import type { Party } from '../../models/json-contracts.ts'
import type { ScenarioResult } from './types.ts'

interface CoalitionPanelProps {
  parties: readonly Party[]
  scenario?: ScenarioResult
}

export function CoalitionPanel({ parties, scenario }: CoalitionPanelProps) {
  const coalitionRows =
    scenario?.status === 'ready'
      ? prioritizeCoalitions(scenario.coalitions, scenario.coalitions.length)
      : []
  const resultMessage =
    scenario?.message ?? 'Results are unavailable until the election data has loaded.'

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
          {scenario?.status === 'ready'
            ? `${scenario.majorityThreshold} needed`
            : 'No result'}
        </span>
      </div>

      {coalitionRows.length > 0 ? (
        <>
          <p className="result-note coalition-note" id="coalition-result-note">
            {coalitionRows.length} options, prioritised by fewer parties and the
            smallest majority margin. CDU and CSU are grouped as CDU+CSU.
          </p>

          <div
            className="coalition-list"
            aria-label="All minimal winning coalitions"
            aria-describedby="coalition-result-note"
            tabIndex={0}
          >
            {coalitionRows.map((coalition, index) => (
              <article
                className="coalition-row"
                key={coalition.members
                  .map((member) => member.partyAbbreviation)
                  .join('-')}
              >
                <span className="coalition-rank" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div className="coalition-combination">
                  <div className="coalition-members">
                    {coalition.members.map((member) => {
                      const identity = getPartyIdentity(
                        member.partyAbbreviation,
                        parties,
                      )

                      return (
                        <span
                          className="coalition-member"
                          title={identity.name}
                          key={member.partyAbbreviation}
                        >
                          <span
                            className="party-swatch"
                            style={{ backgroundColor: identity.color }}
                            aria-hidden="true"
                          />
                          {identity.abbreviation}
                        </span>
                      )
                    })}
                  </div>
                  <small>
                    Minimal winning coalition · {coalition.members.length}{' '}
                    {coalition.members.length === 1 ? 'party' : 'parties'}
                  </small>
                </div>

                <div className="coalition-metrics">
                  <strong>{coalition.seats}</strong>
                  <span>seats</span>
                  <small>+{coalition.surplus} majority margin</small>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <p
          className={`result-empty${scenario?.status === 'invalid' ? ' result-empty-error' : ''}`}
          aria-live="polite"
        >
          {scenario?.status === 'ready'
            ? 'No minimal winning coalition is available for the current scenario.'
            : resultMessage}
        </p>
      )}
    </section>
  )
}
