import { supportedLocales } from '../../i18n/messages.ts'
import { useI18n } from '../../i18n/index.ts'

export function LanguageSwitcher() {
  const { locale, messages, setLocale } = useI18n()

  return (
    <div
      className="language-switcher"
      role="group"
      aria-label={messages.language.selectionLabel}
    >
      <svg
        className="language-switcher-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.4 2.5 3.7 5.5 3.7 9S14.4 18.5 12 21M12 3C9.6 5.5 8.3 8.5 8.3 12S9.6 18.5 12 21" />
      </svg>

      {supportedLocales.map((candidate, index) => {
        const localeName = messages.language.localeNames[candidate]

        return (
          <span className="language-switcher-option" key={candidate}>
            {index > 0 ? (
              <span className="language-switcher-divider" aria-hidden="true">
                |
              </span>
            ) : null}
            <button
              type="button"
              aria-pressed={locale === candidate}
              aria-label={messages.language.switchTo(localeName)}
              onClick={() => setLocale(candidate)}
            >
              {candidate.toUpperCase()}
            </button>
          </span>
        )
      })}
    </div>
  )
}
