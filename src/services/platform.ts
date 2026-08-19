import type { RecommendationRun } from '../domain/types'
import { checkSignedUpdate, fetchUpdateManifest } from './lottolab'

const RELEASE_PAGE = 'https://github.com/LightyearXizIl/LottoLab/releases/latest'

export type RuntimePlatform = 'android' | 'desktop' | 'web'

export interface UpdateCheckResult {
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
  if (isTauriRuntime()) {
    const { openUrl } = await import('@tauri-apps/plugin-opener')
    await openUrl(RELEASE_PAGE)
  } else {
    window.open(RELEASE_PAGE, '_blank', 'noopener,noreferrer')
  }
}

export async function checkApplicationUpdate(): Promise<UpdateCheckResult> {
  const platform = await runtimePlatform()
  if (platform === 'android') {
    const manifest = await fetchUpdateManifest()
    return manifest
      ? { message: `最新公开版本 ${manifest.version}：${manifest.notes ?? '请查看 Release 说明'}`, actionLabel: '前往下载页', action: openReleasePage }
      : { message: '暂时无法读取公开版本清单。' }
  }

  if (platform === 'desktop') {
    const signed = await checkSignedUpdate()
    if (signed) return { message: `发现已签名版本 ${signed.version}：${signed.notes ?? '请查看 Release 说明'}`, actionLabel: '下载并安装', action: signed.install }
  }

  const manifest = await fetchUpdateManifest()
  return manifest
    ? { message: `公开版本 ${manifest.version}；当前构建未发现可安装的签名更新。` }
    : { message: '暂无可读取的发布更新清单。' }
}
