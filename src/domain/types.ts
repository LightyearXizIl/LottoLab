export type GameKind = 'ssq' | 'dlt'

export interface DrawRecord {
  id?: number
  game: GameKind
  issue: string
  drawDate: string
  primaryNumbers: number[]
  secondaryNumbers: number[]
  salesYuan?: number | null
  poolYuan?: number | null
  source: string
  fetchedAt: string
}

export interface StrategyWeights {
  frequency: number
  omission: number
  momentum: number
  cooccurrence: number
  structure: number
}

export type StrategyId = 'balanced' | 'hot' | 'omission' | 'structure' | 'random' | 'custom'

export interface StrategyConfig {
  id: StrategyId
  name: string
  weights: StrategyWeights
}

export interface FilterConfig {
  includePrimary: number[]
  excludePrimary: number[]
  includeSecondary: number[]
  excludeSecondary: number[]
  sumMin?: number
  sumMax?: number
  oddPrimaryMin?: number
  oddPrimaryMax?: number
  maxConsecutivePairs?: number
  maxLastDrawRepeats?: number
  maxPrimaryOverlap?: number
  maxSecondaryOverlap?: number
}

export interface ScoreContribution {
  label: string
  score: number
  weight: number
}

export interface Recommendation {
  primaryNumbers: number[]
  secondaryNumbers: number[]
  score: number | null
  contributions: ScoreContribution[]
}

export interface RecommendationRun {
  id: string
  game: GameKind
  cutoffIssue: string
  dataCount: number
  createdAt: string
  seed: string
  algorithmVersion: string
  strategy: StrategyConfig
  filters: FilterConfig
  recommendations: Recommendation[]
}

export interface SyncReport {
  game: GameKind
  inserted: number
  updated: number
  total: number
  source: string
  syncedAt: string
  status: 'success' | 'cache' | 'error'
  message?: string
}

export interface BacktestPoint {
  issue: string
  primaryHits: number
  secondaryHits: number
  randomPrimaryMedian: number
  randomSecondaryMedian: number
}

export interface BacktestResult {
  game: GameKind
  period: number
  tested: number
  averagePrimaryHits: number
  averageSecondaryHits: number
  randomPrimaryHits: number
  randomSecondaryHits: number
  points: BacktestPoint[]
}
