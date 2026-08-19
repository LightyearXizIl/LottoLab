import type { DrawRecord, FilterConfig, GameKind, Recommendation, RecommendationRun, ScoreContribution, StrategyConfig } from './types'

export const gameRules = {
  ssq: { label: '双色球', primaryCount: 6, primaryMax: 33, secondaryCount: 1, secondaryMax: 16, jackpotOdds: '1 / 17,721,088', primaryName: '红球', secondaryName: '蓝球', primaryOverlap: 3, secondaryOverlap: 1 },
  dlt: { label: '大乐透', primaryCount: 5, primaryMax: 35, secondaryCount: 2, secondaryMax: 12, jackpotOdds: '1 / 21,425,712', primaryName: '前区', secondaryName: '后区', primaryOverlap: 2, secondaryOverlap: 1 },
} as const

export const emptyFilters = (): FilterConfig => ({
  includePrimary: [], excludePrimary: [], includeSecondary: [], excludeSecondary: [], maxConsecutivePairs: 2, maxLastDrawRepeats: 2,
})

function mulberry32(seed: number) {
  return () => {
    let value = seed += 0x6D2B79F5
    value = Math.imul(value ^ value >>> 15, value | 1)
    value ^= value + Math.imul(value ^ value >>> 7, value | 61)
    return ((value ^ value >>> 14) >>> 0) / 4294967296
  }
}

export function seedToNumber(seed: string) {
  return [...seed].reduce((value, character) => Math.imul(31, value) + character.charCodeAt(0) | 0, 0x5f3759df)
}

function pickUnique(max: number, count: number, required: number[], excluded: number[], random: () => number) {
  const result = new Set(required)
  const available = Array.from({ length: max }, (_, index) => index + 1).filter(number => !result.has(number) && !excluded.includes(number))
  while (result.size < count && available.length) result.add(available.splice(Math.floor(random() * available.length), 1)[0])
  return [...result].sort((a, b) => a - b)
}

function isValidZone(numbers: number[], max: number, count: number, required: number[], excluded: number[]) {
  return numbers.length === count && new Set(numbers).size === count && numbers.every(number => number >= 1 && number <= max && !excluded.includes(number)) && required.every(number => numbers.includes(number))
}

function consecutivePairs(numbers: number[]) {
  return numbers.filter((number, index) => index > 0 && number - numbers[index - 1] === 1).length
}

function overlap(left: number[], right: number[]) { return left.filter(number => right.includes(number)).length }

function recentFrequency(draws: DrawRecord[], key: 'primaryNumbers' | 'secondaryNumbers', max: number, number: number, window: number) {
  const slice = draws.slice(0, Math.min(window, draws.length))
  if (!slice.length) return .5
  return slice.filter(draw => draw[key].includes(number)).length / slice.length * max
}

function contribution(label: string, raw: number, weight: number): ScoreContribution { return { label, score: Math.max(0, Math.min(100, raw * 100)), weight } }

function calculateScore(game: GameKind, primary: number[], secondary: number[], draws: DrawRecord[], strategy: StrategyConfig): { score: number | null, contributions: ScoreContribution[] } {
  if (strategy.id === 'random') return { score: null, contributions: [] }
  const rule = gameRules[game]
  const latest = draws[0]
  const all = [...primary.map(number => ({ number, key: 'primaryNumbers' as const, max: rule.primaryMax })), ...secondary.map(number => ({ number, key: 'secondaryNumbers' as const, max: rule.secondaryMax }))]
  const frequency = all.reduce((sum, item) => sum + (recentFrequency(draws, item.key, item.max, item.number, 30) + recentFrequency(draws, item.key, item.max, item.number, 100) + recentFrequency(draws, item.key, item.max, item.number, 300)) / 3, 0) / all.length
  const omission = all.reduce((sum, item) => {
    const index = draws.findIndex(draw => draw[item.key].includes(item.number))
    const percentile = Math.min(1, Math.max(0, (index < 0 ? 50 : index) / 50))
    return sum + (1 - Math.abs(percentile - .5) * 2)
  }, 0) / all.length
  const momentum = all.reduce((sum, item) => sum + Math.min(1, recentFrequency(draws, item.key, item.max, item.number, 30) / Math.max(.25, recentFrequency(draws, item.key, item.max, item.number, 100))), 0) / all.length
  const pairTotal = primary.length * (primary.length - 1) / 2 + secondary.length * Math.max(0, secondary.length - 1) / 2
  const cooccurrence = pairTotal === 0 ? .5 : Math.min(1, (primary.length + secondary.length) / Math.max(1, pairTotal))
  const sum = primary.reduce((total, number) => total + number, 0)
  const odd = primary.filter(number => number % 2).length
  const span = primary[primary.length - 1] - primary[0]
  const structure = (Math.max(0, 1 - Math.abs(odd - primary.length / 2) / primary.length) + Math.max(0, 1 - Math.abs(span - rule.primaryMax * .65) / rule.primaryMax) + Math.max(0, 1 - Math.abs(sum - rule.primaryCount * (rule.primaryMax + 1) / 2) / (rule.primaryCount * rule.primaryMax / 2))) / 3
  const factors = [
    contribution('多窗口频次', frequency, strategy.weights.frequency),
    contribution('遗漏典型度', omission, strategy.weights.omission),
    contribution('近期趋势', momentum, strategy.weights.momentum),
    contribution('区域共现', cooccurrence, strategy.weights.cooccurrence),
    contribution('号码形态', structure, strategy.weights.structure),
  ]
  const score = factors.reduce((total, item) => total + item.score * item.weight / 100, 0)
  if (latest && overlap(primary, latest.primaryNumbers) > (rule.primaryCount - 1)) return { score: score * .75, contributions: factors }
  return { score, contributions: factors }
}

