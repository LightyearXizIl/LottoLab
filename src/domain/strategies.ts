import type { StrategyConfig, StrategyWeights } from './types'

const makeWeights = (frequency: number, omission: number, momentum: number, cooccurrence: number, structure: number): StrategyWeights => ({ frequency, omission, momentum, cooccurrence, structure })

export const strategyPresets: StrategyConfig[] = [
  { id: 'balanced', name: '均衡研究', weights: makeWeights(20, 10, 10, 15, 45) },
  { id: 'hot', name: '热度偏重', weights: makeWeights(40, 5, 20, 15, 20) },
  { id: 'omission', name: '遗漏研究', weights: makeWeights(10, 40, 5, 10, 35) },
  { id: 'structure', name: '形态偏重', weights: makeWeights(10, 5, 5, 10, 70) },
  { id: 'random', name: '完全随机', weights: makeWeights(0, 0, 0, 0, 0) },
]

export const defaultStrategy = (): StrategyConfig => structuredClone(strategyPresets[0])
