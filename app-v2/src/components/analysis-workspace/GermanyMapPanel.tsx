import { useState, type KeyboardEvent, type MouseEvent } from 'react'

import { describeStateSelection } from '../../lib/filters/index.ts'
import {
  buildGermanyStatePaths,
  type GermanyStateFeature,
} from '../../lib/map/germany-map.ts'

interface GermanyMapPanelProps {
  features: readonly GermanyStateFeature[]
  excludedStates: readonly string[]
  onToggleState: (state: string) => void
}

export function GermanyMapPanel({
  features,
  excludedStates,
  onToggleState,
}: GermanyMapPanelProps) {
  const [highlightedState, setHighlightedState] = useState<string | null>(null)
  const statePaths = buildGermanyStatePaths(features)
  const stateControlsAvailable = statePaths.length > 0
  const includedStateCount = Math.max(statePaths.length - excludedStates.length, 0)

  const activateState = (
    event: MouseEvent<HTMLAnchorElement> | KeyboardEvent<HTMLAnchorElement>,
    state: string,
  ) => {
    event.preventDefault()
    onToggleState(state)
  }

  return (
    <section className="workspace-panel map-panel" aria-labelledby="map-title">
      <div className="panel-heading map-panel-heading">
        <div>
          <p className="panel-kicker">Regional selection</p>
          <h2 id="map-title">Germany map</h2>
        </div>
        <span className="panel-badge">
          {stateControlsAvailable ? `${includedStateCount} included` : 'Unavailable'}
        </span>
      </div>

      {stateControlsAvailable ? (
        <div className="map-content">
          <div className="germany-map-shell">
            <svg
              className="germany-map"
              viewBox="0 0 220 260"
              aria-labelledby="germany-map-title germany-map-description"
            >
              <title id="germany-map-title">Interactive map of German federal states</title>
              <desc id="germany-map-description">
                Select a federal state to include or exclude it from the active election
                scenario. Included states are solid; excluded states use a hatched pattern.
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

              {statePaths.map((state) => {
                const included = !excludedStates.includes(state.name)
                const action = included ? 'exclude' : 'include'

                return (
                  <a
                    className={
                      included
                        ? 'map-state map-state-included'
                        : 'map-state map-state-excluded'
                    }
                    href="#filter-menu-states"
                    aria-label={`${state.name}: ${included ? 'included' : 'excluded'}. Activate to ${action}.`}
                    key={state.id}
                    onBlur={() => setHighlightedState(null)}
                    onClick={(event) => activateState(event, state.name)}
                    onFocus={() => setHighlightedState(state.name)}
                    onKeyDown={(event) => {
                      if (event.key === ' ') {
                        activateState(event, state.name)
                      }
                    }}
                    onMouseEnter={() => setHighlightedState(state.name)}
                    onMouseLeave={() => setHighlightedState(null)}
                  >
                    <path
                      className="map-state-hit-area"
                      d={state.path}
                      fillRule="evenodd"
                      aria-hidden="true"
                    />
                    <path className="map-state-shape" d={state.path} fillRule="evenodd">
                      <title>
                        {state.name}: {included ? 'included' : 'excluded'}
                      </title>
                    </path>
                  </a>
                )
              })}
            </svg>

            <div className="map-legend" aria-hidden="true">
              <span>
                <i className="map-legend-included" />Included
              </span>
              <span>
                <i className="map-legend-excluded" />Excluded
              </span>
            </div>
          </div>

          <p className="map-status" aria-live="polite">
            <strong>{highlightedState ?? describeStateSelection(excludedStates)}</strong>
            <span>
              {highlightedState
                ? excludedStates.includes(highlightedState)
                  ? 'Excluded · activate to include'
                  : 'Included · activate to exclude'
                : 'Select a state directly on the map.'}
            </span>
          </p>
        </div>
      ) : (
        <p className="result-empty">The federal-state map is not available yet.</p>
      )}
    </section>
  )
}
