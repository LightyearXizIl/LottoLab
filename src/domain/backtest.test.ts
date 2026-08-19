import { describe, expect, it } from 'vitest'
import { demoDraws } from '../data/demoDraws'
import { emptyFilters } from './rules'
import { strategyPresets } from './strategies'
import { calculateBacktest } from './backtest'

describe('backtest engine', () => {
  it('reports deterministic progress and excludes the target draw', () => {
    const progress: number[] = []
    const result = calculateBacktest({
      game: 'dlt',
      draws: demoDraws('dlt'),
      strategy: structuredClone(strategyPresets.find(item => item.id === 'random')!),
      filters: emptyFilters(),
      period: 2,
    }, value => progress.push(value.completed))

    expect(result.tested).toBe(2)
    expect(result.points.map(point => point.issue)).toEqual(['26093', '26092'])
    expect(progress).toEqual([1, 2])
  })
})
