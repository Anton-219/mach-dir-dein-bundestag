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

function createUnavailableScenario(
  status: 'empty' | 'invalid',
  message: string,
  includedVotes: number,
  totalVotes: number,
): ScenarioResult {
  return {
    status,
    message,
    electionResults: [],
    seatResults: [],
    coalitions: [],
    includedVotes,
    totalVotes,
    includedShare:
      totalVotes > 0 && Number.isFinite(includedVotes / totalVotes)
        ? includedVotes / totalVotes
        : 0,
    totalSeats: 0,
    majorityThreshold: 0,
  }
}

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

    let includedVotes = 0
    let totalVotes = 0

    try {
      const filteredVotes = applyFilterState(dataState.data.secondVotes, filters)
      includedVotes = countVotes(filteredVotes)
      totalVotes = countVotes(dataState.data.secondVotes)

      if (!Number.isFinite(totalVotes) || totalVotes <= 0) {
        return createUnavailableScenario(
          'invalid',
          'The election data contains no usable second votes.',
          0,
          0,
        )
      }

      if (!Number.isFinite(includedVotes) || includedVotes < 0) {
        return createUnavailableScenario(
          'invalid',
          'The active filters produced an invalid vote total.',
          0,
          totalVotes,
        )
      }

      if (includedVotes === 0) {
        return createUnavailableScenario(
          'empty',
          'No votes are included. Re-enable at least one value in the filters.',
          includedVotes,
          totalVotes,
        )
      }

      const electionResults = aggregateElectionResults(
        filteredVotes,
        dataState.data.parties,
      )
      const seatResults = allocateSeats(
        electionResults,
        dataState.data.directMandates,
      )
      const totalSeats = seatResults.reduce(
        (total, result) => total + result.seats,
        0,
      )
      const majorityThreshold = Math.floor(totalSeats / 2) + 1

      const hasInvalidElectionResult = electionResults.some(
        (result) =>
          !Number.isFinite(result.votes) ||
          result.votes < 0 ||
          !Number.isFinite(result.percentage) ||
          result.percentage < 0,
      )
      const hasInvalidSeatResult = seatResults.some(
        (result) =>
          !Number.isInteger(result.seats) ||
          result.seats < 0 ||
          !Number.isFinite(result.seatPosition),
      )

      if (
        hasInvalidElectionResult ||
        hasInvalidSeatResult ||
        !Number.isInteger(totalSeats) ||
        totalSeats <= 0 ||
        !Number.isInteger(majorityThreshold) ||
        majorityThreshold <= 0
      ) {
        return createUnavailableScenario(
          'invalid',
          'The active scenario produced an invalid parliamentary result.',
          includedVotes,
          totalVotes,
        )
      }

      const coalitions = calculateMinimalWinningCoalitions(
        seatResults,
        majorityThreshold,
      )

      return {
        status: 'ready',
        electionResults,
        seatResults,
        coalitions,
        includedVotes,
        totalVotes,
        includedShare: includedVotes / totalVotes,
        totalSeats,
        majorityThreshold,
      }
    } catch (error) {
      const detail = error instanceof Error ? ` ${error.message}` : ''

      return createUnavailableScenario(
        'invalid',
        `The active scenario could not be calculated.${detail}`,
        includedVotes,
        totalVotes,
      )
    }
  }, [dataState, filters])

  const resetFilters = () => {
    setFilters(createEmptyFilterState())
    setOpenFilter(null)
  }

  const parties = dataState.status === 'ready' ? dataState.data.parties : []

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

          <ParliamentPanel parties={parties} scenario={scenario} />

          <div className="workspace-column workspace-column-right">
            <PartySummaryPanel parties={parties} scenario={scenario} />
            <CoalitionPanel parties={parties} scenario={scenario} />
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
