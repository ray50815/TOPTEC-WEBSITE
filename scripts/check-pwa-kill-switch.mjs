import { spawn } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

function runNode(script, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: ROOT,
      env,
      stdio: 'inherit'
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
  });
}

async function htmlFiles(directory, prefix = '') {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) results.push(...await htmlFiles(path.join(directory, entry.name), relative));
    else if (entry.name.endsWith('.html')) results.push(relative);
  }
  return results;
}

let drillError = null;
try {
  await runNode('scripts/build-site.mjs', { ...process.env, PWA_KILL_SWITCH: 'true' });
  const pages = await htmlFiles(DIST);
  for (const page of pages) {
    const html = await readFile(path.join(DIST, page), 'utf8');
    if (!/<meta name="toptec-pwa-enabled" content="false">/i.test(html)) {
      throw new Error(`${page} does not carry the disabled PWA control`);
    }
  }

  const mainSource = await readFile(path.join(ROOT, 'assets/js/main.js'), 'utf8');
  const installSource = await readFile(path.join(ROOT, 'assets/js/app-install.js'), 'utf8');
  const workerSource = await readFile(path.join(ROOT, 'sw.js'), 'utf8');
  for (const [file, source, marker] of [
    ['assets/js/main.js', mainSource, "name.startsWith('toptec-')"],
    ['assets/js/app-install.js', installSource, 'if (!pwaEnabled)'],
    ['sw.js', workerSource, 'TOPTEC_PWA_KILL_SWITCH']
  ]) {
    if (!source.includes(marker)) throw new Error(`${file} lacks kill-switch marker ${marker}`);
  }
  console.log(`[pwa-kill] disabled control validated across ${pages.length} HTML documents`);
} catch (error) {
  drillError = error;
} finally {
  // Always leave dist in its normal deploy-preview state.
  await runNode('scripts/build-site.mjs', { ...process.env, PWA_KILL_SWITCH: 'false' });
  await runNode('scripts/check-site.mjs', { ...process.env, PWA_KILL_SWITCH: 'false' });
}

if (drillError) throw drillError;
