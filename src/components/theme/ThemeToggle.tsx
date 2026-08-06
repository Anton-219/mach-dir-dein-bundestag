import { useI18n } from '../../i18n/index.ts'
import { useTheme } from '../../theme.ts'

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20.4 14.7A8.5 8.5 0 0 1 9.3 3.6 8.5 8.5 0 1 0 20.4 14.7Z" />
    </svg>
  )
}

export function ThemeToggle() {
  const { messages } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark
    ? messages.theme.switchToLight
    : messages.theme.switchToDark

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
