import {
  getElectoralSystemCatalog,
  getElectoralSystemOptions,
  useI18n,
} from '../../i18n/index.ts'
import type { ElectoralSystemId } from '../../lib/election/index.ts'

interface ElectoralSystemSelectorProps {
  selectedSystemId: ElectoralSystemId
  onChange: (systemId: ElectoralSystemId) => void
}

export function ElectoralSystemSelector({
  selectedSystemId,
  onChange,
}: ElectoralSystemSelectorProps) {
  const i18n = useI18n()
  const copy = getElectoralSystemCatalog(i18n.locale)
  const options = getElectoralSystemOptions(i18n.locale)

  return (
    <fieldset
      className="scenario-link-options scenario-link-options-models"
      aria-label={copy.selector.optionsLabel}
    >
      {options.map((option, index) => (
        <span className="scenario-link-option-wrap" key={option.systemId}>
          {index > 0 ? (
            <span className="scenario-link-separator" aria-hidden="true">
              |
            </span>
          ) : null}
          <button
            className={`scenario-link-option${option.systemId === selectedSystemId ? ' scenario-link-option-active' : ''}`}
            type="button"
            aria-pressed={option.systemId === selectedSystemId}
            title={option.description}
            onClick={() => onChange(option.systemId)}
          >
            {option.shortName}
          </button>
        </span>
      ))}
    </fieldset>
  )
}
