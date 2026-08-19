import type { DrawRecord, GameKind, SyncReport } from '../domain/types'
import { PUBLIC_RELEASE_MANIFEST_URL } from '../app-meta'

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

export interface PublicReleaseManifest {
  version: string
  notes?: string
  publishedAt: string
  releaseUrl: string
  android: {
    apkUrl: string
    sha256: string
    sizeBytes: number
    minSdk: number
  }
}

function isPublicReleaseManifest(value: unknown): value is PublicReleaseManifest {
  if (!value || typeof value !== 'object') return false
  const manifest = value as Partial<PublicReleaseManifest>
  return typeof manifest.version === 'string'
    && typeof manifest.publishedAt === 'string'
    && typeof manifest.releaseUrl === 'string'
    && !!manifest.android
    && typeof manifest.android.apkUrl === 'string'
    && typeof manifest.android.sha256 === 'string'
    && typeof manifest.android.sizeBytes === 'number'
    && typeof manifest.android.minSdk === 'number'
}

export async function fetchPublicReleaseManifest(endpoint = PUBLIC_RELEASE_MANIFEST_URL): Promise<PublicReleaseManifest | null> {
  try {
    const response = await fetch(endpoint, { cache: 'no-store' })
    if (!response.ok) return null
    const manifest: unknown = await response.json()
    return isPublicReleaseManifest(manifest) ? manifest : null
  } catch { return null }
}

export async function checkSignedUpdate(): Promise<{ version: string, notes?: string, install: () => Promise<void> } | null> {
  if (!isTauri()) return null
  const { check } = await import('@tauri-apps/plugin-updater')
  const update = await check()
  if (!update) return null
  return { version: update.version, notes: update.body ?? undefined, install: () => update.downloadAndInstall() }
}
