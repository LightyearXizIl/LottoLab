<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import BallNumber from '../components/shared/BallNumber.vue'
import type { RecommendationRun } from '../domain/types'
import { listSavedRuns } from '../services/lottolab'

const saved = shallowRef<RecommendationRun[]>([])
const message = shallowRef('')

async function load() {
  try {
    const rows = await listSavedRuns()
    saved.value = rows.flatMap(row => {
      try { return [JSON.parse(row) as RecommendationRun] }
      catch { return [] }
    })
    message.value = saved.value.length ? `已读取 ${saved.value.length} 条本地收藏。` : ''
  } catch (reason) {
    message.value = `读取收藏失败：${reason instanceof Error ? reason.message : String(reason)}`
  }
}

onMounted(load)
</script>

<template>
  <div class="view">
    <header><p class="eyebrow">REPRODUCIBLE RESEARCH</p><h1>收藏与预设</h1><p>每个已保存批次都保留数据截止期、策略、过滤器和随机种子，便于复现。</p></header>
    <section class="card">
      <div v-if="saved.length" class="saved">
        <article v-for="run in saved" :key="run.id">
          <div class="saved-head"><div><strong>{{ run.game === 'ssq' ? '双色球' : '大乐透' }} · {{ run.cutoffIssue }}</strong><span>{{ run.strategy.name }} · {{ new Date(run.createdAt).toLocaleString('zh-CN') }}</span></div><small>模型 {{ run.algorithmVersion }}</small></div>
          <div class="sets"><div v-for="(item,index) in run.recommendations" :key="`${run.id}-${index}`"><b>{{ index + 1 }}</b><span class="balls"><BallNumber v-for="number in item.primaryNumbers" :key="`p-${number}`" :number="number" tone="primary" compact /><BallNumber v-for="number in item.secondaryNumbers" :key="`s-${number}`" :number="number" tone="secondary" compact /></span></div></div>
          <small class="seed">随机种子：{{ run.seed }}</small>
        </article>
      </div>
      <div v-else class="empty"><strong>还没有收藏结果</strong><span>在“选号实验室”生成后使用“保存结果”。</span></div>
      <button type="button" @click="load">刷新本地收藏</button>
      <p v-if="message" class="message" role="status">{{ message }}</p>
    </section>
  </div>
</template>

<style scoped>
.view{display:grid;gap:1.25rem}.eyebrow{margin:0;color:var(--ink-muted);font-size:.67rem;font-weight:800;letter-spacing:.1em}h1{margin:.3rem 0;font-size:1.55rem}p:not(.eyebrow){margin:0;color:var(--ink-soft);font-size:.85rem}.card{border:1px solid var(--line);border-radius:.9rem;padding:1.1rem;background:var(--surface);box-shadow:var(--card-shadow)}.empty{display:grid;gap:.35rem;place-items:center;padding:3.5rem;color:var(--ink-soft);font-size:.85rem;text-align:center}.empty strong{color:var(--ink);font-size:1rem}.saved{display:grid;gap:.75rem}.saved article{display:grid;gap:.8rem;overflow:hidden;border:1px solid var(--line);border-radius:.7rem;padding:.85rem;background:var(--surface-muted)}.saved-head{display:flex;justify-content:space-between;gap:1rem}.saved-head strong,.saved-head span{display:block}.saved-head strong{font-size:.88rem}.saved-head span,.saved-head small,.seed{margin-top:.2rem;color:var(--ink-muted);font-size:.68rem}.sets{display:grid;gap:.5rem}.sets>div{display:flex;align-items:center;gap:.6rem}.sets b{display:grid;width:1.5rem;height:1.5rem;place-items:center;border-radius:99px;background:var(--surface-selected);color:var(--ink-soft);font-size:.68rem}.balls{display:flex;flex-wrap:wrap;gap:.25rem}.seed{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}button{min-height:2.75rem;margin-top:1rem;border:1px solid var(--line);border-radius:.5rem;padding:.55rem .7rem;background:var(--surface);color:var(--ink-soft);font:inherit;cursor:pointer}.message{margin-top:.7rem!important;color:var(--success)!important;font-size:.76rem!important}@media(max-width:600px){.card{padding:.9rem}.saved-head{display:grid;gap:.2rem}.sets>div{align-items:flex-start}.empty{padding:2.5rem 1rem}}
</style>
