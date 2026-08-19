<script setup lang="ts">
import { shallowRef } from 'vue'
import SavedView from './SavedView.vue'
import SettingsView from './SettingsView.vue'

type Section = 'saved' | 'settings'
const section = shallowRef<Section>('saved')
</script>

<template>
  <div class="my-view">
    <header><p class="eyebrow">LOCAL & PRIVATE</p><h1>我的</h1><p>收藏、设置和应用信息只保存在当前设备。</p></header>
    <div class="tabs" role="tablist" aria-label="我的页面">
      <button type="button" role="tab" :aria-selected="section === 'saved'" :class="{ active: section === 'saved' }" @click="section = 'saved'">收藏预设</button>
      <button type="button" role="tab" :aria-selected="section === 'settings'" :class="{ active: section === 'settings' }" @click="section = 'settings'">设置与关于</button>
    </div>
    <SavedView v-if="section === 'saved'" class="nested-view" />
    <SettingsView v-else class="nested-view" />
  </div>
</template>

<style scoped>
.my-view{display:grid;gap:1.1rem}.eyebrow{margin:0;color:var(--ink-muted);font-size:.67rem;font-weight:800;letter-spacing:.1em}h1{margin:.3rem 0;font-size:1.55rem}header p:not(.eyebrow){margin:0;color:var(--ink-soft);font-size:.85rem}.tabs{display:grid;grid-template-columns:1fr 1fr;gap:.25rem;padding:.25rem;border:1px solid var(--line);border-radius:.75rem;background:var(--surface-muted)}.tabs button{min-height:2.75rem;border:0;border-radius:.55rem;background:transparent;color:var(--ink-soft);font:inherit;font-weight:700}.tabs button.active{background:var(--surface);color:var(--ink);box-shadow:0 1px 5px rgb(15 23 42 / 10%)}.nested-view:deep(> header){display:none}
</style>
