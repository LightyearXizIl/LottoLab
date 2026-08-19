import { describe, expect, it } from 'vitest'
import { demoDraws } from '../data/demoDraws'
import { emptyFilters } from '../domain/rules'
import { defaultStrategy } from '../domain/strategies'
import { ResearchTaskCancelledError, startGenerateTask } from './research-worker'

describe('research worker task lifecycle', () => {
  it('terminates and rejects a cancelled task', async () => {
    let terminated = false
    const fakeWorker = {
      onmessage: null,
      onerror: null,
      postMessage: () => undefined,
      terminate: () => { terminated = true },
    } as unknown as Worker
    const task = startGenerateTask({ game: 'dlt', draws: demoDraws('dlt'), strategy: defaultStrategy(), filters: emptyFilters(), seed: 'cancel-me' }, () => fakeWorker)

    task.cancel()

    await expect(task.promise).rejects.toBeInstanceOf(ResearchTaskCancelledError)
    expect(terminated).toBe(true)
  })
})
