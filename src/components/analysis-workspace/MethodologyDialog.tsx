import { useEffect, useRef } from 'react'

import { lastUpdatedAt } from '../../build-info.ts'
import type { ElectionYear } from '../../data/elections.ts'
import {
  getAllElectionSources,
  getElectionModelDataSources,
} from '../../i18n/election-messages.ts'
import {
  getElectoralSystemCatalog,
  getElectoralSystemNoticeTexts,
  getElectoralSystemOptions,
  useI18n,
} from '../../i18n/index.ts'
import type { ElectoralSystemId } from '../../lib/election/index.ts'
import type { ScenarioResult } from './types.ts'

interface MethodologyDialogProps {
  open: boolean
  systemId: ElectoralSystemId
  electionYear: ElectionYear
  scenario?: ScenarioResult
  onClose: () => void
}

export function MethodologyDialog({
  open,
  systemId,
  electionYear,
  scenario,
  onClose,
}: MethodologyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const i18n = useI18n()
  const { messages } = i18n
  const copy = getElectoralSystemCatalog(i18n.locale)
  const electionCopy = messages.elections.years[electionYear]
  const models = getElectoralSystemOptions(i18n.locale)
  const dataPreparationItems = [
    electionCopy.officialTotals,
    ...copy.methodology.dataPreparationItems.slice(1),
  ]
  const sourceCandidates = [
    ...copy.methodology.sources,
    ...getAllElectionSources(i18n.locale),
  ]
  const sources = sourceCandidates.filter(
    (source, index) =>
      sourceCandidates.findIndex((candidate) => candidate.href === source.href) ===
      index,
  )
  const result =
    scenario?.status === 'ready' ? scenario.electoralSystemResult : undefined
  const notices =
    result === undefined ? [] : getElectoralSystemNoticeTexts(result, i18n)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <>
      <footer
        className="application-footer"
        aria-labelledby="calculation-transparency-title"
      >
        <h2 className="visually-hidden" id="calculation-transparency-title">
          {messages.footer.title}
        </h2>
        <p>
          <strong>{messages.footer.label}</strong> {messages.footer.text}
        </p>
        <p className="application-footer-updated">
          {messages.footer.lastUpdatedLabel}{' '}
          <time dateTime={lastUpdatedAt.toISOString()}>
            {i18n.formatDate(lastUpdatedAt)}
          </time>
        </p>
      </footer>

      <dialog
        className="methodology-dialog"
        ref={dialogRef}
        aria-labelledby="methodology-dialog-title"
        aria-describedby="methodology-dialog-introduction"
        onClose={onClose}
      >
        <div className="methodology-dialog-surface">
          <header className="methodology-dialog-header">
            <div>
              <p className="workspace-eyebrow">{messages.header.methodology}</p>
              <h2 id="methodology-dialog-title">{copy.methodology.title}</h2>
            </div>
            <button
              className="methodology-dialog-close"
              type="button"
              onClick={() => dialogRef.current?.close()}
            >
              {copy.methodology.close}
            </button>
          </header>

          <div className="methodology-dialog-content">
            <p
              className="methodology-dialog-introduction"
              id="methodology-dialog-introduction"
            >
              {electionCopy.methodologyIntroduction}
            </p>

            <section className="methodology-section methodology-notices">
              <h3>{copy.methodology.calculationTitle}</h3>
              <p>{copy.methodology.calculationText}</p>
            </section>

            <section className="methodology-section">
              <h3>{copy.methodology.scenarioTitle}</h3>
              <ul>
                {copy.methodology.scenarioAssumptions.map((assumption) => (
                  <li key={assumption}>{assumption}</li>
                ))}
              </ul>
            </section>

            <section className="methodology-section">
              <h3>{copy.methodology.dataPreparationTitle}</h3>
              <ul>
                {dataPreparationItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="methodology-section methodology-models-section">
              <h3>{copy.methodology.systemsTitle}</h3>
              <div className="methodology-models">
                {models.map((model) => {
                  const isActive = model.systemId === systemId
                  const isHistoricalModel = model.systemId === 'de-2021-bwahlg'

                  return (
                    <article
                      className={`methodology-model${isActive ? ' methodology-model-active' : ''}`}
                      aria-current={isActive ? 'true' : undefined}
                      key={model.systemId}
                    >
                      <div className="methodology-model-heading">
                        <h4>{model.name}</h4>
                        {isActive ? (
                          <span>{copy.methodology.activeModel}</span>
                        ) : null}
                      </div>
                      <p>{model.description}</p>
                      <dl>
                        <div>
                          <dt>{copy.methodology.rules}</dt>
                          <dd>{model.rules}</dd>
                        </div>
                        <div>
                          <dt>{copy.methodology.dataSources}</dt>
                          <dd>
                            {getElectionModelDataSources(
                              i18n.locale,
                              electionYear,
                              model.systemId,
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>{copy.methodology.limitations}</dt>
                          <dd>{model.limitations}</dd>
                        </div>
                      </dl>

                      {isHistoricalModel ? (
                        <aside className="methodology-seat-growth-note">
                          <h5>{copy.methodology.historicalSeatGrowthTitle}</h5>
                          {copy.methodology.historicalSeatGrowthParagraphs.map(
                            (paragraph) => (
                              <p key={paragraph}>{paragraph}</p>
                            ),
                          )}
                        </aside>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </section>

            <section className="methodology-section">
              <h3>{copy.methodology.majorityTitle}</h3>
              <p>{copy.methodology.majorityText}</p>
            </section>

            {notices.length > 0 ? (
              <section className="methodology-section methodology-notices">
                <h3>{copy.methodology.modelNotes}</h3>
                <ul>
                  {notices.map((notice) => (
                    <li key={notice}>{notice}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="methodology-section methodology-sources">
              <h3>{copy.methodology.sourcesTitle}</h3>
              <p>{copy.methodology.sourcesIntroduction}</p>
              <ul>
                {sources.map((source) => (
                  <li key={source.href}>
                    <a href={source.href} target="_blank" rel="noreferrer">
                      {source.label}
                    </a>
                    <p>{source.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </dialog>
    </>
  )
}
