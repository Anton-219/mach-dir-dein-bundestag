import type { Locale } from './messages.ts'

interface ResponsiveWorkspaceCopy {
  switcherLabel: string
  scenario: string
  results: string
}

const responsiveWorkspaceCopy: Record<Locale, ResponsiveWorkspaceCopy> = {
  en: {
    switcherLabel: 'Workspace view',
    scenario: 'Scenario',
    results: 'Results',
  },
  de: {
    switcherLabel: 'Ansicht des Arbeitsbereichs',
    scenario: 'Szenario',
    results: 'Ergebnis',
  },
}

export function getResponsiveWorkspaceCopy(
  locale: Locale,
): ResponsiveWorkspaceCopy {
  return responsiveWorkspaceCopy[locale]
}
