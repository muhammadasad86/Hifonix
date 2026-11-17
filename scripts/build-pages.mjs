#!/usr/bin/env node
/**
 * GitHub Pages showcase build → dist/ (publish dist/ to the `gh-pages` branch).
 *
 *   npm run build:pages              # served at https://<user>.github.io/Hifonix/
 *   BASE_PATH=Other npm run build:pages
 *
 * - VITE_SHOWCASE=1: no CMS sign-in route, forms submit nothing, no data services.
 * - Labels the build as a design preview (title, description, noindex).
 * - Adds the SPA fallback (404.html), .nojekyll and robots.txt.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const env = { ...process.env, BASE_PATH: process.env.BASE_PATH || 'Hifonix', VITE_SHOWCASE: '1' };
for (const args of [['tsc', '-b'], ['vite', 'build']]) {
  const r = spawnSync('npx', args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const file = 'dist/index.html';
let html = readFileSync(file, 'utf8');
const replace = (re, to) => {
  if (!re.test(html)) throw new Error(`build-pages: pattern not found in index.html: ${re}`);
  html = html.replace(re, to);
};
replace(/<title>[^<]*<\/title>/, '<title>Hifonix — Design Preview</title>');
replace(
  /<meta name="description" content="[^"]*" \/>/,
  '<meta name="description" content="Design preview of the Hifonix website, built by Folio3 for client review. Not the official Hifonix store: nothing is sold and no personal details are collected." />',
);
replace(/(<meta name="viewport"[^>]*>)/, '$1\n    <meta name="robots" content="noindex, nofollow" />');
writeFileSync(file, html);
copyFileSync(file, 'dist/404.html');
writeFileSync('dist/.nojekyll', '');
writeFileSync('dist/robots.txt', 'User-agent: *\nDisallow: /\n');
console.log(`build-pages: dist/ ready for gh-pages (base /${env.BASE_PATH}/, showcase mode)`);
