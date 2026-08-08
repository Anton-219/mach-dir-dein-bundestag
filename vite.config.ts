import { execFileSync } from 'node:child_process'

import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

import { defaultLocale, messageCatalogs } from './src/i18n/messages.ts'

function resolveLastUpdatedAt(): string {
  try {
    const commitDate = execFileSync('git', ['log', '-1', '--format=%cI'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()

    if (commitDate.length > 0) {
      return commitDate
    }
  } catch {
    // No git context, for example a build from an archive. Fall back to the build time.
  }

  return new Date().toISOString()
}

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
  base: '/mach-dir-dein-bundestag/',
  build: {
    license: {
      fileName: 'third-party-licenses.md',
    },
  },
  define: {
    __LAST_UPDATED_AT__: JSON.stringify(resolveLastUpdatedAt()),
  },
  plugins: [localizedDefaultMetadata(), react()],
})
