import { describe, expect, it } from 'vitest'
import { demoDraws } from '../data/demoDraws'
import { defaultStrategy } from './strategies'
import { emptyFilters, generateRecommendations, gameRules } from './rules'

describe('historical recommendation engine', () => {
  it.each(['ssq', 'dlt'] as const)('always returns five valid distinct %s sets', game => {
    const run = generateRecommendations(game, demoDraws(game), defaultStrategy(), emptyFilters(), `property-${game}`)
    const rule = gameRules[game]
    expect(run.recommendations).toHaveLength(5)
    expect(new Set(run.recommendations.map(item => `${item.primaryNumbers.join(',')}|${item.secondaryNumbers.join(',')}`)).size).toBe(5)
    for (const item of run.recommendations) {
      expect(item.primaryNumbers).toHaveLength(rule.primaryCount)
      expect(item.secondaryNumbers).toHaveLength(rule.secondaryCount)
      expect(new Set(item.primaryNumbers).size).toBe(rule.primaryCount)
      expect(item.primaryNumbers.every(number => number >= 1 && number <= rule.primaryMax)).toBe(true)
      expect(item.secondaryNumbers.every(number => number >= 1 && number <= rule.secondaryMax)).toBe(true)
    }
  })

  it('is reproducible for the same inputs and seed', () => {
    const inputs = [demoDraws('ssq'), defaultStrategy(), emptyFilters(), 'fixed-seed'] as const
    const one = generateRecommendations('ssq', ...inputs)
    const two = generateRecommendations('ssq', ...inputs)
    expect(two.recommendations).toEqual(one.recommendations)
  })

  it('rejects contradictory filters', () => {
    const filters = emptyFilters(); filters.includePrimary = [1]; filters.excludePrimary = [1]
    expect(() => generateRecommendations('ssq', demoDraws('ssq'), defaultStrategy(), filters, 'invalid')).toThrow('不能同时')
  })
})
