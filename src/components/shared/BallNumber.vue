<script setup lang="ts">
withDefaults(defineProps<{ number: number, tone: 'primary' | 'secondary', compact?: boolean }>(), { compact: false })
</script>

<template>
  <span class="ball" :class="[`ball--${tone}`, { 'ball--compact': compact }]">{{ String(number).padStart(2, '0') }}</span>
</template>

<style scoped>
.ball { display: inline-grid; width: 2.2rem; height: 2.2rem; place-items: center; border-radius: 999px; color: var(--ball-on); font-weight: 750; font-variant-numeric: tabular-nums; box-shadow: inset 0 -2px 0 rgb(0 0 0 / 16%), 0 4px 10px rgb(15 23 42 / 9%); }
.ball--primary { background: var(--ball-primary); }
.ball--secondary { background: var(--ball-secondary); }
.ball--compact { width: 1.7rem; height: 1.7rem; font-size: .75rem; }
</style>
