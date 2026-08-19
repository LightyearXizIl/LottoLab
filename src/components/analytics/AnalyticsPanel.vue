<script setup lang="ts">
import { computed } from 'vue'
import BallNumber from '../shared/BallNumber.vue'
import type { DrawRecord, GameKind } from '../../domain/types'

const props = defineProps<{ game: GameKind, draws: DrawRecord[] }>()
const rule = computed(() => props.game === 'ssq' ? { max: 33, name: '红球' } : { max: 35, name: '前区' })
const frequencies = computed(() => Array.from({ length: rule.value.max }, (_, index) => ({ number: index + 1, count: props.draws.slice(0, 100).filter(draw => draw.primaryNumbers.includes(index + 1)).length })).sort((left, right) => right.count - left.count))
const top = computed(() => frequencies.value.slice(0, 8))
const averageSum = computed(() => props.draws.length ? Math.round(props.draws.slice(0, 100).reduce((sum, draw) => sum + draw.primaryNumbers.reduce((subtotal, number) => subtotal + number, 0), 0) / Math.min(100, props.draws.length)) : 0)
const oddBalance = computed(() => props.draws.length ? (props.draws.slice(0, 100).reduce((sum, draw) => sum + draw.primaryNumbers.filter(number => number % 2).length, 0) / Math.min(100, props.draws.length)).toFixed(1) : '0')
</script>

<template>
  <div class="analytics">
    <section class="metrics"><article><span>近100期样本</span><strong>{{ Math.min(100, draws.length) }}</strong><small>当前本地可用记录</small></article><article><span>平均{{ rule.name }}和值</span><strong>{{ averageSum }}</strong><small>仅作历史描述</small></article><article><span>平均奇数个数</span><strong>{{ oddBalance }}</strong><small>不构成选号建议</small></article></section>
    <section class="analysis-card"><div class="card-title"><div><p class="eyebrow">FREQUENCY SNAPSHOT</p><h2>近100期{{ rule.name }}出现频次</h2></div><small class="scroll-hint">左右滑动查看全部</small></div><div class="frequency"><div v-for="item in frequencies" :key="item.number" class="frequency-item" :style="{ '--height': `${Math.max(8, item.count / Math.max(1, top[0]?.count) * 100)}%` }"><span>{{ item.count }}</span><i></i><b>{{ String(item.number).padStart(2, '0') }}</b></div></div></section>
    <section class="analysis-card top-numbers"><div><p class="eyebrow">MOST FREQUENT</p><h2>本窗口高频号码</h2></div><div><div v-for="item in top" :key="item.number" class="top-row"><BallNumber :number="item.number" tone="primary" compact /><span>出现 {{ item.count }} 次</span><i :style="{ width: `${item.count / Math.max(1, top[0]?.count) * 100}%` }"></i></div></div></section>
  </div>
</template>

<style scoped>
.analytics{display:grid;min-width:0;gap:1rem}.metrics{display:grid;min-width:0;grid-template-columns:repeat(3,1fr);gap:.8rem}.metrics article,.analysis-card{min-width:0;border:1px solid var(--line);border-radius:.9rem;padding:1.1rem;background:var(--surface);box-shadow:var(--card-shadow)}.metrics span,.metrics small{display:block;color:var(--ink-muted);font-size:.72rem}.metrics strong{display:block;margin:.35rem 0;color:var(--ink);font-size:1.5rem;font-variant-numeric:tabular-nums}.eyebrow{margin:0;color:var(--ink-muted);font-size:.67rem;font-weight:800;letter-spacing:.1em}.card-title{display:flex;justify-content:space-between;gap:1rem}.scroll-hint{display:none;color:var(--ink-muted);font-size:.68rem}.analysis-card h2{margin:.25rem 0 1rem;font-size:1rem}.frequency{display:flex;align-items:end;width:100%;min-width:0;height:10rem;gap:.18rem;overflow-x:auto;overflow-y:hidden;overscroll-behavior-inline:contain;padding-bottom:.35rem;scrollbar-width:thin}.frequency-item{display:grid;flex:1;min-width:.7rem;height:100%;align-items:end;justify-items:center;gap:.25rem}.frequency-item i{display:block;width:100%;height:var(--height);border-radius:.16rem .16rem 0 0;background:var(--ball-primary)}.frequency-item span,.frequency-item b{color:var(--ink-muted);font-size:.55rem}.frequency-item b{transform:rotate(-60deg);transform-origin:center}.top-numbers{display:grid;min-width:0;grid-template-columns:14rem 1fr;gap:1rem}.top-row{display:grid;min-width:0;grid-template-columns:2rem 5rem minmax(0,1fr);align-items:center;gap:.6rem;margin-bottom:.5rem;color:var(--ink-soft);font-size:.75rem}.top-row i{display:block;max-width:100%;height:.42rem;border-radius:99px;background:var(--ball-primary)}@media(max-width:900px){.top-numbers{grid-template-columns:1fr}}@media(max-width:767px){.analysis-card,.metrics article{padding:1rem}.metrics{grid-template-columns:repeat(3,minmax(0,1fr));gap:.45rem}.metrics article{padding:.75rem}.metrics strong{font-size:1.2rem}.metrics small{display:none}.frequency-item{flex:0 0 1rem;min-width:1rem}.frequency{height:11rem}.scroll-hint{display:block;white-space:nowrap}}
</style>
