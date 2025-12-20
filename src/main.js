import App from './App.svelte';
import { preloadStaticAssets } from './lib/assetPreloader';

preloadStaticAssets();

const app = new App({
  target: document.getElementById('app')
});

export default app;
