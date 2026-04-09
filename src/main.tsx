import { h, render } from 'preact';
import { App } from './app';
import './styles/theme.css';
import './styles/global.css';

// Register service worker (PWA)
if ('serviceWorker' in navigator) {
  // vite-plugin-pwa handles SW registration via virtual:pwa-register
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  }).catch(() => {
    // Ignore if PWA not configured
  });
}

// Mount app
const root = document.getElementById('app');
if (root) {
  render(h(App, {}), root);
}
