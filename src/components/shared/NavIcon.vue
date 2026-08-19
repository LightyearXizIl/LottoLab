<script setup lang="ts">
defineProps<{ name: 'lab' | 'analysis' | 'backtest' | 'history' | 'saved' | 'settings' | 'my' }>()
</script>

<template>
  <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
    <template v-if="name === 'lab'"><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></template>
    <template v-else-if="name === 'analysis'"><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 2 4-6" /></template>
    <template v-else-if="name === 'backtest'"><path d="M4 7h12M12 3l4 4-4 4" /><path d="M20 17H8M12 13l-4 4 4 4" /></template>
    <template v-else-if="name === 'history'"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 2v4M16 2v4M7 10h10M8 14h3M8 17h6" /></template>
    <template v-else-if="name === 'saved'"><path d="m12 20-7-6.4A4.3 4.3 0 0 1 11 7.4L12 8.5l1-1.1a4.3 4.3 0 0 1 6 6.2Z" /></template>
    <template v-else-if="name === 'settings'"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-3h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L8.4 6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V4.7h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.2 1Z" /></template>
    <template v-else><circle cx="12" cy="8" r="3.2" /><path d="M5 21a7 7 0 0 1 14 0" /></template>
  </svg>
</template>

<style scoped>
.nav-icon { width: 1.25rem; height: 1.25rem; }
</style>
