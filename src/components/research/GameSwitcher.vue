<script setup lang="ts">
import type { GameKind } from '../../domain/types'
defineProps<{ modelValue: GameKind }>()
const emit = defineEmits<{ 'update:modelValue': [value: GameKind] }>()
</script>

<template>
  <div class="switcher" role="group" aria-label="选择彩种">
    <button type="button" :class="{ active: modelValue === 'ssq' }" @click="emit('update:modelValue', 'ssq')">双色球</button>
    <button type="button" :class="{ active: modelValue === 'dlt' }" @click="emit('update:modelValue', 'dlt')">大乐透</button>
  </div>
</template>

<style scoped>
.switcher { display: inline-flex; gap: .2rem; padding: .25rem; border: 1px solid var(--line); border-radius: .7rem; background: var(--surface-muted); }
  button { min-height:2.75rem;border: 0; border-radius: .45rem; padding: .55rem .9rem; background: transparent; color: var(--ink-soft); cursor: pointer; font: inherit; font-weight: 650; }
button.active { background: var(--surface); color: var(--ink); box-shadow: 0 1px 4px rgb(15 23 42 / 10%); }
</style>
