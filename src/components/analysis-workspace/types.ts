import type { ElectionData } from '../../data/loaders.ts'
import type { CoalitionResult } from '../../lib/coalitions/index.ts'
import type {
  ElectionResult,
  SeatResult,
} from '../../models/calculation-results.ts'

export type DataState =
  | { status: 'loading' }
  | { status: 'ready'; data: ElectionData }
  | { status: 'error'; message: string }

export type ScenarioStatus = 'ready' | 'empty' | 'invalid'

export interface ScenarioResult {
  status: ScenarioStatus
  message?: string
  electionResults: readonly ElectionResult[]
  seatResults: readonly SeatResult[]
  coalitions: readonly CoalitionResult[]
  includedVotes: number
  totalVotes: number
  includedShare: number
  totalSeats: number
  majorityThreshold: number
}
