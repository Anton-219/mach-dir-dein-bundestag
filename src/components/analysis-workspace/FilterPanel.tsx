import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'

import {
  describeAgeGroupSelection,
  describeElectionMethodSelection,
  describeGenderSelection,
  describeStateSelection,
  summarizeFilterState,
  useI18n,
} from '../../i18n/index.ts'
import {
  toggleExcludedValue,
  type FilterDimension,
  type FilterState,
} from '../../lib/filters/index.ts'
import type {
  AgeGroup,
  ElectionMethod,
  Gender,
} from '../../models/json-contracts.ts'
import type { ScenarioResult } from './types.ts'

const ageGroupOptions = [
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55-64', label: '55–64' },
  { value: '65+', label: '65+' },
] as const satisfies readonly { value: AgeGroup; label: string }[]

const genderValues = ['m', 'w'] as const satisfies readonly Gender[]
const electionMethodValues = [
  'postal',
  'in-person',
] as const satisfies readonly ElectionMethod[]

interface FilterPanelProps {
  filters: FilterState
  states: readonly string[]
  openFilter: FilterDimension | null
  scenario?: ScenarioResult
  onChange: (filters: FilterState) => void
  onOpenFilterChange: (dimension: FilterDimension | null) => void
  onReset: () => void
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
  const { messages } = useI18n()

