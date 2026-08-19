import { describe, expect, it } from 'vitest'
import { demoDraws } from '../data/demoDraws'
import { emptyFilters, generateRecommendations } from '../domain/rules'
import { strategyPresets } from '../domain/strategies'
import { compareVersions, formatRecommendationCsv, formatRecommendationText } from './platform'

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

  it('compares stable and prerelease semantic versions', () => {
    expect(compareVersions('0.0.2', '0.0.1')).toBe(1)
    expect(compareVersions('0.0.2-beta.1', '0.0.2')).toBe(-1)
    expect(compareVersions('v1.2.3', '1.2.3')).toBe(0)
    expect(() => compareVersions('not-a-version', '0.0.2')).toThrow('语义化版本')
  })
})
