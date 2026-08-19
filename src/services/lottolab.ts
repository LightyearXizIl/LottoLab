import type { DrawRecord, GameKind, SyncReport } from '../domain/types'

const isTauri = () => '__TAURI_INTERNALS__' in window

async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core')
  return tauriInvoke<T>(command, args)
}

export async function listDraws(game: GameKind, limit = 300): Promise<DrawRecord[] | null> {
  if (!isTauri()) return null
  return invoke<DrawRecord[]>('list_draws', { game, limit })
}

export async function syncDraws(game: GameKind): Promise<SyncReport> {
  return invoke<SyncReport>('sync_draws', { game })
}

export async function saveRun(payload: string): Promise<void> {
  if (!isTauri()) return
  await invoke('save_recommendation_run', { payload })
}

export async function listSavedRuns(): Promise<string[]> {
  if (!isTauri()) return []
  return invoke<string[]>('list_saved_runs')
}

export async function fetchUpdateManifest(): Promise<{ version: string, notes?: string } | null> {
  try {
    const response = await fetch('https://github.com/LightyearXizIl/LottoLab/releases/latest/download/latest.json', { cache: 'no-store' })
    if (!response.ok) return null
    return response.json() as Promise<{ version: string, notes?: string }>
  } catch { return null }
}

export async function checkSignedUpdate(): Promise<{ version: string, notes?: string, install: () => Promise<void> } | null> {
  if (!isTauri()) return null
  const { check } = await import('@tauri-apps/plugin-updater')
  const update = await check()
  if (!update) return null
  return { version: update.version, notes: update.body ?? undefined, install: () => update.downloadAndInstall() }
}
