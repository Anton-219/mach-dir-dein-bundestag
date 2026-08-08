import type { Locale } from './messages.ts'

const mapInteractionMessages = {
  en: {
    invertSelection: 'Invert federal state selection',
  },
  de: {
    invertSelection: 'Auswahl der Bundesländer umkehren',
  },
} satisfies Record<Locale, { invertSelection: string }>

export function getMapInteractionMessages(locale: Locale) {
  return mapInteractionMessages[locale]
}
