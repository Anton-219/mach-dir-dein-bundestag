import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles.css'
import './filter-styles.css'
import './result-styles.css'
import './accessibility-styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('The root application element is missing.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
