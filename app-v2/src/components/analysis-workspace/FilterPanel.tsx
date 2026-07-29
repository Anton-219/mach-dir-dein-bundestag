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

function SelectionEditor<T extends string>({
  id,
  label,
  selection,
  options,
  wide,
  onChange,
  onClose,
}: {
  id: string
  label: string
  selection: FilterSelection<T>
  options: readonly FilterOption<T>[]
  wide?: boolean
  onChange: (selection: FilterSelection<T>) => void
  onClose: () => void
}) {
  return (
    <div className="filter-menu" id={id}>
      <div className="filter-menu-heading">
        <div>
          <strong>{label}</strong>
          <span>Choose values, then include only or exclude them.</span>
        </div>
        <button
          className="filter-menu-close"
          type="button"
          aria-label={`Close ${label.toLowerCase()} filter`}
          onClick={onClose}
        >
          ×
        </button>
      </div>

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

function FilterControl({
  dimension,
  label,
  summary,
  selectedCount,
  openFilter,
  onOpenFilterChange,
  children,
}: {
  dimension: FilterDimension
  label: string
  summary: string
  selectedCount: number
  openFilter: FilterDimension | null
  onOpenFilterChange: (dimension: FilterDimension | null) => void
  children: ReactNode
}) {
  const isOpen = openFilter === dimension
  const menuId = `filter-menu-${dimension}`

  return (
    <div
      className={
        isOpen
          ? 'filter-control-shell filter-control-shell-open'
          : 'filter-control-shell'
      }
    >
      <button
        className="filter-control"
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => onOpenFilterChange(isOpen ? null : dimension)}
      >
        <span className="filter-control-copy">
          <strong>{label}</strong>
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

export function FilterPanel({
  filters,
  states,
  openFilter,
  onChange,
  onOpenFilterChange,
}: FilterPanelProps) {
  const closeEditor = () => onOpenFilterChange(null)

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
        <FilterControl
          dimension="states"
          label="Federal state"
          summary={describeStateSelection(filters.states)}
          selectedCount={filters.states.values.length}
          openFilter={openFilter}
          onOpenFilterChange={onOpenFilterChange}
        >
          <SelectionEditor
            id="filter-menu-states"
            label="Federal state"
            selection={filters.states}
            options={states.map((state) => ({ value: state, label: state }))}
            wide
            onChange={(selection) => onChange({ ...filters, states: selection })}
            onClose={closeEditor}
          />
        </FilterControl>

        <FilterControl
          dimension="ageGroups"
          label="Age group"
          summary={describeAgeGroupSelection(filters.ageGroups)}
          selectedCount={filters.ageGroups.values.length}
          openFilter={openFilter}
          onOpenFilterChange={onOpenFilterChange}
        >
          <SelectionEditor
            id="filter-menu-ageGroups"
            label="Age group"
            selection={filters.ageGroups}
            options={ageGroupOptions}
            onChange={(selection) =>
              onChange({ ...filters, ageGroups: selection })
            }
            onClose={closeEditor}
          />
        </FilterControl>

        <FilterControl
          dimension="genders"
          label="Gender"
          summary={describeGenderSelection(filters.genders)}
          selectedCount={filters.genders.values.length}
          openFilter={openFilter}
          onOpenFilterChange={onOpenFilterChange}
        >
          <SelectionEditor
            id="filter-menu-genders"
            label="Gender"
            selection={filters.genders}
            options={genderOptions}
            onChange={(selection) => onChange({ ...filters, genders: selection })}
            onClose={closeEditor}
          />
        </FilterControl>

        <FilterControl
          dimension="electionMethods"
          label="Voting method"
          summary={describeElectionMethodSelection(filters.electionMethods)}
          selectedCount={filters.electionMethods.values.length}
          openFilter={openFilter}
          onOpenFilterChange={onOpenFilterChange}
        >
          <SelectionEditor
            id="filter-menu-electionMethods"
            label="Voting method"
            selection={filters.electionMethods}
            options={electionMethodOptions}
            onChange={(selection) =>
              onChange({ ...filters, electionMethods: selection })
            }
            onClose={closeEditor}
          />
        </FilterControl>
      </div>

      <p className="filter-help">
        Each dimension can include only selected values or exclude them from the
        scenario.
      </p>
    </section>
  )
}
