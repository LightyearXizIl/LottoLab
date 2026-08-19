<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import LabView from './views/LabView.vue'
import AnalysisView from './views/AnalysisView.vue'
import BacktestView from './views/BacktestView.vue'
import HistoryView from './views/HistoryView.vue'
import SavedView from './views/SavedView.vue'
import SettingsView from './views/SettingsView.vue'
import { useLottoLab } from './composables/useLottoLab'

type Page = 'lab' | 'analysis' | 'backtest' | 'history' | 'saved' | 'settings'
const activePage = shallowRef<Page>('lab')
const lab = useLottoLab()
const pages: { id: Page, icon: string, label: string }[] = [{ id: 'lab', icon: '✦', label: '选号实验室' }, { id: 'analysis', icon: '◌', label: '数据分析' }, { id: 'backtest', icon: '⌁', label: '策略回测' }, { id: 'history', icon: '▤', label: '历史开奖' }, { id: 'saved', icon: '♡', label: '收藏预设' }, { id: 'settings', icon: '⚙', label: '设置与关于' }]
const currentView = computed(() => ({ lab: LabView, analysis: AnalysisView, backtest: BacktestView, history: HistoryView, saved: SavedView, settings: SettingsView })[activePage.value])
onMounted(() => lab.load())
</script>

<template>
  <div class="app-shell"><aside class="sidebar"><div class="brand"><img src="/lottolab-mark.svg" alt="" /><div><strong>LottoLab</strong><span>历史号码研究</span></div></div><nav aria-label="主导航"><button v-for="page in pages" :key="page.id" type="button" :class="{ active: activePage === page.id }" @click="activePage = page.id"><i>{{ page.icon }}</i>{{ page.label }}</button></nav><div class="sidebar-footer"><span class="dot" :class="{ live: lab.syncStatus.value?.status === 'success' }"></span><span>{{ lab.latestDraw.value?.source ?? '准备数据' }}</span><small>v0.0.1</small></div></aside><main class="main"><header class="topbar"><div><span>当前数据</span><b>{{ lab.latestDraw.value?.issue ?? '—' }}</b><small>{{ lab.latestDraw.value?.drawDate ?? '等待加载' }}</small></div><div><span>理论头奖概率</span><b>{{ lab.rule.value.jackpotOdds }}</b><small>合法单注均相同</small></div><button type="button" :disabled="lab.loading.value" @click="lab.synchronize()">{{ lab.loading.value ? '同步中…' : '↻ 更新开奖数据' }}</button></header><component :is="currentView" /></main></div>
</template>
