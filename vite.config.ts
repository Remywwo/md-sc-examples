import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 部署在 /md-sc-website/ 路径下，本地开发用 /
const base = process.env.GITHUB_PAGES === 'true' ? '/md-sc-website/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5175,
    open: false,
  },
  build: {
    target: 'es2020',
    outDir: 'docs',
  },
});
