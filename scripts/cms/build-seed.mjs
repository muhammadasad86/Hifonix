// npm run cms:seed — regenerate supabase/seed.sql (product rows) from the bundled sample catalogue.
import * as esbuild from 'esbuild';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const out = path.join(os.tmpdir(), 'hf-seed.cjs');
await esbuild.build({ entryPoints: ['scripts/cms/seed.ts'], bundle: true, platform: 'node', outfile: out, format: 'cjs', logLevel: 'warning', define: { 'import.meta.env': '{}' } });
fs.writeFileSync('supabase/seed.sql', execFileSync(process.execPath, [out]).toString());
console.log('supabase/seed.sql written');
