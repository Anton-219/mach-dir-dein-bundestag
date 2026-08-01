export interface KeyValueStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export function readStorageValue(
  getStorage: () => KeyValueStorage,
  key: string,
): string | null {
  try {
    return getStorage().getItem(key)
  } catch {
    return null
  }
}

export function writeStorageValue(
  getStorage: () => KeyValueStorage,
  key: string,
  value: string,
): void {
  try {
    getStorage().setItem(key, value)
  } catch {
    return
  }
}
