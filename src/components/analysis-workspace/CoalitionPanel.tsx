/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- The fixed-height coalition list must remain keyboard-scrollable. */

import type { CSSProperties } from 'react'

import { getScenarioReasonText, useI18n } from '../../i18n/index.ts'
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
  const i18n = useI18n()
  const { messages } = i18n
  const coalitionRows =
    scenario?.status === 'ready'
      ? prioritizeCoalitions(scenario.coalitions, scenario.coalitions.length)
      : []
  const resultMessage = getScenarioReasonText(scenario?.reason, i18n)

  return (
    <section
      className="workspace-panel coalition-panel"
      aria-labelledby="coalitions-title"
    >
      <div className="panel-heading coalition-heading">
        <div>
          <p className="panel-kicker">{messages.coalitions.kicker}</p>
          <h2 id="coalitions-title">{messages.coalitions.title}</h2>
        </div>
        <span className="panel-badge">
          {scenario?.status === 'ready'
            ? messages.coalitions.needed(scenario.majorityThreshold)
            : messages.common.noResult}
        </span>
      </div>

      {coalitionRows.length > 0 && scenario?.status === 'ready' ? (
        <>
          <p className="result-note coalition-note" id="coalition-result-note">
            {messages.coalitions.summary(coalitionRows.length)}
          </p>

          <ol
            className="coalition-list"
            tabIndex={0}
            aria-labelledby="coalitions-title"
            aria-describedby="coalition-result-note"
          >
            {coalitionRows.map((coalition, index) => {
              const members = coalition.members.map((member) => ({
                member,
                identity: getPartyIdentity(member.partyAbbreviation, parties),
              }))
              const majorityPosition =
                (scenario.majorityThreshold / scenario.totalSeats) * 100

              return (
                <li
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
                      {members.map(({ member, identity }) => (
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
                          <span className="visually-hidden"> ({identity.name})</span>
                        </span>
                      ))}
                    </div>

                    <div className="coalition-composition" aria-hidden="true">
                      <div className="coalition-composition-segments">
                        {members.map(({ member, identity }) => (
                          <span
                            key={member.partyAbbreviation}
                            style={{
                              width: `${(member.seats / scenario.totalSeats) * 100}%`,
                              backgroundColor: identity.color,
                            }}
                          />
                        ))}
                      </div>
                      <span
                        className="coalition-majority-marker"
                        style={
                          {
                            '--majority-position': `${majorityPosition}%`,
                          } as CSSProperties
                        }
                      />
                    </div>

                    <small>
                      {messages.coalitions.minimalWinning(
                        coalition.members.length,
                      )}
                    </small>
                  </div>

                  <div className="coalition-metrics">
                    <strong>{coalition.seats}</strong>
                    <span>{messages.coalitions.seats}</span>
                    <small>
                      {messages.coalitions.majorityMargin(coalition.surplus)}
                    </small>
                  </div>
                </li>
              )
            })}
          </ol>
        </>
      ) : (
        <p
          className={`result-empty${scenario?.status === 'invalid' ? ' result-empty-error' : ''}`}
        >
          {scenario?.status === 'ready'
            ? messages.coalitions.noCoalition
            : resultMessage}
        </p>
      )}
    </section>
  )
}
