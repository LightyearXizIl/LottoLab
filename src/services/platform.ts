import type { RecommendationRun } from '../domain/types'
import { APP_VERSION, LATEST_RELEASE_URL } from '../app-meta'
import { checkSignedUpdate, fetchPublicReleaseManifest } from './lottolab'

export type RuntimePlatform = 'android' | 'desktop' | 'web'
export type UpdateStatus = 'up-to-date' | 'available' | 'error'

export interface UpdateCheckResult {
  status: UpdateStatus
  currentVersion: string
  latestVersion?: string
  message: string
  actionLabel?: string
  action?: () => Promise<void>
}

function isTauriRuntime() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export async function runtimePlatform(): Promise<RuntimePlatform> {
  if (!isTauriRuntime()) return 'web'
  try {
    const { platform } = await import('@tauri-apps/plugin-os')
    return platform() === 'android' ? 'android' : 'desktop'
  } catch {
    return /Android/i.test(navigator.userAgent) ? 'android' : 'desktop'
  }
}

export function formatRecommendationText(run: RecommendationRun): string {
  return run.recommendations
    .map((item, index) => `${index + 1}. ${item.primaryNumbers.map(number => String(number).padStart(2, '0')).join(' ')} + ${item.secondaryNumbers.map(number => String(number).padStart(2, '0')).join(' ')}`)
    .join('\n')
}

export function formatRecommendationCsv(run: RecommendationRun): string {
  return [
    'group,primary_numbers,secondary_numbers,score',
    ...run.recommendations.map((item, index) => `${index + 1},"${item.primaryNumbers.join(' ')}","${item.secondaryNumbers.join(' ')}",${item.score ?? ''}`),
  ].join('\n')
}

function copyWithTextarea(text: string) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('系统未允许写入剪贴板')
}

export async function copyRecommendationRun(run: RecommendationRun): Promise<void> {
  const text = formatRecommendationText(run)
  if (isTauriRuntime()) {
    const { writeText } = await import('@tauri-apps/plugin-clipboard-manager')
    await writeText(text)
    return
  }
  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text)
  else copyWithTextarea(text)
}

export async function exportRecommendationCsv(run: RecommendationRun): Promise<string | null> {
  const fileName = `LottoLab-${run.game}-${run.cutoffIssue}.csv`
  const contents = `\uFEFF${formatRecommendationCsv(run)}`
  if (isTauriRuntime()) {
    const [{ save }, { writeTextFile }] = await Promise.all([
      import('@tauri-apps/plugin-dialog'),
      import('@tauri-apps/plugin-fs'),
    ])
    const path = await save({ defaultPath: fileName, filters: [{ name: 'CSV', extensions: ['csv'] }] })
    if (!path) return null
    await writeTextFile(path, contents)
    return path
  }

  const url = URL.createObjectURL(new Blob([contents], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
  return fileName
}

export async function openReleasePage(): Promise<void> {
  await openUrl(LATEST_RELEASE_URL)
}

export async function openUrl(url: string): Promise<void> {
  if (isTauriRuntime()) {
    const { openUrl } = await import('@tauri-apps/plugin-opener')
    await openUrl(url)
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

export function compareVersions(left: string, right: string): number {
  const parse = (value: string) => {
    const match = value.trim().replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/)
    if (!match) return null
    return { core: match.slice(1, 4).map(Number), prerelease: match[4]?.split('.') ?? [] }
  }
  const a = parse(left); const b = parse(right)
  if (!a || !b) throw new Error('版本号不是有效的语义化版本')
  for (let index = 0; index < a.core.length; index += 1) {
    if (a.core[index] !== b.core[index]) return a.core[index] > b.core[index] ? 1 : -1
  }
  if (!a.prerelease.length || !b.prerelease.length) return a.prerelease.length === b.prerelease.length ? 0 : (a.prerelease.length ? -1 : 1)
  const length = Math.max(a.prerelease.length, b.prerelease.length)
  for (let index = 0; index < length; index += 1) {
    const aPart = a.prerelease[index]; const bPart = b.prerelease[index]
    if (aPart === undefined) return -1
    if (bPart === undefined) return 1
    if (aPart === bPart) continue
    const aNumber = /^\d+$/.test(aPart); const bNumber = /^\d+$/.test(bPart)
    if (aNumber && bNumber) return Number(aPart) > Number(bPart) ? 1 : -1
    if (aNumber !== bNumber) return aNumber ? -1 : 1
    return aPart > bPart ? 1 : -1
  }
  return 0
}

async function currentApplicationVersion() {
  if (!isTauriRuntime()) return APP_VERSION
  try {
    const { getVersion } = await import('@tauri-apps/api/app')
    return await getVersion()
  } catch { return APP_VERSION }
}

export async function checkApplicationUpdate(): Promise<UpdateCheckResult> {
  const [platform, currentVersion] = await Promise.all([runtimePlatform(), currentApplicationVersion()])
  if (platform === 'android') {
    const manifest = await fetchPublicReleaseManifest()
    if (!manifest) return { status: 'error', currentVersion, message: '暂时无法读取公开版本清单。' }
    if (compareVersions(manifest.version, currentVersion) > 0) {
      return { status: 'available', currentVersion, latestVersion: manifest.version, message: `发现新版本 ${manifest.version}：${manifest.notes ?? '请查看 Release 说明'}`, actionLabel: '前往下载页', action: () => openUrl(manifest.releaseUrl) }
    }
    return { status: 'up-to-date', currentVersion, latestVersion: manifest.version, message: `当前已是最新版本 ${currentVersion}。` }
  }

  if (platform === 'desktop') {
    const signed = await checkSignedUpdate()
    if (signed) return { status: 'available', currentVersion, latestVersion: signed.version, message: `发现已签名版本 ${signed.version}：${signed.notes ?? '请查看 Release 说明'}`, actionLabel: '下载并安装', action: signed.install }
    return { status: 'up-to-date', currentVersion, message: `当前已是最新版本 ${currentVersion}。` }
  }

  const manifest = await fetchPublicReleaseManifest()
  if (!manifest) return { status: 'error', currentVersion, message: '暂无可读取的发布更新清单。' }
  return compareVersions(manifest.version, currentVersion) > 0
    ? { status: 'available', currentVersion, latestVersion: manifest.version, message: `发现公开版本 ${manifest.version}。`, actionLabel: '查看下载页', action: () => openUrl(manifest.releaseUrl) }
    : { status: 'up-to-date', currentVersion, latestVersion: manifest.version, message: `当前已是最新版本 ${currentVersion}。` }
}
