/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- The fixed-height result list must remain keyboard-scrollable. */

import type { CSSProperties } from 'react'

import { getScenarioReasonText, useI18n } from '../../i18n/index.ts'
import {
  buildPresentedPartyResults,
  sortPartyResultsBySeats,
} from '../../lib/results/presentation.ts'
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
  const i18n = useI18n()
  const { messages } = i18n
  const partyRows =
    scenario?.status === 'ready'
      ? sortPartyResultsBySeats(
          buildPresentedPartyResults(
            parties,
            scenario.electionResults,
            scenario.seatResults,
          ),
        )
      : []
  const resultMessage = getScenarioReasonText(scenario?.reason, i18n)

  return (
    <section className="workspace-panel party-panel" aria-labelledby="parties-title">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">{messages.parties.kicker}</p>
          <h2 id="parties-title">{messages.parties.title}</h2>
        </div>
        <span className="panel-badge">
          {partyRows.length > 0
            ? messages.parties.represented(partyRows.length)
            : messages.common.noResult}
        </span>
      </div>

      {partyRows.length > 0 ? (
        <ul
          className="party-list"
          tabIndex={0}
          aria-labelledby="parties-title"
          aria-describedby="party-result-note"
        >
          {partyRows.map((result) => {
            const percentage = Math.min(Math.max(result.percentage, 0), 1)
            const formattedPercentage = i18n.formatPercent(percentage)

            return (
              <li
                className="party-row"
                key={result.abbreviation}
                style={{ '--party-color': result.color } as CSSProperties}
              >
                <span className="party-identity">
                  <span
                    className="party-swatch"
                    style={{ backgroundColor: result.color }}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>
                      {result.abbreviation}
                      <span className="visually-hidden"> — {result.name}</span>
                    </strong>
                    <small title={result.name} aria-hidden="true">
                      {result.name}
                    </small>
                  </span>
                </span>

                <span className="party-share">
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
                    <span className="visually-hidden">
                      {messages.parties.voteShare}{' '}
                    </span>
                    {formattedPercentage}
                  </strong>
                </span>

                <span className="party-seats">
                  <strong>
                    <span className="visually-hidden">
                      {messages.parties.seats}{' '}
                    </span>
                    {result.seats}
                  </strong>
                  <small aria-hidden="true">{messages.parties.seatsShort}</small>
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p
          className={`result-empty${scenario?.status === 'invalid' ? ' result-empty-error' : ''}`}
        >
          {resultMessage}
        </p>
      )}

      <p className="result-note" id="party-result-note">
        {messages.parties.note}
      </p>
    </section>
  )
}
