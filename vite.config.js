const { defineConfig } = require('vite');
const path = require('node:path');

module.exports = defineConfig({
  root: path.join(__dirname, 'client'),
  publicDir: path.join(__dirname, 'client/public'),
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:3000' }
  },
  build: {
    outDir: path.join(__dirname, 'public/build'),
    emptyOutDir: true
  }
});
