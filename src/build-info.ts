function parseLastUpdatedAt(value: string): Date {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export const lastUpdatedAt = parseLastUpdatedAt(__LAST_UPDATED_AT__)
