import { useI18n } from '../../i18n/index.ts'
import { LanguageSwitcher } from '../language/LanguageSwitcher.tsx'
import { ThemeToggle } from '../theme/ThemeToggle.tsx'

interface WorkspaceHeaderProps {
  onOpenMethodology: () => void
}

export function WorkspaceHeader({ onOpenMethodology }: WorkspaceHeaderProps) {
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
          <button
            className="methodology-link"
            type="button"
            onClick={onOpenMethodology}
          >
            {messages.header.methodology}
          </button>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
    </>
  )
}
