<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import AnalysisView from './views/AnalysisView.vue'
import BacktestView from './views/BacktestView.vue'
import HistoryView from './views/HistoryView.vue'
import LabView from './views/LabView.vue'
import MyView from './views/MyView.vue'
import SavedView from './views/SavedView.vue'
import SettingsView from './views/SettingsView.vue'
import { useLottoLab } from './composables/useLottoLab'

type Page = 'lab' | 'analysis' | 'backtest' | 'history' | 'saved' | 'settings' | 'my'
interface NavigationItem { id: Page, icon: string, label: string }

const activePage = shallowRef<Page>('lab')
const lab = useLottoLab()
const logoUrl = '/lottolab-mark.svg'
const desktopPages: NavigationItem[] = [
  { id: 'lab', icon: '✦', label: '选号实验室' },
  { id: 'analysis', icon: '◌', label: '数据分析' },
  { id: 'backtest', icon: '⌁', label: '策略回测' },
  { id: 'history', icon: '▤', label: '历史开奖' },
  { id: 'saved', icon: '♡', label: '收藏预设' },
  { id: 'settings', icon: '⚙', label: '设置与关于' },
]
const mobilePages: NavigationItem[] = [
  { id: 'lab', icon: '✦', label: '实验室' },
  { id: 'analysis', icon: '◌', label: '分析' },
  { id: 'backtest', icon: '⌁', label: '回测' },
  { id: 'history', icon: '▤', label: '历史' },
  { id: 'my', icon: '●', label: '我的' },
]
const currentView = computed(() => ({
  lab: LabView,
  analysis: AnalysisView,
  backtest: BacktestView,
  history: HistoryView,
  saved: SavedView,
  settings: SettingsView,
  my: MyView,
})[activePage.value])

function selectPage(page: Page) {
  activePage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => lab.load())
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><img :src="logoUrl" alt=""><div><strong>LottoLab</strong><span>历史号码研究</span></div></div>
      <nav aria-label="主导航"><button v-for="page in desktopPages" :key="page.id" type="button" :class="{ active: activePage === page.id }" :aria-current="activePage === page.id ? 'page' : undefined" @click="selectPage(page.id)"><i>{{ page.icon }}</i>{{ page.label }}</button></nav>
      <div class="sidebar-footer"><span class="dot" :class="{ live: lab.syncStatus.value?.status === 'success', demo: lab.usingDemoData.value }"></span><span>{{ lab.usingDemoData.value ? '当前为演示快照' : (lab.latestDraw.value?.source ?? '准备数据') }}</span><small>v0.0.1</small></div>
    </aside>

    <div class="mobile-appbar">
      <div class="mobile-brand"><img :src="logoUrl" alt=""><div><strong>LottoLab</strong><span>{{ lab.usingDemoData.value ? '演示数据' : (lab.latestDraw.value?.issue ?? '准备数据') }}</span></div></div>
      <button type="button" :disabled="lab.loading.value" aria-label="同步官方开奖数据" @click="lab.synchronize()">{{ lab.loading.value ? '同步中' : '↻ 同步' }}</button>
    </div>

    <main class="main">
      <header class="topbar">
        <div><span>当前数据</span><b>{{ lab.latestDraw.value?.issue ?? '—' }}</b><small>{{ lab.latestDraw.value?.drawDate ?? '等待加载' }}<em v-if="lab.usingDemoData.value">演示</em></small></div>
        <div><span>理论头奖概率</span><b>{{ lab.rule.value.jackpotOdds }}</b><small>合法单注均相同</small></div>
        <button type="button" :disabled="lab.loading.value" @click="lab.synchronize()">{{ lab.loading.value ? '同步中…' : '↻ 更新开奖数据' }}</button>
      </header>
      <component :is="currentView" />
    </main>

    <nav class="bottom-nav" aria-label="移动端主导航">
      <button v-for="page in mobilePages" :key="page.id" type="button" :class="{ active: activePage === page.id || (page.id === 'my' && ['saved', 'settings'].includes(activePage)) }" :aria-current="activePage === page.id ? 'page' : undefined" @click="selectPage(page.id)"><i>{{ page.icon }}</i><span>{{ page.label }}</span></button>
    </nav>
  </div>
</template>
