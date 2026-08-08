import { useMemo, useState } from 'react'

import type { ElectionYear } from '../../data/elections.ts'
import { useI18n, type ScenarioReason } from '../../i18n/index.ts'
import { calculateMinimalWinningCoalitions } from '../../lib/coalitions/index.ts'
import {
  aggregateElectionResults,
  buildElectoralScenario,
  calculateElectoralSystem,
  createElectoralScenarioReference,
  DEFAULT_ELECTORAL_SYSTEM_ID,
  toSeatResults,
  type ElectoralSystemId,
} from '../../lib/election/index.ts'
import {
  applyFilterState,
  countVotes,
  createEmptyFilterState,
  invertExcludedValues,
  toggleExcludedValue,
  type FilterDimension,
  type FilterState,
} from '../../lib/filters/index.ts'
import { buildStatePartyLandscape } from '../../lib/results/state-party-landscape.ts'
import { CoalitionPanel } from './CoalitionPanel.tsx'
import { DemographicPanel } from './DemographicPanel.tsx'
import { FilterPanel } from './FilterPanel.tsx'
import { GermanyMapPanel } from './GermanyMapPanel.tsx'
import { MethodologyDialog } from './MethodologyDialog.tsx'
import { ParliamentPanel } from './ParliamentPanel.tsx'
import { PartySummaryPanel } from './PartySummaryPanel.tsx'
import { ScenarioSummary } from './ScenarioSummary.tsx'
import { StatePartyLandscapePanel } from './StatePartyLandscapePanel.tsx'
import type { DataState, ScenarioResult } from './types.ts'
import { WorkspaceHeader } from './WorkspaceHeader.tsx'

