// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'

describe('adaptive application navigation', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollTo', { value: vi.fn(), configurable: true })
  })

  it('keeps six desktop destinations and exposes five mobile destinations', async () => {
    const wrapper = mount(App)
    expect(wrapper.findAll('.sidebar nav button')).toHaveLength(6)
    expect(wrapper.findAll('.bottom-nav button')).toHaveLength(5)

    await wrapper.findAll('.bottom-nav button')[4].trigger('click')
    expect(wrapper.text()).toContain('收藏预设')
    expect(wrapper.text()).toContain('设置与关于')
  })
})
