import type { ReactNode } from 'react'

import type {
  AgeGroup,
  ElectionMethod,
  Gender,
} from '../../models/json-contracts.ts'
import {
  countActiveFilterDimensions,
  describeAgeGroupSelection,
  describeElectionMethodSelection,
  describeGenderSelection,
  describeStateSelection,
  setSelectionMode,
  toggleSelectionValue,
  type FilterDimension,
  type FilterSelection,
  type FilterState,
} from '../../lib/filters/index.ts'

const ageGroupOptions = [
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55-64', label: '55–64' },
  { value: '65+', label: '65+' },
] as const satisfies readonly { value: AgeGroup; label: string }[]

const genderOptions = [
  { value: 'm', label: 'Men' },
  { value: 'w', label: 'Women' },
] as const satisfies readonly { value: Gender; label: string }[]

const electionMethodOptions = [
  { value: 'postal', label: 'Postal voting' },
  { value: 'in-person', label: 'In-person voting' },
] as const satisfies readonly { value: ElectionMethod; label: string }[]

interface FilterPanelProps {
  filters: FilterState
  states: readonly string[]
  openFilter: FilterDimension | null
  onChange: (filters: FilterState) => void
  onOpenFilterChange: (dimension: FilterDimension | null) => void
}

interface FilterOption<T extends string> {
  value: T
  label: string
}

