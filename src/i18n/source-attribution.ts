import type { Locale } from './messages.ts'

interface SourceAttribution {
  beforeLicense: string
  licenseLabel: string
  licenseHref: string
  afterLicense: string
}

const sourceAttributions: Record<Locale, SourceAttribution> = {
  en: {
    beforeLicense:
      'Election data: The Federal Returning Officer (on behalf of the publishing consortium), Wiesbaden 2024/2025. The official source data are provided under the',
    licenseLabel:
      'Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0)',
    licenseHref: 'https://www.govdata.de/dl-de/by-2-0',
    afterLicense:
      'The source data were prepared, combined, statistically modelled, and partly modified for this application. The original datasets used are linked above.',
  },
  de: {
    beforeLicense:
      'Wahldaten: Die Bundeswahlleiterin (im Auftrag der Herausgebergemeinschaft), Wiesbaden 2024/2025. Die amtlichen Ausgangsdaten stehen unter der',
    licenseLabel:
      'Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0)',
    licenseHref: 'https://www.govdata.de/dl-de/by-2-0',
    afterLicense:
      'Die Ausgangsdaten wurden für diese Anwendung aufbereitet, zusammengeführt, statistisch modelliert und teilweise verändert. Die jeweils verwendeten Originaldatensätze sind oben verlinkt.',
  },
}

export function getSourceAttribution(locale: Locale): SourceAttribution {
  return sourceAttributions[locale]
}
