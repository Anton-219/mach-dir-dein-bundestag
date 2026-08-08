import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { I18nProvider } from './i18n/index.ts'
import { initializeTheme } from './theme.ts'
import './styles.css'
import './filter-styles.css'
import './result-styles.css'
import './party-constituency-styles.css'
import './accessibility-styles.css'
import './desktop-refinement.css'
import './desktop-refinement-iteration.css'
import './i18n-styles.css'
import './electoral-system-styles.css'
import './theme-styles.css'
import './responsive.css'

initializeTheme()

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('The root application element is missing.')
}

createRoot(rootElement).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
