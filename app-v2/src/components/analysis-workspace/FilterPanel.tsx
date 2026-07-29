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
  toggleExcludedValue,
  type FilterDimension,
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

function ValueToggleGroup<T extends string>({
  label,
  excludedValues,
  options,
  wide,
  onChange,
}: {
  label: string
  excludedValues: readonly T[]
  options: readonly FilterOption<T>[]
  wide?: boolean
  onChange: (excludedValues: readonly T[]) => void
}) {
  return (
    <fieldset className="filter-value-group">
      <legend className="visually-hidden">{label} included values</legend>
      <div
        className={
          wide
            ? 'filter-option-grid filter-option-grid-wide'
            : 'filter-option-grid'
        }
      >
        {options.map((option) => {
          const included = !excludedValues.includes(option.value)

          return (
            <button
              className="filter-value-button"
              type="button"
              aria-pressed={included}
              key={option.value}
              onClick={() =>
                onChange(toggleExcludedValue(excludedValues, option.value))
              }
            >
              <span className="filter-value-label">{option.label}</span>
              <span className="filter-value-state" aria-hidden="true">
                {included ? 'Included' : 'Excluded'}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function StateSelectionEditor({
  excludedStates,
  options,
  onChange,
  onClose,
}: {
  excludedStates: readonly string[]
  options: readonly FilterOption<string>[]
  onChange: (excludedStates: readonly string[]) => void
  onClose: () => void
}) {
  const includedCount = Math.max(options.length - excludedStates.length, 0)

  return (
    <div className="filter-menu" id="filter-menu-states">
      <div className="filter-menu-heading">
        <div>
          <strong>Federal state</strong>
          <span>Every state starts included. Select one to exclude it.</span>
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

      <ValueToggleGroup
        label="Federal state"
        excludedValues={excludedStates}
        options={options}
        wide
        onChange={onChange}
      />

      <div className="filter-menu-actions">
        <span>
          {includedCount} of {options.length} included
        </span>
        <button
          type="button"
          disabled={excludedStates.length === 0}
          onClick={() => onChange([])}
        >
          Include all
        </button>
      </div>
    </div>
  )
}

function StateFilterControl({
  summary,
  excludedCount,
  isOpen,
  onOpenChange,
  children,
}: {
  summary: string
  excludedCount: number
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
          {excludedCount === 0 ? 'All included' : `${excludedCount} excluded`}
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
  label,
  summary,
  excludedValues,
  options,
  wide,
  onChange,
}: {
  label: string
  summary: string
  excludedValues: readonly T[]
  options: readonly FilterOption<T>[]
  wide?: boolean
  onChange: (excludedValues: readonly T[]) => void
}) {
  const className = wide
    ? 'inline-filter-card inline-filter-card-wide'
    : 'inline-filter-card'

  return (
    <section className={className} aria-label={`${label} filter`}>
      <div className="inline-filter-heading">
        <div>
          <strong>{label}</strong>
          <span>{summary}</span>
        </div>
        <button
          type="button"
          disabled={excludedValues.length === 0}
          onClick={() => onChange([])}
        >
          Include all
        </button>
      </div>

      <ValueToggleGroup
        label={label}
        excludedValues={excludedValues}
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
          excludedCount={filters.states.length}
          isOpen={statesOpen}
          onOpenChange={(isOpen) => onOpenFilterChange(isOpen ? 'states' : null)}
        >
          <StateSelectionEditor
            excludedStates={filters.states}
            options={states.map((state) => ({ value: state, label: state }))}
            onChange={(excludedStates) =>
              onChange({ ...filters, states: excludedStates })
            }
            onClose={() => onOpenFilterChange(null)}
          />
        </StateFilterControl>

        <InlineSelectionEditor
          label="Age group"
          summary={describeAgeGroupSelection(filters.ageGroups)}
          excludedValues={filters.ageGroups}
          options={ageGroupOptions}
          wide
          onChange={(excludedAgeGroups) =>
            onChange({ ...filters, ageGroups: excludedAgeGroups })
          }
        />

        <InlineSelectionEditor
          label="Gender"
          summary={describeGenderSelection(filters.genders)}
          excludedValues={filters.genders}
          options={genderOptions}
          onChange={(excludedGenders) =>
            onChange({ ...filters, genders: excludedGenders })
          }
        />

        <InlineSelectionEditor
          label="Voting method"
          summary={describeElectionMethodSelection(filters.electionMethods)}
          excludedValues={filters.electionMethods}
          options={electionMethodOptions}
          onChange={(excludedMethods) =>
            onChange({ ...filters, electionMethods: excludedMethods })
          }
        />
      </div>

      <p className="filter-help">
        Every value starts included. Select a value to exclude it, and select it
        again to include it.
      </p>
    </section>
  )
}
