import { useEffect, useState } from 'react'

import { AnalysisWorkspace } from './components/analysis-workspace/AnalysisWorkspace.tsx'
import type { DataState } from './components/analysis-workspace/types.ts'
import {
  DEFAULT_ELECTION_YEAR,
  type ElectionYear,
} from './data/elections.ts'
import { loadElectionData } from './data/loaders.ts'

function App() {
  const [electionYear, setElectionYear] = useState<ElectionYear>(
    DEFAULT_ELECTION_YEAR,
  )
  const [dataState, setDataState] = useState<DataState>({ status: 'loading' })

  useEffect(() => {
    let isCurrent = true
    setDataState({ status: 'loading' })

    loadElectionData(electionYear)
      .then((data) => {
        if (isCurrent) {
          setDataState({ status: 'ready', data })
        }
      })
      .catch(() => {
        if (isCurrent) {
          setDataState({ status: 'error' })
        }
      })

    return () => {
      isCurrent = false
    }
  }, [electionYear])

  return (
    <AnalysisWorkspace
      dataState={dataState}
      electionYear={electionYear}
      onElectionYearChange={setElectionYear}
    />
  )
}

export default App
