import { shallowRef } from 'vue'

export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'lottolab.theme-preference'
const preference = shallowRef<ThemePreference>('system')
const resolved = shallowRef<ResolvedTheme>('light')
let mediaQuery: MediaQueryList | null = null
let initialized = false

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

function isAndroidRuntime() {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
}

function systemTheme(): ResolvedTheme {
  return mediaQuery?.matches ? 'dark' : 'light'
}

function resolveTheme(value: ThemePreference): ResolvedTheme {
  return value === 'system' ? systemTheme() : value
}

function syncNativeTheme(value: ThemePreference) {
  if (typeof window === 'undefined') return
  if (isAndroidRuntime()) {
    window.LottoLabAndroid?.setTheme(value)
    return
  }
  if ('__TAURI_INTERNALS__' in window) {
    void import('@tauri-apps/api/app').then(({ setTheme }) => setTheme(value === 'system' ? null : value)).catch(() => undefined)
  }
}

function applyTheme() {
  if (typeof document === 'undefined') return
  resolved.value = resolveTheme(preference.value)
  const root = document.documentElement
  root.dataset.theme = resolved.value
  root.dataset.platform = isAndroidRuntime() ? 'android' : 'desktop'
  root.style.colorScheme = resolved.value
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = resolved.value === 'dark' ? '#111827' : '#f4f7fb'
  syncNativeTheme(preference.value)
}

function handleSystemThemeChange() {
  if (preference.value === 'system') applyTheme()
}

export function initializeTheme() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  const stored = window.localStorage.getItem(STORAGE_KEY)
  preference.value = isThemePreference(stored) ? stored : 'system'
  mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null
  mediaQuery?.addEventListener?.('change', handleSystemThemeChange)
  applyTheme()
}

export function setThemePreference(value: ThemePreference) {
  preference.value = value
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, value)
  applyTheme()
}

export function useTheme() {
  return { preference, resolved, setThemePreference }
}
