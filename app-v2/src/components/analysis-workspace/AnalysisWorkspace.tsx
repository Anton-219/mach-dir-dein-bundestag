import { CoalitionPanel } from './CoalitionPanel.tsx'
import { FilterPanel } from './FilterPanel.tsx'
import { GermanyMapPanel } from './GermanyMapPanel.tsx'
import { ParliamentPanel } from './ParliamentPanel.tsx'
import { PartySummaryPanel } from './PartySummaryPanel.tsx'
import { ScenarioSummary } from './ScenarioSummary.tsx'
import type { DataState } from './types.ts'
import { WorkspaceHeader } from './WorkspaceHeader.tsx'

export function AnalysisWorkspace({ dataState }: { dataState: DataState }) {
  return (
    <div className="application-shell">
      <WorkspaceHeader />

      <main className="analysis-shell">
        <ScenarioSummary dataState={dataState} />

        <div className="analysis-workspace" aria-label="Election analysis workspace">
          <div className="workspace-column workspace-column-left">
            <FilterPanel />
            <GermanyMapPanel />
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
