<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import AnalysisView from './views/AnalysisView.vue'
import BacktestView from './views/BacktestView.vue'
import HistoryView from './views/HistoryView.vue'
import LabView from './views/LabView.vue'
import MyView from './views/MyView.vue'
import SavedView from './views/SavedView.vue'
import SettingsView from './views/SettingsView.vue'
import NavIcon from './components/shared/NavIcon.vue'
import GameSwitcher from './components/research/GameSwitcher.vue'
import { APP_VERSION } from './app-meta'
import { checkApplicationUpdate, type UpdateCheckResult } from './services/platform'
import { useLottoLab } from './composables/useLottoLab'

type Page = 'lab' | 'analysis' | 'backtest' | 'history' | 'saved' | 'settings' | 'my'
interface NavigationItem { id: Page, icon: 'lab' | 'analysis' | 'backtest' | 'history' | 'saved' | 'settings' | 'my', label: string }

const activePage = shallowRef<Page>('lab')
const lab = useLottoLab()
const logoUrl = '/lottolab-mark.svg'
const desktopPages: NavigationItem[] = [
  { id: 'lab', icon: 'lab', label: '选号实验室' },
  { id: 'analysis', icon: 'analysis', label: '数据分析' },
  { id: 'backtest', icon: 'backtest', label: '策略回测' },
  { id: 'history', icon: 'history', label: '历史开奖' },
  { id: 'saved', icon: 'saved', label: '收藏预设' },
  { id: 'settings', icon: 'settings', label: '设置与关于' },
]
const mobilePages: NavigationItem[] = [
  { id: 'lab', icon: 'lab', label: '实验室' },
  { id: 'analysis', icon: 'analysis', label: '分析' },
  { id: 'backtest', icon: 'backtest', label: '回测' },
  { id: 'history', icon: 'history', label: '历史' },
  { id: 'my', icon: 'my', label: '我的' },
]
const pageTitle = computed(() => ({ lab: '选号实验室', analysis: '数据分析', backtest: '策略回测', history: '历史开奖', saved: '收藏预设', settings: '设置与关于', my: '我的' })[activePage.value])
const gameModel = computed({ get: () => lab.game.value, set: value => void lab.selectGame(value) })
const update = shallowRef<UpdateCheckResult | null>(null)
const updating = shallowRef(false)
const dismissedUpdate = shallowRef('')
const updateDismissKey = computed(() => update.value?.latestVersion ? `lottolab.dismissed-update.${update.value.latestVersion}` : '')
const showUpdateBanner = computed(() => update.value?.status === 'available' && !!update.value.latestVersion && dismissedUpdate.value !== update.value.latestVersion)
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
  window.scrollTo({ top: 0, behavior: 'auto' })
}

function dismissUpdate() {
  if (!update.value?.latestVersion) return
  dismissedUpdate.value = update.value.latestVersion
  window.localStorage.setItem(updateDismissKey.value, update.value.latestVersion)
}

async function runUpdateAction() {
  if (!update.value?.action || updating.value) return
  updating.value = true
  try { await update.value.action() } finally { updating.value = false }
}

async function checkForUpdate() {
  try {
    update.value = await checkApplicationUpdate()
    if (update.value.latestVersion) dismissedUpdate.value = window.localStorage.getItem(`lottolab.dismissed-update.${update.value.latestVersion}`) ?? ''
  } catch { update.value = null }
}

onMounted(() => { void lab.load(); void checkForUpdate() })
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><img :src="logoUrl" alt=""><div><strong>LottoLab</strong><span>历史号码研究</span></div></div>
      <nav aria-label="主导航"><button v-for="page in desktopPages" :key="page.id" type="button" :class="{ active: activePage === page.id }" :aria-current="activePage === page.id ? 'page' : undefined" @click="selectPage(page.id)"><NavIcon :name="page.icon" />{{ page.label }}</button></nav>
      <div class="sidebar-footer"><span class="dot" :class="{ live: lab.syncStatus.value?.status === 'success', demo: lab.usingDemoData.value }"></span><span>{{ lab.usingDemoData.value ? '当前为演示快照' : (lab.latestDraw.value?.source ?? '准备数据') }}</span><small>v{{ APP_VERSION }}</small></div>
    </aside>

    <div class="mobile-appbar">
      <div class="mobile-brand"><img :src="logoUrl" alt=""><div><strong>{{ pageTitle }}</strong><span>{{ lab.usingDemoData.value ? '演示数据' : (lab.latestDraw.value?.issue ?? '准备数据') }}</span></div></div>
      <button type="button" :disabled="lab.loading.value" aria-label="同步官方开奖数据" @click="lab.synchronize()"><span aria-hidden="true">↻</span></button>
      <GameSwitcher v-model="gameModel" class="mobile-game-switch" />
    </div>

    <main class="main">
      <div v-if="showUpdateBanner && update" class="update-banner" role="status"><div><strong>发现 LottoLab {{ update.latestVersion }}</strong><span>{{ update.message }}</span></div><button v-if="update.action" type="button" :disabled="updating" @click="runUpdateAction">{{ updating ? '处理中…' : update.actionLabel }}</button><button type="button" class="dismiss-update" aria-label="关闭更新提示" @click="dismissUpdate">×</button></div>
      <header class="topbar">
        <div><span>当前数据</span><b>{{ lab.latestDraw.value?.issue ?? '—' }}</b><small>{{ lab.latestDraw.value?.drawDate ?? '等待加载' }}<em v-if="lab.usingDemoData.value">演示</em></small></div>
        <div><span>理论头奖概率</span><b>{{ lab.rule.value.jackpotOdds }}</b><small>合法单注均相同</small></div>
        <button type="button" :disabled="lab.loading.value" @click="lab.synchronize()">{{ lab.loading.value ? '同步中…' : '↻ 更新开奖数据' }}</button>
      </header>
      <component :is="currentView" />
    </main>

    <nav class="bottom-nav" aria-label="移动端主导航">
      <button v-for="page in mobilePages" :key="page.id" type="button" :class="{ active: activePage === page.id || (page.id === 'my' && ['saved', 'settings'].includes(activePage)) }" :aria-current="activePage === page.id ? 'page' : undefined" @click="selectPage(page.id)"><NavIcon :name="page.icon" /><span>{{ page.label }}</span></button>
    </nav>
  </div>
</template>
