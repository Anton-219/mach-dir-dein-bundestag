import type {
  AgeGroup,
  ElectionMethod,
  Gender,
} from '../../models/json-contracts.ts'
import {
  countActiveFilterDimensions,
  toggleFilterValue,
  type FilterState,
} from '../../lib/filters/index.ts'

const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'] as const
const genders = [
  { value: 'm', label: 'Men' },
  { value: 'w', label: 'Women' },
] as const satisfies readonly { value: Gender; label: string }[]
const electionMethods = [
  { value: 'postal', label: 'Postal' },
  { value: 'in-person', label: 'In person' },
] as const satisfies readonly { value: ElectionMethod; label: string }[]

interface FilterPanelProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

function ToggleGroup<T extends string>({
  legend,
  values,
  selectedValues,
  onToggle,
}: {
  legend: string
  values: readonly { value: T; label: string }[]
  selectedValues: readonly T[]
  onToggle: (value: T) => void
}) {
  return (
    <fieldset className="filter-group">
      <legend>{legend}</legend>
      <div className="filter-options">
        {values.map((option) => {
          const selected = selectedValues.includes(option.value)
          return (
            <button
              className="filter-option"
              type="button"
              aria-pressed={selected}
              key={option.value}
              onClick={() => onToggle(option.value)}
            >
              {option.label}
              <span aria-hidden="true">{selected ? 'Included' : 'Any'}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
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
        <ToggleGroup<AgeGroup>
          legend="Age group"
          values={ageGroups.map((value) => ({ value, label: value }))}
          selectedValues={filters.ageGroups}
          onToggle={(value) =>
            onChange({
              ...filters,
              ageGroups: toggleFilterValue(filters.ageGroups, value),
            })
          }
        />
        <ToggleGroup<Gender>
          legend="Gender"
          values={genders}
          selectedValues={filters.genders}
          onToggle={(value) =>
            onChange({
              ...filters,
              genders: toggleFilterValue(filters.genders, value),
            })
          }
        />
        <ToggleGroup<ElectionMethod>
          legend="Voting method"
          values={electionMethods}
          selectedValues={filters.electionMethods}
          onToggle={(value) =>
            onChange({
              ...filters,
              electionMethods: toggleFilterValue(filters.electionMethods, value),
            })
          }
        />
      </div>

      <p className="panel-placeholder-note">
        Federal states are selected in the labelled state list below. An empty
        selection means that every value is included.
      </p>
    </section>
  )
}
