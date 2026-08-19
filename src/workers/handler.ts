import { calculateBacktest } from '../domain/backtest'
import { generateRecommendations } from '../domain/rules'
import type { ResearchWorkerRequest, ResearchWorkerResponse } from './protocol'

export function handleResearchRequest(request: ResearchWorkerRequest, emit: (response: ResearchWorkerResponse) => void): void {
  try {
    if (request.task === 'generate') {
      const { game, draws, strategy, filters, seed } = request.payload
      emit({ requestId: request.requestId, type: 'success', task: 'generate', result: generateRecommendations(game, draws, strategy, filters, seed) })
      return
    }

    const result = calculateBacktest(request.payload, progress => {
      emit({ requestId: request.requestId, type: 'progress', task: 'backtest', progress })
    })
    emit({ requestId: request.requestId, type: 'success', task: 'backtest', result })
  } catch (reason) {
    emit({
      requestId: request.requestId,
      type: 'error',
      task: request.task,
      message: reason instanceof Error ? reason.message : String(reason),
    })
  }
}
