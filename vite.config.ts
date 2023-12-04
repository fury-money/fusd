import reactRefresh from '@vitejs/plugin-react-refresh';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import * as path from 'path';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      'styled-components':
        'styled-components/dist/styled-components.browser.esm.js',
      'process': path.resolve(__dirname, 'src/polyfills/process-es6.js'),
      'readable-stream': 'vite-compatible-readable-stream/readable-browser.js',
    },
  },
  plugins: [viteCommonjs(), reactRefresh(), tsconfigPaths(), svgr()],
  build: {
    sourcemap: true,
    outDir: 'build',
  },
});
