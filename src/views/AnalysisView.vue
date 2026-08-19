<script setup lang="ts">
import { computed } from 'vue'
import AnalyticsPanel from '../components/analytics/AnalyticsPanel.vue'
import GameSwitcher from '../components/research/GameSwitcher.vue'
import { useLottoLab } from '../composables/useLottoLab'
const lab = useLottoLab()
const gameModel = computed({ get: () => lab.game.value, set: value => void lab.selectGame(value) })
</script>
<template><div class="view"><header><div><p class="eyebrow">HISTORICAL SNAPSHOT</p><h1>数据分析</h1><p>图表只描述已开奖记录的频率和形态，不提供真实中奖概率判断。</p></div><GameSwitcher v-model="gameModel" /></header><AnalyticsPanel :game="lab.game.value" :draws="lab.draws.value" /></div></template>
<style scoped>.view{display:grid;min-width:0;gap:1.25rem}header{display:flex;justify-content:space-between;align-items:center;gap:1rem}.eyebrow{margin:0;color:var(--ink-muted);font-size:.67rem;font-weight:800;letter-spacing:.1em}h1{margin:.3rem 0;font-size:1.55rem}p:not(.eyebrow){margin:0;color:var(--ink-soft);font-size:.85rem}@media(max-width:800px){header{align-items:flex-start;flex-direction:column}}</style>
