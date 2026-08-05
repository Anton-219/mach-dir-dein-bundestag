import {
  getElectoralSystemCatalog,
  getElectoralSystemModelCopy,
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
  const activeModel = getElectoralSystemModelCopy(
    selectedSystemId,
    i18n.locale,
  )

  return (
    <fieldset className="electoral-system-selector">
      <legend>{copy.selector.legend}</legend>
      <div
        className="electoral-system-options"
        role="group"
        aria-label={copy.selector.optionsLabel}
      >
        {options.map((option) => (
          <button
            className="electoral-system-option"
            type="button"
            key={option.systemId}
            aria-pressed={option.systemId === selectedSystemId}
            aria-label={copy.selector.optionAriaLabel(option.name)}
            title={option.description}
            onClick={() => onChange(option.systemId)}
          >
            {option.shortName}
          </button>
        ))}
      </div>
      <p className="electoral-system-active-model">
        <strong>{copy.selector.activeLabel}</strong>
        <span>{activeModel.name}</span>
      </p>
      <p className="electoral-system-description">{activeModel.description}</p>
      <p className="electoral-system-help">{copy.selector.help}</p>
    </fieldset>
  )
}
