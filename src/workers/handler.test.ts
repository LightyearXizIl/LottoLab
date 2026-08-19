import { describe, expect, it } from 'vitest'
import { demoDraws } from '../data/demoDraws'
import { emptyFilters, generateRecommendations } from '../domain/rules'
import { defaultStrategy } from '../domain/strategies'
import type { ResearchWorkerResponse } from './protocol'
import { handleResearchRequest } from './handler'

describe('research worker handler', () => {
  it('preserves the fixed-seed algorithm result', () => {
    const payload = { game: 'ssq' as const, draws: demoDraws('ssq'), strategy: defaultStrategy(), filters: emptyFilters(), seed: 'worker-fixed-seed' }
    const expected = generateRecommendations(payload.game, payload.draws, payload.strategy, payload.filters, payload.seed)
    const responses: ResearchWorkerResponse[] = []
    handleResearchRequest({ requestId: 'worker-1', task: 'generate', payload }, response => responses.push(response))

    const success = responses.find(response => response.type === 'success' && response.task === 'generate')
    expect(success?.type).toBe('success')
    if (success?.type === 'success' && success.task === 'generate') {
      expect(success.result.recommendations).toEqual(expected.recommendations)
      expect(success.result.seed).toBe('worker-fixed-seed')
    }
  })
})
