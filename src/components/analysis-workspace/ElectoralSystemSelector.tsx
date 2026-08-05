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
  const activeOption = options.find(
    (option) => option.systemId === selectedSystemId,
  )

  return (
    <select
      className="electoral-system-select"
      value={selectedSystemId}
      aria-label={copy.selector.activeLabel}
      title={activeOption?.description}
      onChange={(event) =>
        onChange(event.currentTarget.value as ElectoralSystemId)
      }
    >
      {options.map((option) => (
        <option value={option.systemId} key={option.systemId}>
          {option.shortName}
        </option>
      ))}
    </select>
  )
}
