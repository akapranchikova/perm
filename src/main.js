import App from './App.svelte';
//import HawkCatcher from '@hawk.so/javascript'; 
//const hawk = new HawkCatcher({   token: 'eyJpbnRlZ3JhdGlvbklkIjoiM2YyNDY3NTAtODZhNi00MGYwLWE1MmQtZDkzOGFhZDlkMmM3Iiwic2VjcmV0IjoiNjIxMGViOTctMmZmNS00MTlmLWJkM2EtMmE3OGM1ZjJjYjdlIn0=' });
//import { preloadStaticAssets } from './lib/assetPreloader';

//preloadStaticAssets();

const app = new App({
  target: document.getElementById('app')
});

export default app;
