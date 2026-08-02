import type { SeatResult } from '../../models/calculation-results.ts'

export interface CoalitionResult {
  members: readonly SeatResult[]
  seats: number
  threshold: number
  surplus: number
}
