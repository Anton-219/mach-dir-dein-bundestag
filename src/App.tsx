import { useEffect, useState } from 'react'

import { AnalysisWorkspace } from './components/analysis-workspace/AnalysisWorkspace.tsx'
import type { DataState } from './components/analysis-workspace/types.ts'
import { loadElectionData } from './data/loaders.ts'

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
        console.error(error)
        if (isCurrent) {
          setDataState({ status: 'error' })
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  return <AnalysisWorkspace dataState={dataState} />
}

export default App
