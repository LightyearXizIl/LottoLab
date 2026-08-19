import { generateRecommendations, gameRules } from './rules'
import type { BacktestPoint, BacktestResult, DrawRecord, FilterConfig, GameKind, StrategyConfig } from './types'

export interface BacktestProgress {
  completed: number
  total: number
  issue?: string
}

export interface BacktestInput {
  game: GameKind
  draws: DrawRecord[]
  strategy: StrategyConfig
  filters: FilterConfig
  period: number
}

export function calculateBacktest(input: BacktestInput, onProgress?: (progress: BacktestProgress) => void): BacktestResult {
  const { game, draws, strategy, filters, period } = input
  const rule = gameRules[game]
  const sample = draws.slice(0, Math.min(period, Math.max(0, draws.length - 30)))
  const metrics: BacktestPoint[] = []

  sample.forEach((target, index) => {
    const history = draws.slice(index + 1)
    if (history.length >= 30) {
      const generated = generateRecommendations(game, history, strategy, filters, `backtest-${target.issue}`)
      const best = generated.recommendations.reduce((max, item) => {
        const primary = item.primaryNumbers.filter(number => target.primaryNumbers.includes(number)).length
        const secondary = item.secondaryNumbers.filter(number => target.secondaryNumbers.includes(number)).length
        return primary + secondary > max.primary + max.secondary ? { primary, secondary } : max
      }, { primary: 0, secondary: 0 })
      metrics.push({
        issue: target.issue,
        primaryHits: best.primary,
        secondaryHits: best.secondary,
        randomPrimaryMedian: Math.max(0, Math.round(rule.primaryCount * rule.primaryCount / rule.primaryMax)),
        randomSecondaryMedian: Math.max(0, Math.round(rule.secondaryCount * rule.secondaryCount / rule.secondaryMax)),
      })
    }
    onProgress?.({ completed: index + 1, total: sample.length, issue: target.issue })
  })

  return {
    game,
    period,
    tested: metrics.length,
    averagePrimaryHits: metrics.reduce((sum, point) => sum + point.primaryHits, 0) / Math.max(1, metrics.length),
    averageSecondaryHits: metrics.reduce((sum, point) => sum + point.secondaryHits, 0) / Math.max(1, metrics.length),
    randomPrimaryHits: metrics.reduce((sum, point) => sum + point.randomPrimaryMedian, 0) / Math.max(1, metrics.length),
    randomSecondaryHits: metrics.reduce((sum, point) => sum + point.randomSecondaryMedian, 0) / Math.max(1, metrics.length),
    points: metrics,
  }
}
