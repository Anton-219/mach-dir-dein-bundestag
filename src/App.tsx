import { useEffect, useState } from 'react'

import { AnalysisWorkspace } from './components/analysis-workspace/AnalysisWorkspace.tsx'
import type { DataState } from './components/analysis-workspace/types.ts'
import { loadElectionData } from './data/loaders.ts'

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

  return <AnalysisWorkspace dataState={dataState} />
}

export default App
