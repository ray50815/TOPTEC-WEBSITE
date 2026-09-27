import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number.parseInt(process.env.PORT || '4173', 10);
const HOST = process.env.HOST || '127.0.0.1';

async function readGlobalDeployHeaders() {
  try {
    const source = await readFile(path.join(DIST, '_headers'), 'utf8');
    const headers = {};
    let inGlobalBlock = false;
    for (const line of source.split(/\r?\n/)) {
      if (line && !/^\s/.test(line)) {
        inGlobalBlock = line.trim() === '/*';
        continue;
      }
      if (!inGlobalBlock || !line.trim()) continue;
      const separator = line.indexOf(':');
      if (separator === -1) continue;
      headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
    return headers;
  } catch {
    return {};
  }
}

const GLOBAL_DEPLOY_HEADERS = await readGlobalDeployHeaders();
// Read exact redirects from the deployment artifact for faithful local previews.
const EXACT_REDIRECTS = new Map((await readFile(path.join(DIST, '_redirects'), 'utf8'))
  .split(/\r?\n/)
  .map(line => line.trim().split(/\s+/))
  .filter(([source, , status]) => source && !source.includes('*') && status === '301!')
  .map(([source, target]) => [source, target]));

const MIME = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.xml', 'application/xml; charset=utf-8']
]);

const GONE = [
  /^\/graphify-out(?:\/|$)/,
  /^\/scripts(?:\/|$)/,
  /^\/(?:README|OPERATIONS_RUNBOOK)\.md$/i,
  /^\/assets\/img\/favicon_Toptec\.zip$/i
];

function responsePath(urlPath) {
  if (urlPath === '/') return 'index.html';
  if (urlPath === '/zh-hant' || urlPath === '/zh-hant/') return 'zh-hant/index.html';
  const clean = urlPath.replace(/^\/+/, '').replace(/\/$/, '');
  if (path.posix.extname(clean)) return clean;
  return `${clean}.html`;
}

async function sendFile(request, response, relative, statusCode = 200) {
  const absolute = path.resolve(DIST, relative);
  if (absolute !== DIST && !absolute.startsWith(`${DIST}${path.sep}`)) {
    response.writeHead(400).end('Bad request');
    return;
  }
  try {
    const fileStat = await stat(absolute);
    if (!fileStat.isFile()) throw new Error('not a file');
    const extension = path.extname(absolute).toLowerCase();
    const cacheControl = /[.-][a-f0-9]{12}\.(?:css|js)$/i.test(relative)
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=0, must-revalidate';
    response.writeHead(statusCode, {
      ...GLOBAL_DEPLOY_HEADERS,
      'Cache-Control': cacheControl,
      'Content-Length': fileStat.size,
      'Content-Type': MIME.get(extension) || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    if (request.method === 'HEAD') {
      response.end();
    } else {
      createReadStream(absolute).pipe(response);
    }
  } catch {
    if (relative !== '404.html') {
      await sendFile(request, response, '404.html', 404);
    } else {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    }
  }
}

const server = http.createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  if (GONE.some((pattern) => pattern.test(pathname))) {
    await sendFile(request, response, '404.html', 410);
    return;
  }
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(501, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('This local static preview does not process form submissions.');
    return;
  }
  if (EXACT_REDIRECTS.has(pathname)) {
    const query = new URL(request.url, 'http://localhost').search;
    response.writeHead(301, { ...GLOBAL_DEPLOY_HEADERS, Location: EXACT_REDIRECTS.get(pathname) + query }).end();
    return;
  }
  await sendFile(request, response, responsePath(pathname));
});

server.listen(PORT, HOST, () => {
  console.log(`[serve] http://${HOST}:${PORT}`);
});
