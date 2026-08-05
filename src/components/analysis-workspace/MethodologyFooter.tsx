import {
  getElectoralSystemCatalog,
  getElectoralSystemModelCopy,
  getElectoralSystemNoticeTexts,
  useI18n,
} from '../../i18n/index.ts'
import type { ElectoralSystemId } from '../../lib/election/index.ts'
import type { ScenarioResult } from './types.ts'

interface MethodologyFooterProps {
  systemId: ElectoralSystemId
  scenario?: ScenarioResult
}

export function MethodologyFooter({
  systemId,
  scenario,
}: MethodologyFooterProps) {
  const i18n = useI18n()
  const { messages } = i18n
  const copy = getElectoralSystemCatalog(i18n.locale)
  const model = getElectoralSystemModelCopy(systemId, i18n.locale)
  const result =
    scenario?.status === 'ready' ? scenario.electoralSystemResult : undefined
  const notices =
    result === undefined ? [] : getElectoralSystemNoticeTexts(result, i18n)

  return (
    <footer
      className="application-footer methodology-footer"
      id="methodology"
      aria-labelledby="methodology-title"
    >
      <h2 className="visually-hidden" id="methodology-title">
        {copy.methodology.title}
      </h2>
      <details className="methodology-details">
        <summary>
          <strong>{messages.footer.label}</strong>{' '}
          {copy.methodology.summary(model.name)}
        </summary>
        <div className="methodology-content">
          <p className="methodology-introduction">{messages.footer.text}</p>
          <section>
            <h3>{copy.methodology.rules}</h3>
            <p>{model.rules}</p>
          </section>
          <section>
            <h3>{copy.methodology.dataSources}</h3>
            <p>{model.dataSources}</p>
          </section>
          <section>
            <h3>{copy.methodology.limitations}</h3>
            <p>{model.limitations}</p>
          </section>
          {notices.length > 0 ? (
            <section>
              <h3>{copy.methodology.modelNotes}</h3>
              <ul>
                {notices.map((notice) => (
                  <li key={notice}>{notice}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </details>
    </footer>
  )
}
