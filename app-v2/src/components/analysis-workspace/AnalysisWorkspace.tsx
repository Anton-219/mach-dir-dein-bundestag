import { useMemo, useState } from 'react'

import { calculateMinimalWinningCoalitions } from '../../lib/coalitions/index.ts'
import {
  aggregateElectionResults,
  allocateSeats,
} from '../../lib/election/index.ts'
import {
  applyFilterState,
  clearFilterDimension,
  countVotes,
  createEmptyFilterState,
  type FilterDimension,
  type FilterState,
} from '../../lib/filters/index.ts'
import { CoalitionPanel } from './CoalitionPanel.tsx'
import { FilterPanel } from './FilterPanel.tsx'
import { GermanyMapPanel } from './GermanyMapPanel.tsx'
import { ParliamentPanel } from './ParliamentPanel.tsx'
import { PartySummaryPanel } from './PartySummaryPanel.tsx'
import { ScenarioSummary } from './ScenarioSummary.tsx'
import type { DataState, ScenarioResult } from './types.ts'
import { WorkspaceHeader } from './WorkspaceHeader.tsx'

export function AnalysisWorkspace({ dataState }: { dataState: DataState }) {
  const [filters, setFilters] = useState<FilterState>(() => createEmptyFilterState())
  const [openFilter, setOpenFilter] = useState<FilterDimension | null>(null)

  const availableStates = useMemo(() => {
    if (dataState.status !== 'ready') {
      return []
    }

    return [...new Set(dataState.data.secondVotes.map((entry) => entry.state))].sort()
  }, [dataState])

  const scenario = useMemo<ScenarioResult | undefined>(() => {
    if (dataState.status !== 'ready') {
      return undefined
    }

    const filteredVotes = applyFilterState(dataState.data.secondVotes, filters)
    const electionResults = aggregateElectionResults(
      filteredVotes,
      dataState.data.parties,
    )
    const seatResults = allocateSeats(
      electionResults,
      dataState.data.directMandates,
    )
    const includedVotes = countVotes(filteredVotes)
    const totalVotes = countVotes(dataState.data.secondVotes)
    const totalSeats = seatResults.reduce((total, result) => total + result.seats, 0)
    const majorityThreshold = totalSeats === 0 ? 0 : Math.floor(totalSeats / 2) + 1
    const coalitions = calculateMinimalWinningCoalitions(
      seatResults,
      majorityThreshold,
    )

    return {
      electionResults,
      seatResults,
      coalitions,
      includedVotes,
      totalVotes,
      includedShare: totalVotes === 0 ? 0 : includedVotes / totalVotes,
      totalSeats,
      majorityThreshold,
    }
  }, [dataState, filters])

  const resetFilters = () => {
    setFilters(createEmptyFilterState())
    setOpenFilter(null)
  }

  return (
    <div className="application-shell">
      <WorkspaceHeader />

      <main className="analysis-shell">
        <ScenarioSummary
          dataState={dataState}
          filters={filters}
          scenario={scenario}
          onClearFilter={(dimension) =>
            setFilters((currentFilters) =>
              clearFilterDimension(currentFilters, dimension),
            )
          }
          onReset={resetFilters}
        />

        <div className="analysis-workspace" aria-label="Election analysis workspace">
          <div className="workspace-column workspace-column-left">
            <FilterPanel
              filters={filters}
              states={availableStates}
              openFilter={openFilter}
              onChange={setFilters}
              onOpenFilterChange={setOpenFilter}
            />
            <GermanyMapPanel
              excludedStates={filters.states}
              totalStateCount={availableStates.length}
              onEditStates={() => setOpenFilter('states')}
            />
          </div>

          <ParliamentPanel scenario={scenario} />

          <div className="workspace-column workspace-column-right">
            <PartySummaryPanel
              parties={dataState.status === 'ready' ? dataState.data.parties : []}
              scenario={scenario}
            />
            <CoalitionPanel scenario={scenario} />
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
