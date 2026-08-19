import { computed, readonly, shallowRef } from 'vue'
import { demoDraws } from '../data/demoDraws'
import { defaultStrategy } from '../domain/strategies'
import { emptyFilters, gameRules, generateRecommendations } from '../domain/rules'
import type { BacktestResult, DrawRecord, FilterConfig, GameKind, RecommendationRun, StrategyConfig, SyncReport } from '../domain/types'
import { listDraws, saveRun, syncDraws } from '../services/lottolab'

const game = shallowRef<GameKind>('ssq')
const draws = shallowRef<DrawRecord[]>(demoDraws('ssq'))
const strategy = shallowRef<StrategyConfig>(defaultStrategy())
const filters = shallowRef<FilterConfig>(emptyFilters())
const run = shallowRef<RecommendationRun | null>(null)
const loading = shallowRef(false)
const syncStatus = shallowRef<SyncReport | null>(null)
const error = shallowRef<string | null>(null)

export function useLottoLab() {
  const rule = computed(() => gameRules[game.value])
  const latestDraw = computed(() => draws.value[0])
  const scoreLabel = computed(() => strategy.value.id === 'random' ? '随机抽样' : '历史适配分')

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
    game.value = next
    filters.value = emptyFilters()
    run.value = null
    await load(next)
  }

  function createSeed() { return `${game.value}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }

  function generate(seed = createSeed()) {
    error.value = null
    try { run.value = generateRecommendations(game.value, draws.value, strategy.value, filters.value, seed) }
    catch (reason) { error.value = reason instanceof Error ? reason.message : String(reason) }
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

  function runBacktest(period: number): BacktestResult {
    const sample = draws.value.slice(0, Math.min(period, Math.max(0, draws.value.length - 30)))
    const metrics = sample.map((target, index) => {
      const history = draws.value.slice(index + 1)
      if (history.length < 30) return null
      const generated = generateRecommendations(game.value, history, strategy.value, filters.value, `backtest-${target.issue}`)
      const best = generated.recommendations.reduce((max, item) => {
        const primary = item.primaryNumbers.filter(number => target.primaryNumbers.includes(number)).length
        const secondary = item.secondaryNumbers.filter(number => target.secondaryNumbers.includes(number)).length
        return primary + secondary > max.primary + max.secondary ? { primary, secondary } : max
      }, { primary: 0, secondary: 0 })
      return { issue: target.issue, primaryHits: best.primary, secondaryHits: best.secondary, randomPrimaryMedian: Math.max(0, Math.round(rule.value.primaryCount * rule.value.primaryCount / rule.value.primaryMax)), randomSecondaryMedian: Math.max(0, Math.round(rule.value.secondaryCount * rule.value.secondaryCount / rule.value.secondaryMax)) }
    }).filter((point): point is NonNullable<typeof point> => point !== null)
    return { game: game.value, period, tested: metrics.length, averagePrimaryHits: metrics.reduce((sum, point) => sum + point.primaryHits, 0) / Math.max(1, metrics.length), averageSecondaryHits: metrics.reduce((sum, point) => sum + point.secondaryHits, 0) / Math.max(1, metrics.length), randomPrimaryHits: metrics.reduce((sum, point) => sum + point.randomPrimaryMedian, 0) / Math.max(1, metrics.length), randomSecondaryHits: metrics.reduce((sum, point) => sum + point.randomSecondaryMedian, 0) / Math.max(1, metrics.length), points: metrics }
  }

  return { game: readonly(game), rule, draws, latestDraw, strategy, filters, run, loading: readonly(loading), error: readonly(error), syncStatus: readonly(syncStatus), scoreLabel, load, selectGame, generate, synchronize, saveCurrentRun, runBacktest }
}
