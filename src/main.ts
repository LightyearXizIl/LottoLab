import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/main.css'
import { initializeTheme } from './services/theme'

initializeTheme()
createApp(App).use(createPinia()).mount('#app')
