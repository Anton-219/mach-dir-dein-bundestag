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
  const directWinsByParty = new Map(
    scenario?.electoralSystemResult?.parties.map((result) => [
      result.party,
      result.directWins,
    ]) ?? [],
  )
  const constituencyWinsLabel =
    i18n.locale === 'de' ? 'Gewonnene Wahlkreise:' : 'Constituencies won:'
  const constituencyWinsShort = i18n.locale === 'de' ? 'Wahlkr.' : 'const.'
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
        >
          {partyRows.map((result) => {
            const percentage = Math.min(Math.max(result.percentage, 0), 1)
            const formattedPercentage = i18n.formatPercent(percentage)
            const directWins = directWinsByParty.get(result.abbreviation) ?? 0

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

                <span className="party-metric party-seats">
                  <strong>
                    <span className="visually-hidden">
                      {messages.parties.seats}{' '}
                    </span>
                    {i18n.formatNumber(result.seats)}
                  </strong>
                  <small aria-hidden="true">{messages.parties.seatsShort}</small>
                </span>

                <span className="party-metric party-constituencies">
                  <strong>
                    <span className="visually-hidden">
                      {constituencyWinsLabel}{' '}
                    </span>
                    {i18n.formatNumber(directWins)}
                  </strong>
                  <small aria-hidden="true">{constituencyWinsShort}</small>
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
    </section>
  )
}
