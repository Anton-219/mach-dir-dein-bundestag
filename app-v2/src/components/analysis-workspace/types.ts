import type { ElectionData } from '../../data/loaders.ts'

export type DataState =
  | { status: 'loading' }
  | { status: 'ready'; data: ElectionData }
  | { status: 'error'; message: string }
