// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'

function mockMatchMedia(matches = false) {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => ({ matches, addEventListener: vi.fn() })) })
}

describe('theme preference', () => {
  beforeEach(() => {
    vi.resetModules()
    window.localStorage.clear()
    delete window.LottoLabAndroid
    mockMatchMedia(false)
    document.documentElement.removeAttribute('data-theme')
    document.head.innerHTML = '<meta name="theme-color" content="#f4f7fb">'
  })

  it('restores a saved dark preference before the app mounts', async () => {
    window.localStorage.setItem('lottolab.theme-preference', 'dark')
    const theme = await import('./theme')
    theme.initializeTheme()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(theme.useTheme().resolved.value).toBe('dark')
  })

  it('persists explicit choices and updates the theme color', async () => {
    const theme = await import('./theme')
    theme.initializeTheme()
    theme.setThemePreference('light')
    expect(window.localStorage.getItem('lottolab.theme-preference')).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#f4f7fb')
  })
})
