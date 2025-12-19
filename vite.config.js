import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl';
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [ 
    basicSsl(),
    svelte({
      compilerOptions: {
        compatibility: {
          componentApi: 4
        }
      }
    })],
  server: {
    https: true // Enables the HTTPS server
  }
})