function respectsFilters(game: GameKind, primary: number[], secondary: number[], filters: FilterConfig, last: DrawRecord | undefined) {
  const rule = gameRules[game]
  if (!isValidZone(primary, rule.primaryMax, rule.primaryCount, filters.includePrimary, filters.excludePrimary)) return false
  if (!isValidZone(secondary, rule.secondaryMax, rule.secondaryCount, filters.includeSecondary, filters.excludeSecondary)) return false
  const sum = primary.reduce((total, number) => total + number, 0)
  const odd = primary.filter(number => number % 2).length
  if (filters.sumMin !== undefined && sum < filters.sumMin) return false
  if (filters.sumMax !== undefined && sum > filters.sumMax) return false
  if (filters.oddPrimaryMin !== undefined && odd < filters.oddPrimaryMin) return false
  if (filters.oddPrimaryMax !== undefined && odd > filters.oddPrimaryMax) return false
  if (filters.maxConsecutivePairs !== undefined && consecutivePairs(primary) > filters.maxConsecutivePairs) return false
  if (last && filters.maxLastDrawRepeats !== undefined && overlap(primary, last.primaryNumbers) > filters.maxLastDrawRepeats) return false
  return true
}

export function generateRecommendations(game: GameKind, draws: DrawRecord[], strategy: StrategyConfig, filters: FilterConfig, seed: string): RecommendationRun {
  const rule = gameRules[game]
  if (filters.includePrimary.length > rule.primaryCount || filters.includeSecondary.length > rule.secondaryCount) throw new Error('胆码数量超过当前玩法可选数量。')
  if (filters.includePrimary.some(number => filters.excludePrimary.includes(number)) || filters.includeSecondary.some(number => filters.excludeSecondary.includes(number))) throw new Error('同一个号码不能同时设为胆码和排除号码。')
  const random = mulberry32(seedToNumber(seed))
  const candidates: Recommendation[] = []
  const visited = new Set<string>()
  const attempts = 50000
  for (let index = 0; index < attempts; index += 1) {
    const primary = pickUnique(rule.primaryMax, rule.primaryCount, filters.includePrimary, filters.excludePrimary, random)
    const secondary = pickUnique(rule.secondaryMax, rule.secondaryCount, filters.includeSecondary, filters.excludeSecondary, random)
    const key = `${primary.join('-')}|${secondary.join('-')}`
    if (visited.has(key) || !respectsFilters(game, primary, secondary, filters, draws[0])) continue
    visited.add(key)
    const details = calculateScore(game, primary, secondary, draws, strategy)
    candidates.push({ primaryNumbers: primary, secondaryNumbers: secondary, ...details })
  }
  if (candidates.length < 5) throw new Error('当前过滤条件下不足5组可用号码，请放宽条件后重试。')
  candidates.sort((left, right) => (right.score ?? 0) - (left.score ?? 0))
  const selected: Recommendation[] = []
  for (const candidate of candidates) {
    const acceptable = selected.every(item => overlap(candidate.primaryNumbers, item.primaryNumbers) <= (filters.maxPrimaryOverlap ?? rule.primaryOverlap) && overlap(candidate.secondaryNumbers, item.secondaryNumbers) <= (filters.maxSecondaryOverlap ?? rule.secondaryOverlap))
    if (acceptable) selected.push(candidate)
    if (selected.length === 5) break
  }
  if (selected.length < 5) throw new Error('组间重叠限制过严，无法生成5组差异化号码。')
  return { id: crypto.randomUUID(), game, cutoffIssue: draws[0]?.issue ?? '演示数据', dataCount: draws.length, createdAt: new Date().toISOString(), seed, algorithmVersion: '1.0.0', strategy: structuredClone(strategy), filters: structuredClone(filters), recommendations: selected }
}
