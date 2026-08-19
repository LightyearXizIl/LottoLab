<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { strategyPresets } from '../../domain/strategies'
import type { FilterConfig, GameKind, StrategyConfig } from '../../domain/types'

const props = defineProps<{ game: GameKind, strategy: StrategyConfig, filters: FilterConfig, busy?: boolean }>()
const emit = defineEmits<{ 'update:strategy': [value: StrategyConfig], 'update:filters': [value: FilterConfig], generate: [], sync: [] }>()
const details = ref<HTMLDetailsElement | null>(null)
const weightTotal = computed(() => Object.values(props.strategy.weights).reduce((sum, value) => sum + value, 0))
const rule = computed(() => props.game === 'ssq' ? { primary: 33, secondary: 16, primaryName: '红球', secondaryName: '蓝球' } : { primary: 35, secondary: 12, primaryName: '前区', secondaryName: '后区' })

function choosePreset(id: string) {
  const preset = strategyPresets.find(item => item.id === id)
  if (preset) emit('update:strategy', structuredClone(preset))
}
function setWeight(key: keyof StrategyConfig['weights'], raw: string) { emit('update:strategy', { ...props.strategy, id: 'custom', name: '自定义研究', weights: { ...props.strategy.weights, [key]: Number(raw) || 0 } }) }
function parseNumbers(raw: string, type: keyof FilterConfig) { emit('update:filters', { ...props.filters, [type]: raw.split(/[，,\s]+/).filter(Boolean).map(Number).filter(Number.isFinite) }) }
function setNumeric(key: keyof FilterConfig, raw: string) { emit('update:filters', { ...props.filters, [key]: raw === '' ? undefined : Number(raw) }) }
watch(() => props.busy, busy => {
  if (busy && typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches && details.value) details.value.open = false
})
</script>

<template>
  <aside class="panel">
    <div class="panel-heading"><div><p class="eyebrow">RESEARCH SETUP</p><h2>研究策略</h2></div><button class="sync" type="button" title="同步官方数据" :disabled="busy" @click="emit('sync')">↻ 同步</button></div>
    <details ref="details" class="setup-details" open>
      <summary><span>策略与过滤条件</span><b>{{ strategy.name }}</b></summary>
      <div class="setup-content">
        <label class="field"><span>策略预设</span><select :value="strategy.id" @change="choosePreset(($event.target as HTMLSelectElement).value)"><option v-for="preset in strategyPresets" :key="preset.id" :value="preset.id">{{ preset.name }}</option><option value="custom">自定义研究</option></select></label>
        <div v-if="strategy.id !== 'random'" class="weights"><div class="weight-heading"><span>评分权重</span><b :class="{ warn: weightTotal !== 100 }">{{ weightTotal }}%</b></div><label v-for="(label, key) in { frequency: '多窗口频次', omission: '遗漏典型度', momentum: '近期趋势', cooccurrence: '区域共现', structure: '号码形态' }" :key="key" class="range"><span>{{ label }}</span><input type="range" min="0" max="100" step="5" :value="strategy.weights[key as keyof StrategyConfig['weights']]" @input="setWeight(key as keyof StrategyConfig['weights'], ($event.target as HTMLInputElement).value)"><output>{{ strategy.weights[key as keyof StrategyConfig['weights']] }}%</output></label></div>
        <div class="section"><div class="section-label">硬性过滤</div><label class="field"><span>{{ rule.primaryName }}胆码</span><input :value="filters.includePrimary.join(' ')" :placeholder="`1-${rule.primary}`" @change="parseNumbers(($event.target as HTMLInputElement).value, 'includePrimary')"></label><label class="field"><span>{{ rule.primaryName }}排除</span><input :value="filters.excludePrimary.join(' ')" :placeholder="`1-${rule.primary}`" @change="parseNumbers(($event.target as HTMLInputElement).value, 'excludePrimary')"></label><label class="field"><span>{{ rule.secondaryName }}胆码 / 排除</span><div class="split"><input :value="filters.includeSecondary.join(' ')" :placeholder="`胆码 1-${rule.secondary}`" @change="parseNumbers(($event.target as HTMLInputElement).value, 'includeSecondary')"><input :value="filters.excludeSecondary.join(' ')" placeholder="排除" @change="parseNumbers(($event.target as HTMLInputElement).value, 'excludeSecondary')"></div></label><div class="split"><label class="field"><span>和值下限</span><input type="number" :value="filters.sumMin" @input="setNumeric('sumMin', ($event.target as HTMLInputElement).value)"></label><label class="field"><span>和值上限</span><input type="number" :value="filters.sumMax" @input="setNumeric('sumMax', ($event.target as HTMLInputElement).value)"></label></div><div class="split"><label class="field"><span>最大连号</span><input type="number" min="0" max="5" :value="filters.maxConsecutivePairs" @input="setNumeric('maxConsecutivePairs', ($event.target as HTMLInputElement).value)"></label><label class="field"><span>最大上期重号</span><input type="number" min="0" max="6" :value="filters.maxLastDrawRepeats" @input="setNumeric('maxLastDrawRepeats', ($event.target as HTMLInputElement).value)"></label></div></div>
      </div>
    </details>
    <button class="generate" type="button" :disabled="busy || (strategy.id !== 'random' && weightTotal !== 100)" @click="emit('generate')">{{ busy ? '正在生成研究号码…' : '生成 5 组研究号码' }} <span>{{ busy ? '•••' : '→' }}</span></button>
  </aside>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; gap: 1.05rem; border: 1px solid var(--line); border-radius: 1rem; padding: 1.2rem; background: var(--surface); box-shadow: var(--card-shadow); }
