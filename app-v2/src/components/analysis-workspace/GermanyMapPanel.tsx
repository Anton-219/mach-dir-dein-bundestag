import { describeStateSelection } from '../../lib/filters/index.ts'

interface GermanyMapPanelProps {
  excludedStates: readonly string[]
  totalStateCount: number
  onEditStates: () => void
}

export function GermanyMapPanel({
  excludedStates,
  totalStateCount,
  onEditStates,
}: GermanyMapPanelProps) {
  const includedStateCount = Math.max(totalStateCount - excludedStates.length, 0)

  return (
    <section className="workspace-panel map-panel" aria-labelledby="map-title">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Regional selection</p>
          <h2 id="map-title">Germany map</h2>
        </div>
        <span className="panel-badge" aria-live="polite">
          {includedStateCount} included
        </span>
      </div>

      <div className="map-content">
        <svg
          className={
            excludedStates.length === 0
              ? 'germany-map-placeholder'
              : 'germany-map-placeholder germany-map-filtered'
          }
          viewBox="0 0 220 260"
          aria-hidden="true"
          focusable="false"
        >
          <path
            className="germany-outline"
            d="M91 9 119 18 132 38 151 43 148 65 169 81 157 102 174 117 163 139 174 158 157 177 159 202 137 213 128 244 105 251 91 230 70 229 62 207 42 196 46 173 31 157 42 136 29 119 44 101 40 80 60 67 61 42 82 34Z"
          />
          <path className="germany-boundary" d="M62 67 104 75 148 65" />
          <path className="germany-boundary" d="M44 101 93 104 157 102" />
          <path className="germany-boundary" d="M42 136 91 132 163 139" />
          <path className="germany-boundary" d="M46 173 105 166 174 158" />
          <path className="germany-boundary" d="M62 207 101 195 157 177" />
          <path className="germany-boundary" d="M91 9 93 104 91 230" />
          <path className="germany-boundary" d="M132 38 118 131 128 244" />
        </svg>

        <div className="map-copy">
          <strong>{describeStateSelection(excludedStates)}</strong>
          <p>
            The map reflects the regional scenario. The labelled state editor is the
            complete keyboard-accessible control.
          </p>
          <button type="button" onClick={onEditStates}>
            Edit state filter
          </button>
        </div>
      </div>
    </section>
  )
}
