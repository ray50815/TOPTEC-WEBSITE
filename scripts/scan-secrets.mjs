import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.lighthouseci',
  '.tmp',
  'dist',
  'graphify-out',
  'node_modules',
  'playwright-report',
  'test-results'
]);
const TEXT_EXTENSIONS = new Set([
  '', '.cjs', '.css', '.gitignore', '.html', '.js', '.json', '.md', '.mjs',
  '.toml', '.txt', '.webmanifest', '.xml', '.yaml', '.yml'
]);
const MAX_TEXT_BYTES = 2 * 1024 * 1024;

const DETECTORS = [
  ['private key', /-----BEGIN (?:EC |OPENSSH |PGP |RSA )?PRIVATE KEY-----/],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Slack token', /\bxox[baprs]-[0-9A-Za-z-]{20,}\b/],
  ['Stripe live key', /\b(?:sk|rk)_live_[0-9A-Za-z]{20,}\b/],
  ['npm access token', /\bnpm_[A-Za-z0-9]{36}\b/],
  ['Netlify access token', /\bntl_[A-Za-z0-9_-]{30,}\b/]
];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

const findings = [];
let scanned = 0;
for (const file of await walk(ROOT)) {
  const extension = path.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(extension)) continue;
  const fileStat = await stat(file);
  if (fileStat.size > MAX_TEXT_BYTES) continue;
  const content = await readFile(file, 'utf8');
  scanned += 1;
  for (const [name, pattern] of DETECTORS) {
    if (pattern.test(content)) {
      findings.push(`${path.relative(ROOT, file)}: ${name}`);
    }
  }
}

if (findings.length) {
  console.error(`[secret-scan] ${findings.length} high-confidence finding(s):`);
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exitCode = 1;
} else {
  console.log(`[secret-scan] ${scanned} text files scanned; no high-confidence secrets detected`);
}
