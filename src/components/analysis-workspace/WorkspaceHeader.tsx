import { useI18n } from '../../i18n/index.ts'
import { LanguageSwitcher } from '../language/LanguageSwitcher.tsx'

export function WorkspaceHeader() {
  const { messages } = useI18n()

  return (
    <>
      <a className="skip-link" href="#analysis-workspace">
        {messages.header.skipLink}
      </a>

      <header className="workspace-header">
        <div className="workspace-brand">
          <p className="workspace-eyebrow">{messages.header.eyebrow}</p>
          <h1>{messages.header.title}</h1>
        </div>

        <p className="workspace-introduction">
          {messages.header.introduction}
        </p>

        <div className="workspace-header-actions">
          <a className="methodology-link" href="#methodology">
            {messages.header.methodology}
          </a>
          <LanguageSwitcher />
        </div>
      </header>
    </>
  )
}
