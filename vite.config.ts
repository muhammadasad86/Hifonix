import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Deploy base. "/" for Vercel / root hosting (default); set BASE_PATH for a
 * sub-path host, e.g. GitHub Pages: BASE_PATH=/Hifonix/ npm run build.
 */
const BASE_PATH = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.BASE_PATH;
const base = BASE_PATH ? `/${BASE_PATH.replace(/^\/|\/$/g, '')}/` : '/';

/**
 * Public-folder assets are referenced by absolute paths in code and CSS
 * ('/hifi/…', '/shop/brands/…'). On a sub-path host those paths are prefixed
 * with the base after bundling. Route paths (/splash, /shop/:department …)
 * are untouched — the router adds the base itself.
 */
const ASSET_DIRS = '(?:hifi|info|fonts|models|textures|audio|shop/(?:brands|cat|icons|products|swatch|ui))(?=[/\'"`)])|(?:headphones|splash)(?=/)';
const prefixPublicAssets = (prefix: string): Plugin => ({
  name: 'prefix-public-assets',
  apply: 'build',
  generateBundle(_, bundle) {
    const re = new RegExp(`([\'"\`(])/(${ASSET_DIRS})`, 'g');
    for (const file of Object.values(bundle)) {
      if (file.type === 'chunk') file.code = file.code.replace(re, `$1${prefix}$2`);
      else if (file.fileName.endsWith('.css') && typeof file.source === 'string') file.source = file.source.replace(re, `$1${prefix}$2`);
    }
  },
});

export default defineConfig({
  // absolute base so deep routes (e.g. /pages/hi-fi) resolve assets correctly when opened directly
  base,
  plugins: [react(), ...(base !== '/' ? [prefixPublicAssets(base)] : [])],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