.panel-heading { display: flex; align-items: flex-start; justify-content: space-between; } h2 { margin: .1rem 0 0; font-size: 1.05rem; }.eyebrow,.section-label { margin: 0; font-size: .67rem; font-weight: 800; letter-spacing: .1em; color: var(--ink-muted); }.sync { min-height: 2.75rem; border: 1px solid var(--line); border-radius: .5rem; background:var(--surface); padding: .4rem .65rem; color: var(--ink-soft); cursor: pointer; font: inherit; font-size: .78rem; }.sync:disabled{opacity:.5}.setup-details summary{display:flex;justify-content:space-between;gap:.75rem;min-height:2.75rem;align-items:center;color:var(--ink-soft);font-size:.78rem;font-weight:700;cursor:pointer}.setup-details summary b{color:var(--ink);font-size:.72rem}.setup-content{display:grid;gap:1.05rem;padding-top:.65rem}.field { display: grid; gap: .35rem; color: var(--ink-soft); font-size: .78rem; font-weight: 650; }.field input,.field select { width: 100%; min-height:2.75rem; box-sizing: border-box; border: 1px solid var(--line); border-radius: .5rem; padding: .55rem .6rem; color: var(--ink); background: var(--surface); font: inherit; }.weights,.section { display: grid; gap: .7rem; padding-top: .95rem; border-top: 1px solid var(--line); }.weight-heading { display: flex; justify-content: space-between; font-size: .78rem; color: var(--ink-soft); }.weight-heading b { color: var(--success); }.weight-heading b.warn { color: var(--warning); }.range { display: grid; grid-template-columns: 5.5rem 1fr 2.3rem; align-items: center; gap: .5rem; min-height:2.75rem;font-size: .72rem; color: var(--ink-soft); }.range input { accent-color: var(--ball-primary); }.range output { text-align: right; font-variant-numeric: tabular-nums; }.split { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; }.generate { display: flex; min-height:2.9rem; justify-content: space-between; align-items: center; border: 0; border-radius: .65rem; padding: .78rem .85rem; background: var(--accent); color: var(--accent-on); cursor: pointer; font: inherit; font-weight: 750; box-shadow: none; }.generate:disabled { cursor: not-allowed; opacity: .55; }
@media(max-width:767px){.panel{padding:1rem}.generate{position:sticky;bottom:calc(5.2rem + env(safe-area-inset-bottom));z-index:3;box-shadow: var(--card-shadow)}.range{grid-template-columns:5rem 1fr 2.1rem}.split{grid-template-columns:1fr 1fr}}
</style>
