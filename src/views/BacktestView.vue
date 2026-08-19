<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef } from 'vue'
import GameSwitcher from '../components/research/GameSwitcher.vue'
import { useLottoLab } from '../composables/useLottoLab'
import type { BacktestResult } from '../domain/types'
import { ResearchTaskCancelledError, type ResearchTask } from '../services/research-worker'
const lab = useLottoLab()
const gameModel = computed({ get: () => lab.game.value, set: value => void lab.selectGame(value) })
const period = shallowRef(100)
const result = shallowRef<BacktestResult | null>(null)
const running = shallowRef(false)
const completed = shallowRef(0)
const total = shallowRef(0)
const currentIssue = shallowRef('')
const taskError = shallowRef('')
let task: ResearchTask<BacktestResult> | null = null
const progressPercent = computed(() => total.value ? Math.round(completed.value / total.value * 100) : 0)
async function run() {
  task?.cancel()
  running.value = true; completed.value = 0; total.value = 0; currentIssue.value = ''; taskError.value = ''; result.value = null
  const nextTask = lab.runBacktest(period.value, progress => { completed.value = progress.completed; total.value = progress.total; currentIssue.value = progress.issue ?? '' })
  task = nextTask
  try { result.value = await nextTask.promise }
  catch (reason) { if (!(reason instanceof ResearchTaskCancelledError)) taskError.value = reason instanceof Error ? reason.message : String(reason) }
  finally { if (task?.requestId === nextTask.requestId) { task = null; running.value = false } }
}
function cancel() { task?.cancel(); task = null; running.value = false }
onBeforeUnmount(cancel)
</script>
<template><div class="view"><header><div><p class="eyebrow">WALK-FORWARD EVALUATION</p><h1>策略回测</h1><p>每个目标期仅使用此前数据；结果用于观察历史命中分布，不代表未来表现。</p></div><GameSwitcher v-model="gameModel" /></header><section class="card controls"><label>回测窗口<select v-model.number="period" :disabled="running"><option :value="50">最近50期</option><option :value="100">最近100期</option><option :value="200">最近200期</option></select></label><button v-if="!running" type="button" @click="run">运行走步回测</button><button v-else class="cancel" type="button" @click="cancel">取消回测</button></section><section v-if="running" class="card progress-card" aria-live="polite"><div><strong>后台回测中</strong><span>{{ completed }} / {{ total || '—' }}<template v-if="currentIssue"> · {{ currentIssue }}</template></span></div><progress :value="completed" :max="Math.max(1,total)">{{ progressPercent }}%</progress><small>{{ progressPercent }}% · 页面仍可滚动，随时可以取消</small></section><p v-if="taskError" class="error">回测失败：{{ taskError }}</p><section v-if="result" class="card"><div class="summary"><article><span>样本期数</span><strong>{{ result.tested }}</strong></article><article><span>平均主区命中</span><strong>{{ result.averagePrimaryHits.toFixed(2) }}</strong><small>随机基线 {{ result.randomPrimaryHits.toFixed(2) }}</small></article><article><span>平均次区命中</span><strong>{{ result.averageSecondaryHits.toFixed(2) }}</strong><small>随机基线 {{ result.randomSecondaryHits.toFixed(2) }}</small></article></div><p class="notice">LottoLab 不将回测展示为收益率，也不据此作出“提高中奖率”的结论。</p></section><section v-else-if="!running" class="card empty">选择窗口后运行。回测会为每个历史目标期固定种子，并排除该期及未来数据。</section></div></template>
<style scoped>.view{display:grid;gap:1.25rem}header{display:flex;justify-content:space-between;align-items:center;gap:1rem}.eyebrow{margin:0;color:var(--ink-muted);font-size:.67rem;font-weight:800;letter-spacing:.1em}h1{margin:.3rem 0;font-size:1.55rem}p:not(.eyebrow){margin:0;color:var(--ink-soft);font-size:.85rem}.card{border:1px solid var(--line);border-radius:.9rem;padding:1.1rem;background:var(--surface);box-shadow:var(--card-shadow)}.controls{display:flex;align-items:end;gap:.8rem}.controls label{display:grid;gap:.3rem;color:var(--ink-soft);font-size:.78rem;font-weight:650}.controls select{min-height:2.75rem;border:1px solid var(--line);border-radius:.5rem;padding:.55rem;background:var(--surface);font:inherit}.controls button{min-height:2.75rem;border:0;border-radius:.55rem;padding:.65rem .85rem;background:var(--accent);color:var(--accent-on);font:inherit;font-weight:700;cursor:pointer}.controls .cancel{background:var(--danger-surface);color:var(--danger);border:1px solid var(--danger-line)}.progress-card{display:grid;gap:.7rem}.progress-card>div{display:flex;justify-content:space-between;gap:1rem}.progress-card span,.progress-card small{color:var(--ink-muted);font-size:.75rem}.progress-card progress{width:100%;height:.7rem;accent-color:var(--ball-primary)}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:.8rem}.summary article{padding:.8rem;border-radius:.7rem;background:var(--surface-muted)}.summary span,.summary small{display:block;color:var(--ink-muted);font-size:.72rem}.summary strong{display:block;margin:.35rem 0;font-size:1.45rem}.notice{margin:1rem 0 0!important;padding:.7rem;border-left:3px solid var(--warning-line);background:var(--warning-surface);color:var(--warning)!important;font-size:.78rem!important}.empty{color:var(--ink-soft);font-size:.85rem}.error{margin:0;padding:.7rem .9rem;border:1px solid var(--danger-line);border-radius:.6rem;background:var(--danger-surface);color:var(--danger);font-size:.8rem}@media(max-width:800px){header{align-items:flex-start;flex-direction:column}.summary{grid-template-columns:1fr}.controls{align-items:stretch;flex-direction:column}.controls button,.controls select{width:100%}.progress-card>div{display:grid;gap:.2rem}}</style>
