import type { BacktestInput, BacktestProgress } from '../domain/backtest'
import type { BacktestResult, DrawRecord, FilterConfig, GameKind, RecommendationRun, StrategyConfig } from '../domain/types'

export interface GenerateResearchInput {
  game: GameKind
  draws: DrawRecord[]
  strategy: StrategyConfig
  filters: FilterConfig
  seed: string
}

export type ResearchWorkerRequest =
  | { requestId: string, task: 'generate', payload: GenerateResearchInput }
  | { requestId: string, task: 'backtest', payload: BacktestInput }

export type ResearchWorkerResponse =
  | { requestId: string, type: 'progress', task: 'backtest', progress: BacktestProgress }
  | { requestId: string, type: 'success', task: 'generate', result: RecommendationRun }
  | { requestId: string, type: 'success', task: 'backtest', result: BacktestResult }
  | { requestId: string, type: 'error', task: ResearchWorkerRequest['task'], message: string }
