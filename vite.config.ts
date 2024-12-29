import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const conditionalPlugins = [];

if (process.env.TEMPO) {
  conditionalPlugins.push('tempo-devtools/dist/babel-plugin');
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [...conditionalPlugins]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
