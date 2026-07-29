import { useEffect, useState } from 'react'

import { loadElectionData } from './data/loaders.ts'
import type { ElectionData } from './data/loaders.ts'

type DataState =
  | { status: 'loading' }
  | { status: 'ready'; data: ElectionData }
  | { status: 'error'; message: string }

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'The election data could not be loaded for an unknown reason.'
}

function App() {
  const [dataState, setDataState] = useState<DataState>({ status: 'loading' })

  useEffect(() => {
    let isCurrent = true

    loadElectionData()
      .then((data) => {
        if (isCurrent) {
          setDataState({ status: 'ready', data })
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setDataState({ status: 'error', message: getErrorMessage(error) })
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  return (
    <main className="page-shell">
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">Rebuild workspace</p>
        <h1 id="page-title">Build Your Bundestag</h1>
        <p className="summary">
          This new one-page application will make it easy to explore how
          different voter groups could change the composition of Germany&apos;s
          federal parliament.
        </p>

        {dataState.status === 'loading' && (
          <p className="status" aria-live="polite">
            Loading the confirmed 2021 election data…
          </p>
        )}

        {dataState.status === 'error' && (
          <div className="status status-error" role="alert">
            <strong>Election data could not be loaded.</strong>
            <span>{dataState.message}</span>
          </div>
        )}

        {dataState.status === 'ready' && (
          <p className="status" aria-live="polite">
            Loaded {dataState.data.parties.length} parties,{' '}
            {dataState.data.secondVotes.length.toLocaleString('en-US')}{' '}
            second-vote entries,{' '}
            {dataState.data.statVotes.length.toLocaleString('en-US')}{' '}
            statistical vote entries, and{' '}
            {dataState.data.directMandates.length} direct-mandate results.
          </p>
        )}
      </section>
    </main>
  )
}

export default App
