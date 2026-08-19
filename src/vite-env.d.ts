/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface Window {
  LottoLabAndroid?: {
    setTheme: (theme: 'system' | 'light' | 'dark') => void
  }
}
