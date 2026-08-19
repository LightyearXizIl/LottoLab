import { computed, readonly, shallowRef } from 'vue'
import { demoDraws } from '../data/demoDraws'
import { defaultStrategy } from '../domain/strategies'
import { emptyFilters, gameRules } from '../domain/rules'
import type { BacktestProgress } from '../domain/backtest'
import type { DrawRecord, FilterConfig, GameKind, RecommendationRun, StrategyConfig, SyncReport } from '../domain/types'
import { listDraws, saveRun, syncDraws } from '../services/lottolab'
import { ResearchTaskCancelledError, startBacktestTask, startGenerateTask, type ResearchTask } from '../services/research-worker'

const game = shallowRef<GameKind>('ssq')
const draws = shallowRef<DrawRecord[]>(demoDraws('ssq'))
const strategy = shallowRef<StrategyConfig>(defaultStrategy())
const filters = shallowRef<FilterConfig>(emptyFilters())
const run = shallowRef<RecommendationRun | null>(null)
const loading = shallowRef(false)
const generating = shallowRef(false)
const generationProgress = shallowRef(0)
const syncStatus = shallowRef<SyncReport | null>(null)
const error = shallowRef<string | null>(null)
let activeGeneration: ResearchTask<RecommendationRun> | null = null

export function useLottoLab() {
  const rule = computed(() => gameRules[game.value])
  const latestDraw = computed(() => draws.value[0])
  const scoreLabel = computed(() => strategy.value.id === 'random' ? '随机抽样' : '历史适配分')
  const usingDemoData = computed(() => latestDraw.value?.source === '内置演示快照')

  async function load(gameToLoad = game.value) {
    loading.value = true
    error.value = null
    try {
      const persisted = await listDraws(gameToLoad)
      draws.value = persisted && persisted.length ? persisted : demoDraws(gameToLoad)
    } catch (reason) {
      draws.value = demoDraws(gameToLoad)
      error.value = `本地数据读取失败，已使用演示快照：${String(reason)}`
    } finally { loading.value = false }
  }

  async function selectGame(next: GameKind) {
    activeGeneration?.cancel()
    activeGeneration = null
    generating.value = false
    game.value = next
    filters.value = emptyFilters()
    run.value = null
    await load(next)
  }

  function createSeed() { return `${game.value}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }

  async function generate(seed = createSeed()) {
    activeGeneration?.cancel()
    error.value = null
    generationProgress.value = 0
    generating.value = true
    const task = startGenerateTask({
      game: game.value,
      draws: structuredClone(draws.value),
      strategy: structuredClone(strategy.value),
      filters: structuredClone(filters.value),
      seed,
    })
    activeGeneration = task
    try {
      const result = await task.promise
      if (activeGeneration?.requestId === task.requestId) {
        run.value = result
        generationProgress.value = 100
      }
    } catch (reason) {
      if (!(reason instanceof ResearchTaskCancelledError)) error.value = reason instanceof Error ? reason.message : String(reason)
    } finally {
      if (activeGeneration?.requestId === task.requestId) {
        activeGeneration = null
        generating.value = false
      }
    }
  }

  async function synchronize() {
    loading.value = true
    error.value = null
    try {
      syncStatus.value = await syncDraws(game.value)
      await load()
    } catch (reason) { error.value = `官方同步失败，当前仍使用本地数据：${String(reason)}` }
    finally { loading.value = false }
  }

  async function saveCurrentRun() {
    if (!run.value) return
    await saveRun(JSON.stringify(run.value))
  }

  function runBacktest(period: number, onProgress?: (progress: BacktestProgress) => void) {
    return startBacktestTask({
      game: game.value,
      draws: structuredClone(draws.value),
      strategy: structuredClone(strategy.value),
      filters: structuredClone(filters.value),
      period,
    }, onProgress)
  }

  function reportError(message: string) { error.value = message }

  return { game: readonly(game), rule, draws, latestDraw, strategy, filters, run, loading: readonly(loading), generating: readonly(generating), generationProgress: readonly(generationProgress), error: readonly(error), syncStatus: readonly(syncStatus), scoreLabel, usingDemoData, load, selectGame, generate, synchronize, saveCurrentRun, runBacktest, reportError }
}
