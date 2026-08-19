/// <reference lib="webworker" />

import { handleResearchRequest } from './handler'
import type { ResearchWorkerRequest, ResearchWorkerResponse } from './protocol'

const workerScope = self as DedicatedWorkerGlobalScope

workerScope.onmessage = (event: MessageEvent<ResearchWorkerRequest>) => {
  handleResearchRequest(event.data, response => workerScope.postMessage(response satisfies ResearchWorkerResponse))
}