  return (
    <fieldset className="filter-value-group">
      <legend className="visually-hidden">
        {messages.filters.valuesLegend(label)}
      </legend>
      <div
        className={
          wide
            ? 'filter-option-grid filter-option-grid-wide'
            : 'filter-option-grid'
        }
      >
        {options.map((option) => {
          const included = !excludedValues.includes(option.value)
          const stateLabel = included
            ? messages.common.included
            : messages.common.excluded

          return (
            <button
              className="filter-value-button"
              type="button"
              aria-pressed={included}
              aria-label={messages.filters.optionAriaLabel(
                option.label,
                stateLabel,
              )}
              key={option.value}
              onClick={() =>
                onChange(toggleExcludedValue(excludedValues, option.value))
              }
            >
              <span className="filter-value-label">{option.label}</span>
              <span className="filter-value-state" aria-hidden="true">
                {stateLabel}
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
  const { messages } = useI18n()
  const editorRef = useRef<HTMLElement>(null)
  const includedCount = Math.max(options.length - excludedStates.length, 0)

  useEffect(() => {
    editorRef.current
      ?.querySelector<HTMLButtonElement>('button:not(:disabled)')
      ?.focus()

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <section
      className="filter-menu"
      id="filter-menu-states"
      ref={editorRef}
      aria-labelledby="filter-menu-states-title"
    >
      <div className="filter-menu-heading">
        <div>
          <strong id="filter-menu-states-title">
            {messages.filters.federalState}
          </strong>
          <span>{messages.filters.stateEditorHelp}</span>
        </div>
        <button
          className="filter-menu-close"
          type="button"
          aria-label={messages.filters.closeStateFilter}
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <ValueToggleGroup
        label={messages.filters.federalState}
        excludedValues={excludedStates}
        options={options}
        wide
        onChange={onChange}
      />

      <div className="filter-menu-actions">
        <span>
          {messages.filters.includedOfTotal(includedCount, options.length)}
        </span>
        <button
          type="button"
          disabled={excludedStates.length === 0}
          onClick={() => onChange([])}
        >
          {messages.common.includeAll}
        </button>
      </div>
    </section>
  )
}

function StateFilterControl({
  label,
  summary,
  excludedCount,
  disabled,
  isOpen,
  triggerRef,
  onOpenChange,
  children,
}: {
  label: string
  summary: string
  excludedCount: number
  disabled: boolean
  isOpen: boolean
  triggerRef: RefObject<HTMLButtonElement | null>
  onOpenChange: (isOpen: boolean) => void
  children: ReactNode
}) {
  const { messages } = useI18n()

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
        ref={triggerRef}
        disabled={disabled}
        aria-expanded={disabled ? false : isOpen}
        aria-controls="filter-menu-states"
        onClick={() => onOpenChange(!isOpen)}
      >
        <span className="filter-control-copy">
          <strong>{label}</strong>
          <small>{summary}</small>
        </span>
        <span className="filter-control-status">
          {disabled
            ? messages.common.unavailable
            : excludedCount === 0
              ? messages.filters.allIncluded
              : messages.filters.excludedCount(excludedCount)}
          <span className="filter-control-chevron" aria-hidden="true">
            ⌄
          </span>
        </span>
      </button>
      {isOpen && !disabled ? children : null}
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
  const { messages } = useI18n()
  const className = wide
    ? 'inline-filter-card inline-filter-card-wide'
    : 'inline-filter-card'

  return (
    <section
      className={className}
      aria-label={messages.filters.filterAriaLabel(label)}
    >
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
          {messages.common.includeAll}
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
  scenario,
  onChange,
  onOpenFilterChange,
  onReset,
}: FilterPanelProps) {
  const i18n = useI18n()
  const { messages } = i18n
  const stateTriggerRef = useRef<HTMLButtonElement>(null)
  const statesOpen = openFilter === 'states'
  const stateControlsAvailable = states.length > 0
  const exclusionCount =
    filters.states.length +
    filters.ageGroups.length +
    filters.genders.length +
    filters.electionMethods.length
  const includedShare =
    scenario?.status === 'ready' || scenario?.status === 'empty'
      ? i18n.formatPercent(scenario.includedShare)
      : '—'
  const genderOptions = genderValues.map((value) => ({
    value,
    label: value === 'm' ? messages.filters.men : messages.filters.women,
  }))
  const electionMethodOptions = electionMethodValues.map((value) => ({
    value,
    label:
      value === 'postal'
        ? messages.filters.postalVoting
        : messages.filters.inPersonVoting,
  }))

  const closeStateEditor = useCallback(() => {
    onOpenFilterChange(null)
    requestAnimationFrame(() => stateTriggerRef.current?.focus())
  }, [onOpenFilterChange])

  return (
    <section
      className="workspace-panel filter-panel"
      aria-labelledby="filters-title"
    >
      <div className="panel-heading filter-panel-heading">
        <div>
          <p className="panel-kicker">{messages.filters.kicker}</p>
          <h2 id="filters-title">{messages.filters.title}</h2>
        </div>
        <span className="panel-badge">
          {messages.filters.excludedBadge(exclusionCount)}
        </span>
      </div>

      <section
        className="filter-scenario-card"
        aria-label={messages.filters.activeScenario}
      >
        <div className="filter-scenario-heading">
          <div>
            <span>{messages.filters.activeScenario}</span>
            <strong>{summarizeFilterState(filters, i18n)}</strong>
            <small>{messages.filters.votesIncluded(includedShare)}</small>
          </div>
          <button
            className="secondary-action"
            type="button"
            disabled={exclusionCount === 0}
            onClick={onReset}
          >
            {messages.common.reset}
          </button>
        </div>

        <p className="filter-scenario-empty" aria-live="polite">
          {messages.filters.activeExclusions(exclusionCount)}
        </p>
      </section>

      <div className="filter-list">
        <StateFilterControl
          label={messages.filters.federalState}
          summary={
            stateControlsAvailable
              ? describeStateSelection(filters.states, i18n)
              : messages.filters.stateDataUnavailable
          }
          excludedCount={filters.states.length}
          disabled={!stateControlsAvailable}
          isOpen={statesOpen}
          triggerRef={stateTriggerRef}
          onOpenChange={(isOpen) => onOpenFilterChange(isOpen ? 'states' : null)}
        >
          <StateSelectionEditor
            excludedStates={filters.states}
            options={states.map((state) => ({
              value: state,
              label: i18n.stateName(state),
            }))}
            onChange={(excludedStates) =>
              onChange({ ...filters, states: excludedStates })
            }
            onClose={closeStateEditor}
          />
        </StateFilterControl>

        <InlineSelectionEditor
          label={messages.filters.ageGroup}
          summary={describeAgeGroupSelection(filters.ageGroups, i18n)}
          excludedValues={filters.ageGroups}
          options={ageGroupOptions}
          wide
          onChange={(excludedAgeGroups) =>
            onChange({ ...filters, ageGroups: excludedAgeGroups })
          }
        />

        <InlineSelectionEditor
          label={messages.filters.gender}
          summary={describeGenderSelection(filters.genders, i18n)}
          excludedValues={filters.genders}
          options={genderOptions}
          onChange={(excludedGenders) =>
            onChange({ ...filters, genders: excludedGenders })
          }
        />

        <InlineSelectionEditor
          label={messages.filters.votingMethod}
          summary={describeElectionMethodSelection(
            filters.electionMethods,
            i18n,
          )}
          excludedValues={filters.electionMethods}
          options={electionMethodOptions}
          onChange={(excludedMethods) =>
            onChange({ ...filters, electionMethods: excludedMethods })
          }
        />
      </div>
    </section>
  )
}