function createUnavailableScenario(
  status: 'empty' | 'invalid',
  reason: ScenarioReason,
  includedVotes: number,
  totalVotes: number,
): ScenarioResult {
  return {
    status,
    reason,
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

function hasActiveFilters(filters: FilterState): boolean {
  return Object.values(filters).some((excludedValues) => excludedValues.length > 0)
}

interface AnalysisWorkspaceProps {
  dataState: DataState
  electionYear: ElectionYear
  onElectionYearChange: (electionYear: ElectionYear) => void
}

export function AnalysisWorkspace({
  dataState,
  electionYear,
  onElectionYearChange,
}: AnalysisWorkspaceProps) {
  const { messages } = useI18n()
  const [filters, setFilters] = useState<FilterState>(() => createEmptyFilterState())
  const [electoralSystemId, setElectoralSystemId] =
    useState<ElectoralSystemId>(DEFAULT_ELECTORAL_SYSTEM_ID)
  const [methodologyOpen, setMethodologyOpen] = useState(false)
  const [openFilter, setOpenFilter] = useState<FilterDimension | null>(null)
  const [highlightedState, setHighlightedState] = useState<string | null>(null)

  const availableStates = useMemo(() => {
    if (dataState.status !== 'ready') {
      return []
    }

    return [...new Set(dataState.data.secondVotes.map((entry) => entry.state))].sort()
  }, [dataState])

  const electoralScenarioReference = useMemo(() => {
    if (dataState.status !== 'ready') {
      return undefined
    }

    try {
      return createElectoralScenarioReference({
        firstVotes: dataState.data.firstVotes,
        secondVotes: dataState.data.secondVotes,
        parties: dataState.data.parties,
      })
    } catch {
      return null
    }
  }, [dataState])

  const scenario = useMemo<ScenarioResult | undefined>(() => {
    if (dataState.status !== 'ready') {
      return undefined
    }

    let includedVotes = 0
    let totalVotes = 0

    try {
      const filteredSecondVotes = applyFilterState(
        dataState.data.secondVotes,
        filters,
      )
      const filteredFirstVotes = applyFilterState(
        dataState.data.firstVotes,
        filters,
      )
      includedVotes = countVotes(filteredSecondVotes)
      totalVotes = countVotes(dataState.data.secondVotes)

      if (!Number.isFinite(totalVotes) || totalVotes <= 0) {
        return createUnavailableScenario('invalid', 'noUsableVotes', 0, 0)
      }

      if (!Number.isFinite(includedVotes) || includedVotes < 0) {
        return createUnavailableScenario(
          'invalid',
          'invalidVoteTotal',
          0,
          totalVotes,
        )
      }

      if (includedVotes === 0) {
        return createUnavailableScenario(
          'empty',
          'noVotesIncluded',
          includedVotes,
          totalVotes,
        )
      }

      if (electoralScenarioReference === null) {
        return createUnavailableScenario(
          'invalid',
          'calculationFailed',
          includedVotes,
          totalVotes,
        )
      }
      if (electoralScenarioReference === undefined) {
        return undefined
      }

      const electionResults = aggregateElectionResults(
        filteredSecondVotes,
        dataState.data.parties,
      )
      const electoralScenario = buildElectoralScenario({
        mode: hasActiveFilters(filters)
          ? 'filtered-model'
          : 'unfiltered-reference',
        firstVotes: filteredFirstVotes,
        secondVotes: filteredSecondVotes,
        reference: electoralScenarioReference,
        inactiveStates: filters.states,
      })
      const electoralSystemResult = calculateElectoralSystem(
        electoralSystemId,
        electoralScenario,
        {
          stateSeatContingents: dataState.data.stateSeatContingents,
          stateSeatContingentYear: dataState.data.stateSeatContingentYear,
        },
      )
      const seatResults = toSeatResults(
        electoralSystemResult,
        dataState.data.parties,
      )
      const { totalSeats, majorityThreshold } = electoralSystemResult

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
          'invalidParliament',
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
        electoralSystemResult,
      }
    } catch {
      return createUnavailableScenario(
        'invalid',
        'calculationFailed',
        includedVotes,
        totalVotes,
      )
    }
  }, [dataState, electoralScenarioReference, electoralSystemId, filters])

  const statePartyLandscape = useMemo(() => {
    if (dataState.status !== 'ready' || highlightedState === null) {
      return undefined
    }

    return buildStatePartyLandscape(
      dataState.data.secondVotes,
      dataState.data.parties,
      highlightedState,
      filters,
    )
  }, [dataState, filters, highlightedState])

  const resetFilters = () => {
    setFilters(createEmptyFilterState())
    setOpenFilter(null)
  }

  const toggleState = (state: string) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      states: toggleExcludedValue(currentFilters.states, state),
    }))
  }

  const invertStates = () => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      states: invertExcludedValues(availableStates, currentFilters.states),
    }))
  }

  const parties = dataState.status === 'ready' ? dataState.data.parties : []
  const germanyStates =
    dataState.status === 'ready' ? dataState.data.germanyStates.features : []
  const secondVotes = dataState.status === 'ready' ? dataState.data.secondVotes : []

  return (
    <div className="application-shell">
      <WorkspaceHeader
        electionYear={electionYear}
        onOpenMethodology={() => setMethodologyOpen(true)}
      />

      <main
        className="analysis-shell"
        id="analysis-workspace"
        aria-label={messages.workspace.ariaLabel}
        aria-busy={dataState.status === 'loading'}
      >
        <div className="workspace-column workspace-column-left">
          <FilterPanel
            filters={filters}
            states={availableStates}
            openFilter={openFilter}
            scenario={scenario}
            onChange={setFilters}
            onOpenFilterChange={setOpenFilter}
            onReset={resetFilters}
          />
          <DemographicPanel secondVotes={secondVotes} filters={filters} />
        </div>

        <ScenarioSummary
          dataState={dataState}
          filters={filters}
          scenario={scenario}
          electoralSystemId={electoralSystemId}
          electionYear={electionYear}
          onElectoralSystemChange={setElectoralSystemId}
          onElectionYearChange={onElectionYearChange}
        />

        <div className="analysis-workspace">
          <div className="workspace-column workspace-column-center">
            <ParliamentPanel parties={parties} scenario={scenario} />
            <PartySummaryPanel parties={parties} scenario={scenario} />
          </div>

          <CoalitionPanel parties={parties} scenario={scenario} />
        </div>

        <div className="workspace-column workspace-column-context">
          <GermanyMapPanel
            features={germanyStates}
            excludedStates={filters.states}
            onToggleState={toggleState}
            onInvertStates={invertStates}
            onHighlightedStateChange={setHighlightedState}
          />
          <StatePartyLandscapePanel
            state={highlightedState}
            landscape={statePartyLandscape}
            parties={parties}
            excluded={
              highlightedState !== null && filters.states.includes(highlightedState)
            }
          />
        </div>
      </main>

      <MethodologyDialog
        open={methodologyOpen}
        systemId={electoralSystemId}
        electionYear={electionYear}
        scenario={scenario}
        onClose={() => setMethodologyOpen(false)}
      />
    </div>
  )
}
