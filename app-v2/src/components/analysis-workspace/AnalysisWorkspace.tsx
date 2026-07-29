import { useMemo, useState } from 'react'

import {
  applyFilterState,
  countVotes,
  EMPTY_FILTER_STATE,
  type FilterState,
} from '../../lib/filters/index.ts'
import { FilterPanel } from './FilterPanel.tsx'
import { GermanyMapPanel } from './GermanyMapPanel.tsx'
import { ParliamentPanel } from './ParliamentPanel.tsx'
import { PartySummaryPanel } from './PartySummaryPanel.tsx'
import { CoalitionPanel } from './CoalitionPanel.tsx'
import { ScenarioSummary } from './ScenarioSummary.tsx'
import type { DataState } from './types.ts'
import { WorkspaceHeader } from './WorkspaceHeader.tsx'

export function AnalysisWorkspace({ dataState }: { dataState: DataState }) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTER_STATE)

  const scenario = useMemo(() => {
    if (dataState.status !== 'ready') {
      return undefined
    }

    const filteredVotes = applyFilterState(dataState.data.secondVotes, filters)

    return {
      includedVotes: countVotes(filteredVotes),
      totalVotes: countVotes(dataState.data.secondVotes),
      states: [...new Set(dataState.data.secondVotes.map((entry) => entry.state))].sort(),
    }
  }, [dataState, filters])

  return (
    <div className="application-shell">
      <WorkspaceHeader />

      <main className="analysis-shell">
        <ScenarioSummary
          dataState={dataState}
          filters={filters}
          includedVotes={scenario?.includedVotes ?? 0}
          totalVotes={scenario?.totalVotes ?? 0}
          onReset={() => setFilters(EMPTY_FILTER_STATE)}
        />

        <div className="analysis-workspace" aria-label="Election analysis workspace">
          <div className="workspace-column workspace-column-left">
            <FilterPanel filters={filters} onChange={setFilters} />
            <GermanyMapPanel
              filters={filters}
              states={scenario?.states ?? []}
              onChange={setFilters}
            />
          </div>

          <ParliamentPanel />

          <div className="workspace-column workspace-column-right">
            <PartySummaryPanel />
            <CoalitionPanel />
          </div>
        </div>
      </main>

      <footer className="application-footer" id="methodology">
        <p>
          <strong>Methodology:</strong> confirmed 2021 election data and published
          statistical voting groups. Filtered scenarios are exploratory comparisons,
          not forecasts or voting recommendations.
        </p>
      </footer>
    </div>
  )
}
