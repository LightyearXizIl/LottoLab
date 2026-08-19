<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import GameSwitcher from '../components/research/GameSwitcher.vue'
import RecommendationGrid from '../components/research/RecommendationGrid.vue'
import StrategyPanel from '../components/research/StrategyPanel.vue'
import { useLottoLab } from '../composables/useLottoLab'
import { copyRecommendationRun, exportRecommendationCsv } from '../services/platform'

const lab = useLottoLab()
const gameModel = computed({ get: () => lab.game.value, set: value => void lab.selectGame(value) })
const actionMessage = shallowRef('')
async function copy() {
  if (!lab.run.value) return
  try { await copyRecommendationRun(lab.run.value); actionMessage.value = '已复制本次研究号码。' }
  catch (reason) { lab.reportError(`复制失败：${reason instanceof Error ? reason.message : String(reason)}`) }
}
async function exportCsv() {
  if (!lab.run.value) return
  try {
    const path = await exportRecommendationCsv(lab.run.value)
    if (path) actionMessage.value = 'CSV 已保存。'
  } catch (reason) { lab.reportError(`导出失败：${reason instanceof Error ? reason.message : String(reason)}`) }
}
</script>

<template>
  <div class="lab-view"><header class="view-header"><div><p class="eyebrow">LOTTERY RESEARCH LAB</p><h1>研究号码，而非承诺预测</h1><p>以历史开奖记录为样本，生成五组差异化候选；每一注合法组合的理论头奖概率相同。</p></div><GameSwitcher v-model="gameModel" /></header><p v-if="lab.error.value" class="error">{{ lab.error.value }}</p><p v-if="actionMessage" class="success" role="status">{{ actionMessage }}</p><div class="workspace"><StrategyPanel :game="lab.game.value" :strategy="lab.strategy.value" :filters="lab.filters.value" :busy="lab.generating.value" @update:strategy="lab.strategy.value = $event" @update:filters="lab.filters.value = $event" @generate="lab.generate()" @sync="lab.synchronize()" /><RecommendationGrid :run="lab.run.value" :busy="lab.generating.value" :primary-name="lab.rule.value.primaryName" :secondary-name="lab.rule.value.secondaryName" :score-label="lab.scoreLabel.value" @regenerate="lab.generate()" @save="lab.saveCurrentRun()" @copy="copy" @export="exportCsv" /></div></div>
</template>

<style scoped>
.lab-view { display: grid; gap: 1.25rem; }.view-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }.eyebrow { margin: 0; font-size: .67rem; color: var(--ink-muted); letter-spacing: .1em; font-weight: 800; }.view-header h1 { margin: .35rem 0; font-size: clamp(1.35rem, 2vw, 1.8rem); letter-spacing: -.035em; }.view-header p:not(.eyebrow) { max-width: 45rem; margin: 0; color: var(--ink-soft); font-size: .86rem; line-height: 1.6; }.workspace { display: grid; grid-template-columns: 18rem minmax(0, 1fr); gap: 1rem; align-items: start; }.error,.success { margin: 0; padding: .7rem .9rem; border-radius: .6rem; font-size: .8rem; }.error { border: 1px solid var(--danger-line); background: var(--danger-surface); color: var(--danger); }.success { border: 1px solid var(--success-line); background: var(--success-surface); color: var(--success); } @media (max-width: 1100px) { .workspace { grid-template-columns: 1fr; }.view-header { align-items: flex-start; flex-direction: column; } }
</style>