function SelectionFields<T extends string>({
  id,
  selection,
  options,
  wide,
  onChange,
}: {
  id: string
  selection: FilterSelection<T>
  options: readonly FilterOption<T>[]
  wide?: boolean
  onChange: (selection: FilterSelection<T>) => void
}) {
  return (
    <>
      <fieldset className="filter-mode-group">
        <legend>Selection rule</legend>
        <div className="filter-mode-options">
          <label>
            <input
              type="radio"
              name={`${id}-mode`}
              value="include"
              checked={selection.mode === 'include'}
              onChange={() => onChange(setSelectionMode(selection, 'include'))}
            />
            <span>Include only</span>
          </label>
          <label>
            <input
              type="radio"
              name={`${id}-mode`}
              value="exclude"
              checked={selection.mode === 'exclude'}
              onChange={() => onChange(setSelectionMode(selection, 'exclude'))}
            />
            <span>Exclude</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="filter-value-group">
        <legend>Values</legend>
        <div
          className={
            wide
              ? 'filter-option-grid filter-option-grid-wide'
              : 'filter-option-grid'
          }
        >
          {options.map((option) => (
            <label className="filter-checkbox" key={option.value}>
              <input
                type="checkbox"
                checked={selection.values.includes(option.value)}
                onChange={() =>
                  onChange(toggleSelectionValue(selection, option.value))
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  )
}

function StateSelectionEditor({
  selection,
  options,
  onChange,
  onClose,
}: {
  selection: FilterSelection<string>
  options: readonly FilterOption<string>[]
  onChange: (selection: FilterSelection<string>) => void
  onClose: () => void
}) {
  return (
    <div className="filter-menu" id="filter-menu-states">
      <div className="filter-menu-heading">
        <div>
          <strong>Federal state</strong>
          <span>Choose states, then include only or exclude them.</span>
        </div>
        <button
          className="filter-menu-close"
          type="button"
          aria-label="Close federal state filter"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <SelectionFields
        id="filter-states"
        selection={selection}
        options={options}
        wide
        onChange={onChange}
      />

      <div className="filter-menu-actions">
        <span>
          {selection.values.length === 0
            ? 'No active selection'
            : `${selection.values.length} selected`}
        </span>
        <button
          type="button"
          disabled={selection.values.length === 0}
          onClick={() => onChange({ mode: 'include', values: [] })}
        >
          Clear
        </button>
      </div>
    </div>
  )
}

function StateFilterControl({
  summary,
  selectedCount,
  isOpen,
  onOpenChange,
  children,
}: {
  summary: string
  selectedCount: number
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  children: ReactNode
}) {
  return (
    <div
      className={
        isOpen
          ? 'filter-control-shell filter-control-shell-state filter-control-shell-open'
          : 'filter-control-shell filter-control-shell-state'
      }
    >
      <button
        className="filter-control"
        type="button"
        aria-expanded={isOpen}
        aria-controls="filter-menu-states"
        onClick={() => onOpenChange(!isOpen)}
      >
        <span className="filter-control-copy">
          <strong>Federal state</strong>
          <small>{summary}</small>
        </span>
        <span className="filter-control-status">
          {selectedCount === 0 ? 'All' : `${selectedCount} selected`}
          <span className="filter-control-chevron" aria-hidden="true">
            ⌄
          </span>
        </span>
      </button>
      {isOpen ? children : null}
    </div>
  )
}

function InlineSelectionEditor<T extends string>({
  id,
  label,
  summary,
  selection,
  options,
  wide,
  onChange,
}: {
  id: string
  label: string
  summary: string
  selection: FilterSelection<T>
  options: readonly FilterOption<T>[]
  wide?: boolean
  onChange: (selection: FilterSelection<T>) => void
}) {
  const className = wide
    ? 'inline-filter-card inline-filter-card-wide'
    : 'inline-filter-card'

  return (
    <section className={className} aria-labelledby={`${id}-title`}>
      <div className="inline-filter-heading">
        <div>
          <strong id={`${id}-title`}>{label}</strong>
          <span>{summary}</span>
        </div>
        <button
          type="button"
          disabled={selection.values.length === 0}
          onClick={() => onChange({ mode: 'include', values: [] })}
        >
          Clear
        </button>
      </div>

      <SelectionFields
        id={id}
        selection={selection}
        options={options}
        onChange={onChange}
      />
    </section>
  )
}

export function FilterPanel({
  filters,
  states,
  openFilter,
  onChange,
  onOpenFilterChange,
}: FilterPanelProps) {
  const statesOpen = openFilter === 'states'

  return (
    <section className="workspace-panel filter-panel" aria-labelledby="filters-title">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Scenario controls</p>
          <h2 id="filters-title">Filters</h2>
        </div>
        <span className="panel-badge">
          {countActiveFilterDimensions(filters)} active
        </span>
      </div>

      <div className="filter-list">
        <StateFilterControl
          summary={describeStateSelection(filters.states)}
          selectedCount={filters.states.values.length}
          isOpen={statesOpen}
          onOpenChange={(isOpen) => onOpenFilterChange(isOpen ? 'states' : null)}
        >
          <StateSelectionEditor
            selection={filters.states}
            options={states.map((state) => ({ value: state, label: state }))}
            onChange={(selection) => onChange({ ...filters, states: selection })}
            onClose={() => onOpenFilterChange(null)}
          />
        </StateFilterControl>

        <InlineSelectionEditor
          id="filter-age-groups"
          label="Age group"
          summary={describeAgeGroupSelection(filters.ageGroups)}
          selection={filters.ageGroups}
          options={ageGroupOptions}
          wide
          onChange={(selection) => onChange({ ...filters, ageGroups: selection })}
        />

        <InlineSelectionEditor
          id="filter-genders"
          label="Gender"
          summary={describeGenderSelection(filters.genders)}
          selection={filters.genders}
          options={genderOptions}
          onChange={(selection) => onChange({ ...filters, genders: selection })}
        />

        <InlineSelectionEditor
          id="filter-election-methods"
          label="Voting method"
          summary={describeElectionMethodSelection(filters.electionMethods)}
          selection={filters.electionMethods}
          options={electionMethodOptions}
          onChange={(selection) =>
            onChange({ ...filters, electionMethods: selection })
          }
        />
      </div>

      <p className="filter-help">
        Age, gender, and voting method stay directly available. Open the federal
        state filter to edit the longer state list.
      </p>
    </section>
  )
}
