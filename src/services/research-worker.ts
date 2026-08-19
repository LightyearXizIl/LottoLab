import type { BacktestInput, BacktestProgress } from '../domain/backtest'
import type { BacktestResult, RecommendationRun } from '../domain/types'
import type { GenerateResearchInput, ResearchWorkerRequest, ResearchWorkerResponse } from '../workers/protocol'

export class ResearchTaskCancelledError extends Error {
  constructor() {
    super('研究任务已取消')
    this.name = 'ResearchTaskCancelledError'
  }
}

export interface ResearchTask<T> {
  requestId: string
  promise: Promise<T>
  cancel: () => void
}

type WorkerFactory = () => Worker

const defaultWorkerFactory: WorkerFactory = () => new Worker(new URL('../workers/research.worker.ts', import.meta.url), { type: 'module' })

function startTask<T>(
  request: ResearchWorkerRequest,
  expectedTask: ResearchWorkerRequest['task'],
  onProgress: ((progress: BacktestProgress) => void) | undefined,
  workerFactory: WorkerFactory,
): ResearchTask<T> {
  const worker = workerFactory()
  let settled = false
  let rejectTask: (reason?: unknown) => void = () => undefined

  const promise = new Promise<T>((resolve, reject) => {
    rejectTask = reject
    worker.onmessage = (event: MessageEvent<ResearchWorkerResponse>) => {
      const response = event.data
      if (settled || response.requestId !== request.requestId) return
      if (response.type === 'progress') {
        onProgress?.(response.progress)
        return
      }
      settled = true
      worker.terminate()
      if (response.type === 'error') {
        reject(new Error(response.message))
      } else if (response.task !== expectedTask) {
        reject(new Error('研究任务返回了不匹配的结果类型'))
      } else {
        resolve(response.result as T)
      }
    }
    worker.onerror = event => {
      if (settled) return
      settled = true
      worker.terminate()
      reject(new Error(event.message || '研究任务执行失败'))
    }
    worker.postMessage(request)
  })

  return {
    requestId: request.requestId,
    promise,
    cancel: () => {
      if (settled) return
      settled = true
      worker.terminate()
      rejectTask(new ResearchTaskCancelledError())
    },
  }
}

export function startGenerateTask(input: GenerateResearchInput, workerFactory = defaultWorkerFactory): ResearchTask<RecommendationRun> {
  const requestId = crypto.randomUUID()
  return startTask<RecommendationRun>({ requestId, task: 'generate', payload: input }, 'generate', undefined, workerFactory)
}

export function startBacktestTask(input: BacktestInput, onProgress?: (progress: BacktestProgress) => void, workerFactory = defaultWorkerFactory): ResearchTask<BacktestResult> {
  const requestId = crypto.randomUUID()
  return startTask<BacktestResult>({ requestId, task: 'backtest', payload: input }, 'backtest', onProgress, workerFactory)
}
