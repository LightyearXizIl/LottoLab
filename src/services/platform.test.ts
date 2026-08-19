import { describe, expect, it } from 'vitest'
import { demoDraws } from '../data/demoDraws'
import { emptyFilters, generateRecommendations } from '../domain/rules'
import { strategyPresets } from '../domain/strategies'
import { formatRecommendationCsv, formatRecommendationText } from './platform'

describe('platform-neutral recommendation formatting', () => {
  const run = generateRecommendations('dlt', demoDraws('dlt'), structuredClone(strategyPresets.find(item => item.id === 'random')!), emptyFilters(), 'format-seed')

  it('creates five copyable lines', () => {
    expect(formatRecommendationText(run).split('\n')).toHaveLength(5)
  })

  it('creates a stable CSV body', () => {
    const rows = formatRecommendationCsv(run).split('\n')
    expect(rows[0]).toBe('group,primary_numbers,secondary_numbers,score')
    expect(rows).toHaveLength(6)
  })
})
