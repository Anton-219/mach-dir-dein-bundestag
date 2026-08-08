import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import { describeStateSelection, useI18n } from '../../i18n/index.ts'
import { getMapInteractionMessages } from '../../i18n/map-interaction-messages.ts'
import {
  buildGermanyBoundaryPath,
  buildGermanyStatePaths,
  orderGermanyStatePathsForInteraction,
  type GermanyStateFeature,
} from '../../lib/map/germany-map.ts'

interface GermanyMapPanelProps {
  features: readonly GermanyStateFeature[]
  excludedStates: readonly string[]
  onToggleState: (state: string) => void
  onInvertStates: () => void
  onHighlightedStateChange: (state: string | null) => void
}

export function GermanyMapPanel({
  features,
  excludedStates,
  onToggleState,
  onInvertStates,
  onHighlightedStateChange,
}: GermanyMapPanelProps) {
  const i18n = useI18n()
  const { messages } = i18n
  const mapInteractionMessages = getMapInteractionMessages(i18n.locale)
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [focusedState, setFocusedState] = useState<string | null>(null)
  const highlightedState = hoveredState ?? focusedState
  const statePaths = useMemo(() => buildGermanyStatePaths(features), [features])
  const stateInteractionPaths = useMemo(
    () => orderGermanyStatePathsForInteraction(statePaths),
    [statePaths],
  )
  const boundaryPath = useMemo(
    () => buildGermanyBoundaryPath(statePaths),
    [statePaths],
  )
  const highlightedStatePath = statePaths.find(
    (state) => state.name === highlightedState,
  )
  const stateControlsAvailable = statePaths.length > 0
  const includedStateCount = Math.max(statePaths.length - excludedStates.length, 0)

  useEffect(() => {
    onHighlightedStateChange(highlightedState)
  }, [highlightedState, onHighlightedStateChange])

  const activateState = (
    event: MouseEvent<HTMLAnchorElement> | KeyboardEvent<HTMLAnchorElement>,
    state: string,
  ) => {
    event.preventDefault()
    onToggleState(state)
  }

  const resetStates = () => {
    excludedStates.forEach((state) => onToggleState(state))
  }

  return (
    <section className="workspace-panel map-panel" aria-labelledby="map-title">
      <div className="panel-heading map-panel-heading">
        <div>
          <p className="panel-kicker">{messages.map.kicker}</p>
          <h2 id="map-title">{messages.map.title}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <button
            className="panel-badge"
            type="button"
            disabled={!stateControlsAvailable}
            aria-label={mapInteractionMessages.invertSelection}
            title={mapInteractionMessages.invertSelection}
            style={{ cursor: stateControlsAvailable ? 'pointer' : 'not-allowed' }}
            onClick={onInvertStates}
          >
            {stateControlsAvailable
              ? messages.map.includedBadge(includedStateCount)
              : messages.common.unavailable}
          </button>
          <button
            className="secondary-action"
            type="button"
            disabled={!stateControlsAvailable || excludedStates.length === 0}
            aria-label={messages.map.resetAriaLabel}
            style={{
              minHeight: '1.45rem',
              padding: '0.12rem 0.3rem',
              borderColor: 'transparent',
              background: 'transparent',
              color: 'var(--muted)',
              fontSize: '0.56rem',
              fontWeight: 700,
            }}
            onClick={resetStates}
          >
            {messages.common.reset}
          </button>
        </div>
      </div>

      {stateControlsAvailable ? (
        <div className="map-content">
          <div className="germany-map-shell">
            <svg
              className="germany-map"
              viewBox="0 0 220 260"
              aria-labelledby="germany-map-title germany-map-description"
            >
              <title id="germany-map-title">{messages.map.svgTitle}</title>
              <desc id="germany-map-description">
                {messages.map.svgDescription}
              </desc>
              <defs>
                <pattern
                  id="excluded-state-pattern"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="8" height="8" className="map-pattern-background" />
                  <line x1="0" y1="0" x2="0" y2="8" className="map-pattern-line" />
                </pattern>
              </defs>

              <g className="map-state-fills" aria-hidden="true">
                {statePaths.map((state) => {
                  const included = !excludedStates.includes(state.name)
                  const highlighted = highlightedState === state.name

                  return (
                    <path
                      className={[
                        'map-state-fill',
                        included
                          ? 'map-state-fill-included'
                          : 'map-state-fill-excluded',
                        highlighted ? 'map-state-fill-highlighted' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      d={state.path}
                      fillRule="evenodd"
                      key={state.id}
                    />
                  )
                })}
              </g>

              <path
                className="map-boundaries"
                d={boundaryPath}
                fillRule="evenodd"
                aria-hidden="true"
              />

              {highlightedStatePath ? (
                <path
                  className="map-state-highlight"
                  d={highlightedStatePath.path}
                  fillRule="evenodd"
                  aria-hidden="true"
                />
              ) : null}

              <g className="map-state-controls">
                {stateInteractionPaths.map((state) => {
                  const included = !excludedStates.includes(state.name)
                  const stateLabel = i18n.stateName(state.name)
                  const currentState = included
                    ? messages.common.included
                    : messages.common.excluded
                  const action = included
                    ? messages.map.actionExclude
                    : messages.map.actionInclude

                  return (
                    <a
                      className={
                        state.isCompact
                          ? 'map-state-control map-state-control-compact'
                          : 'map-state-control'
                      }
                      href="#filter-menu-states"
                      aria-label={messages.map.stateControlAriaLabel(
                        stateLabel,
                        currentState,
                        action,
                      )}
                      key={state.id}
                      onBlur={() => setFocusedState(null)}
                      onClick={(event) => activateState(event, state.name)}
                      onFocus={() => setFocusedState(state.name)}
                      onKeyDown={(event) => {
                        if (event.key === ' ') {
                          activateState(event, state.name)
                        }
                      }}
                      onMouseEnter={() => setHoveredState(state.name)}
                      onMouseLeave={() => setHoveredState(null)}
                    >
                      <title>
                        {stateLabel}: {currentState}
                      </title>
                      <path
                        className="map-state-hit-area"
                        d={state.path}
                        fillRule="evenodd"
                        aria-hidden="true"
                      />
                    </a>
                  )
                })}
              </g>
            </svg>

            <div className="map-legend" aria-hidden="true">
              <span>
                <i className="map-legend-included" />
                {messages.common.included}
              </span>
              <span>
                <i className="map-legend-excluded" />
                {messages.common.excluded}
              </span>
            </div>
          </div>

          <p className="map-status" aria-live="polite">
            <strong>
              {highlightedState
                ? i18n.stateName(highlightedState)
                : describeStateSelection(excludedStates, i18n)}
            </strong>
            <span>
              {highlightedState
                ? excludedStates.includes(highlightedState)
                  ? messages.map.excludedActivateInclude
                  : messages.map.includedActivateExclude
                : messages.map.prompt}
            </span>
          </p>
        </div>
      ) : (
        <p className="result-empty">{messages.map.unavailable}</p>
      )}
    </section>
  )
}
