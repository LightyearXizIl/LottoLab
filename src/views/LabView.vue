<script setup lang="ts">
import { computed } from 'vue'
import GameSwitcher from '../components/research/GameSwitcher.vue'
import RecommendationGrid from '../components/research/RecommendationGrid.vue'
import StrategyPanel from '../components/research/StrategyPanel.vue'
import { useLottoLab } from '../composables/useLottoLab'

const lab = useLottoLab()
const gameModel = computed({ get: () => lab.game.value, set: value => void lab.selectGame(value) })
async function copy() { if (lab.run.value) await navigator.clipboard.writeText(lab.run.value.recommendations.map((item, index) => `${index + 1}. ${item.primaryNumbers.map(number => String(number).padStart(2, '0')).join(' ')} + ${item.secondaryNumbers.map(number => String(number).padStart(2, '0')).join(' ')}`).join('\n')) }
function exportCsv() { if (!lab.run.value) return; const body = ['group,primary_numbers,secondary_numbers,score', ...lab.run.value.recommendations.map((item, index) => `${index + 1},"${item.primaryNumbers.join(' ')}","${item.secondaryNumbers.join(' ')}",${item.score ?? ''}`)].join('\n'); const url = URL.createObjectURL(new Blob([body], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `LottoLab-${lab.run.value.game}-${lab.run.value.cutoffIssue}.csv`; link.click(); URL.revokeObjectURL(url) }
</script>

<template>
  <div class="lab-view"><header class="view-header"><div><p class="eyebrow">LOTTERY RESEARCH LAB</p><h1>研究号码，而非承诺预测</h1><p>以历史开奖记录为样本，生成五组差异化候选；每一注合法组合的理论头奖概率相同。</p></div><GameSwitcher v-model="gameModel" /></header><p v-if="lab.error.value" class="error">{{ lab.error.value }}</p><div class="workspace"><StrategyPanel :game="lab.game.value" :strategy="lab.strategy.value" :filters="lab.filters.value" @update:strategy="lab.strategy.value = $event" @update:filters="lab.filters.value = $event" @generate="lab.generate()" @sync="lab.synchronize()" /><RecommendationGrid :run="lab.run.value" :primary-name="lab.rule.value.primaryName" :secondary-name="lab.rule.value.secondaryName" :score-label="lab.scoreLabel.value" @regenerate="lab.generate()" @save="lab.saveCurrentRun()" @copy="copy" @export="exportCsv" /></div></div>
</template>

<style scoped>
.lab-view { display: grid; gap: 1.25rem; }.view-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }.eyebrow { margin: 0; font-size: .67rem; color: var(--ink-muted); letter-spacing: .1em; font-weight: 800; }.view-header h1 { margin: .35rem 0; font-size: clamp(1.35rem, 2vw, 1.8rem); letter-spacing: -.035em; }.view-header p:not(.eyebrow) { max-width: 45rem; margin: 0; color: var(--ink-soft); font-size: .86rem; line-height: 1.6; }.workspace { display: grid; grid-template-columns: 18rem minmax(0, 1fr); gap: 1rem; align-items: start; }.error { margin: 0; padding: .7rem .9rem; border: 1px solid #f3c4c9; border-radius: .6rem; background: #fff1f2; color: #a61c36; font-size: .8rem; } @media (max-width: 1100px) { .workspace { grid-template-columns: 1fr; }.view-header { align-items: flex-start; flex-direction: column; } }
</style>
