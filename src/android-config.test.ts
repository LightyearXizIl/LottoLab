import { describe, expect, it } from 'vitest'
import androidConfig from '../src-tauri/tauri.android.conf.json'

describe('Android Tauri configuration', () => {
  it('declares the main webview window', () => {
    expect(androidConfig.app.windows).toContainEqual(
      expect.objectContaining({ label: 'main' }),
    )
  })
})
