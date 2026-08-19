import type { DrawRecord, GameKind } from '../domain/types'

const date = (offset: number) => new Date(Date.UTC(2026, 7, 18 - offset)).toISOString().slice(0, 10)

function makeDraw(game: GameKind, offset: number): DrawRecord {
  const primaryMax = game === 'ssq' ? 33 : 35
  const secondaryMax = game === 'ssq' ? 16 : 12
  const primaryCount = game === 'ssq' ? 6 : 5
  const secondaryCount = game === 'ssq' ? 1 : 2
  const create = (max: number, count: number, salt: number) => {
    const numbers = new Set<number>()
    let cursor = offset * 7 + salt
    while (numbers.size < count) { numbers.add((cursor * 11 + cursor * cursor + salt) % max + 1); cursor += 3 }
    return [...numbers].sort((a, b) => a - b)
  }
  return {
    game,
    issue: game === 'ssq' ? `2026${String(95 - offset).padStart(3, '0')}` : `260${String(93 - offset).padStart(2, '0')}`,
    drawDate: date(offset),
    primaryNumbers: create(primaryMax, primaryCount, game === 'ssq' ? 5 : 9),
    secondaryNumbers: create(secondaryMax, secondaryCount, game === 'ssq' ? 23 : 17),
    source: '内置演示快照',
    fetchedAt: '2026-08-19T00:00:00.000Z',
  }
}

export const demoDraws = (game: GameKind) => Array.from({ length: 120 }, (_, index) => makeDraw(game, index))
