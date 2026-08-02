import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

import { defaultLocale, messageCatalogs } from './src/i18n/messages.ts'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function localizedDefaultMetadata(): Plugin {
  const defaultMessages = messageCatalogs[defaultLocale]

  return {
    name: 'localized-default-metadata',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replaceAll('%DEFAULT_LOCALE%', defaultLocale)
          .replaceAll(
            '%DEFAULT_META_DESCRIPTION%',
            escapeHtml(defaultMessages.meta.description),
          )
          .replaceAll(
            '%DEFAULT_META_TITLE%',
            escapeHtml(defaultMessages.meta.title),
          )
      },
    },
  }
}

export default defineConfig({
  plugins: [localizedDefaultMetadata(), react()],
})
