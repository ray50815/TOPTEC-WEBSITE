(function () {
  const ACCESS_STORAGE_KEY = 'toptec-toolkit-access';
  const ACCESS_HASH = '225db660eb967a2f8b04e9380faea8d699d0f6ce64aba32559b4999cd3f24aef';

  const API_KEY_STORAGE_KEY = 'toptec-translation-api-key';
  const DEEPL_API_URL = '/.netlify/functions/translate';
  const DEEPL_TARGET_LANG = 'ZH-TW';
  const FALLBACK_TRANSLATE_URL = 'https://api.mymemory.translated.net/get';
  const FALLBACK_SOURCE_LANG = 'EN';
  const FALLBACK_DELAY_MS = 160;
  const FALLBACK_CONTACT_EMAIL = 'support@toptecglobal.com';
  const SERVER_MANAGED_API_KEY = true;

  const GLOSSARY_TERMS = {
    EVT: 'EVT',
    DFM: 'DFM',
    Unibody: 'Unibody',
    Tolerance: '公差',
    Anodizing: '陽極處理',
  };

  const BATCH_SIZE = 20;
  const BATCH_RETRY_LIMIT = 2;
  const BATCH_RETRY_DELAY_MS = 1200;

  const FILE_SIZE_LIMIT = 15 * 1024 * 1024;
  const TEXT_EXTENSIONS = new Set(['txt', 'text', 'md', 'markdown', 'csv', 'tsv', 'json', 'html', 'htm']);

  const DOCX_CDN_URL = 'https://cdn.jsdelivr.net/npm/docx@8.0.2/build/index.min.js';
  const DOCX_LOCAL_URL = '../assets/internal/vendor/docx-8.0.2.min.js';

  const PDFJS_CDN_URL = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js';
  const PDFJS_WORKER_CDN_URL = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  const PDFJS_LOCAL_URL = '../assets/internal/vendor/pdfjs-3.11.174.min.js';
  const PDFJS_WORKER_LOCAL_URL = '../assets/internal/vendor/pdfjs-worker-3.11.174.min.js';

  const overlay = document.getElementById('access-gate');
  const appRoot = document.getElementById('translator-app');
  if (overlay) overlay.remove();
  if (appRoot) appRoot.hidden = false;

  const toHex = (buffer) =>
    Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

  const hashString = async (value) => {
    if (!window.crypto?.subtle) {
      throw new Error('no-crypto');
    }
    const encoded = new TextEncoder().encode(value.trim());
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return toHex(digest);
  };

  function bootstrapTranslator() {
    if (bootstrapTranslator.initialized) return;
    bootstrapTranslator.initialized = true;

    if (overlay) overlay.remove();
    if (appRoot) appRoot.hidden = false;

    const elements = {
      apiKeyInput: document.getElementById('api-key'),
      saveApiKeyBtn: document.getElementById('save-api-key'),
      clearApiKeyBtn: document.getElementById('clear-api-key'),
      apiKeyStatus: document.getElementById('api-key-status'),
      analyzeButton: document.getElementById('analyze-button'),
      translateButton: document.getElementById('translate-button'),
      segmentCount: document.getElementById('segment-count'),
      feedback: document.getElementById('action-feedback'),
      docTitleInput: document.getElementById('doc-title'),
      docDateInput: document.getElementById('doc-date'),
      sourceTextarea: document.getElementById('source-text'),
      sourceFileInput: document.getElementById('source-file'),
      fileStatus: document.getElementById('file-status'),
      progressPanel: document.getElementById('progress-panel'),
      resultSection: document.getElementById('result-section'),
      previewBody: document.getElementById('preview-body'),
      downloadDocxBtn: document.getElementById('download-docx'),
      downloadPdfBtn: document.getElementById('download-pdf'),
      resetSessionBtn: document.getElementById('reset-session'),
      previewHtmlContainer: document.getElementById('preview-html-container'),
    };

    const state = {
      segments: [],
      translationPairs: [],
      docBlob: null,
      docFileName: '',
      pdfFileName: '',
      sourceFileName: '',
      glossaryTokens: [],
      usedFallback: false,
    };

    let docxLoaderPromise = null;
    let pdfJsLoaderPromise = null;
    let glossaryListEl = null;
    let progressUi = { fill: null, label: null, detail: null };
    const previewPanels = { original: null, translation: null, host: null, countLabel: null };
    const syncScrollState = { busy: false };

    function showFeedback(message, isError = false) {
      if (!elements.feedback) return;
      elements.feedback.textContent = message || '';
      elements.feedback.classList.toggle('text-rose-500', isError);
      elements.feedback.classList.toggle('text-emerald-600', !isError);
    }

    function setFileStatus(message, isError = false) {
      if (!elements.fileStatus) return;
      elements.fileStatus.textContent = message || '';
      elements.fileStatus.classList.toggle('text-rose-500', Boolean(message) && isError);
      elements.fileStatus.classList.toggle('text-slate-500', !message || !isError);
    }

    function setSegmentCount(count) {
      if (!elements.segmentCount) return;
      elements.segmentCount.textContent = count > 0 ? `Detected ${count} segments` : '';
    }

    function normalizeText(raw) {
      return (raw || '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map((line) => line.replace(/\u00a0/g, ' ').trimEnd())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    function parseSegments() {
      const raw = normalizeText(elements.sourceTextarea?.value || '');
      const segments = raw
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean);
      state.segments = segments;
      setSegmentCount(segments.length);
      return segments;
    }

    function deriveTitleFromFile(fileName) {
      if (!fileName) return '';
      const base = fileName.replace(/\.[^.]+$/, '').trim();
      return base || '';
    }

    function escapeHtml(value) {
      return (value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    const decodeHtmlEntities = (() => {
      let parser;
      return (value) => {
        if (typeof value !== 'string' || !value) {
          return value || '';
        }
        if (!parser) {
          parser = document.createElement('textarea');
        }
        parser.innerHTML = value;
        return parser.value;
      };
    })();

    const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    function lockGlossaryTerms(segments) {
      const tokensUsed = new Set();
      const mappings = Object.entries(GLOSSARY_TERMS).map(([term, target], index) => ({
        term,
        target,
        token: `__GLOSSARY_${index}__`,
        regex: new RegExp(`\\b${escapeRegExp(term)}\\b`, 'gi'),
      }));

      const lockedSegments = segments.map((segment) => {
        let working = segment;
        mappings.forEach((entry) => {
          const replaced = working.replace(entry.regex, entry.token);
          if (replaced !== working) {
            tokensUsed.add(entry.token);
            working = replaced;
          }
        });
        return working;
      });

      const activeMappings = mappings.filter((entry) => tokensUsed.has(entry.token));
      state.glossaryTokens = activeMappings;
      return { lockedSegments, activeMappings };
    }

    function restoreGlossaryTokens(text, mappings) {
      if (!text || !Array.isArray(mappings) || !mappings.length) return text;
      return mappings.reduce((acc, entry) => acc.replace(new RegExp(entry.token, 'g'), entry.target), text);
    }

    function updateGlossaryPanel(mappings) {
      if (!glossaryListEl) return;
      glossaryListEl.innerHTML = '';
      const activeTokens = new Set((mappings || []).map((entry) => entry.term));
      const fragment = document.createDocumentFragment();
      Object.entries(GLOSSARY_TERMS).forEach(([term, target]) => {
        const isActive = activeTokens.has(term);
        const row = document.createElement('div');
        row.className =
          'flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition ' +
          (isActive
            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-50'
            : 'border-slate-700/70 bg-slate-900/60 text-slate-200');
        row.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-600'}"></span>
            <span class="font-semibold ${isActive ? 'text-emerald-100' : 'text-slate-200'}">${escapeHtml(term)}</span>
          </div>
          <span class="font-mono ${isActive ? 'text-emerald-50' : 'text-slate-300'}">${escapeHtml(target)}</span>
        `;
        fragment.appendChild(row);
      });
      if (!fragment.children.length) {
        glossaryListEl.innerHTML = '<p class="text-xs text-slate-400">No glossary matches detected in this batch.</p>';
      } else {
        glossaryListEl.appendChild(fragment);
      }
    }

    const sleep = (ms) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      });

    const isLikelyNetworkError = (error) => {
      if (!error) return false;
      if (error instanceof TypeError) return true;
      const message = String(error?.message || '').toLowerCase();
      return (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('cors') ||
        message.includes('failed to fetch') ||
        message.includes('connection')
      );
    };

    function ensureProgressBar() {
      if (!elements.progressPanel) return;
      if (progressUi.fill && progressUi.label && progressUi.detail) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'mt-4 space-y-2';
      const labelRow = document.createElement('div');
      labelRow.className = 'flex items-center justify-between text-xs text-blue-100';

      const progressLabel = document.createElement('span');
      progressLabel.textContent = '進度 0%';
      const progressDetail = document.createElement('span');
      progressDetail.className = 'text-blue-200';
      progressDetail.textContent = '';

      labelRow.append(progressLabel, progressDetail);

      const track = document.createElement('div');
      track.className = 'h-2 w-full rounded-full bg-slate-800/70';

      const fill = document.createElement('div');
      fill.className = 'h-2 rounded-full bg-gradient-to-r from-blue-400 to-emerald-300 shadow-[0_0_8px_rgba(56,189,248,0.6)] transition-all duration-300 ease-out';
      fill.style.width = '0%';
      track.appendChild(fill);

      wrapper.append(labelRow, track);
      elements.progressPanel.appendChild(wrapper);

      progressUi = { fill, label: progressLabel, detail: progressDetail };
    }

    function updateProgressBar(completedBatches, totalBatches, detailText = '') {
      if (!elements.progressPanel) return;
      ensureProgressBar();
      const percent = totalBatches ? Math.round((completedBatches / totalBatches) * 100) : 0;
      progressUi.fill.style.width = `${percent}%`;
      progressUi.label.textContent = `進度 ${percent}%`;
      progressUi.detail.textContent = detailText;
    }

    function resetProgressBar() {
      if (!elements.progressPanel || !progressUi.fill) return;
      progressUi.fill.style.width = '0%';
      progressUi.label.textContent = '進度 0%';
      progressUi.detail.textContent = '';
    }

    async function callFallbackTranslator(segments) {
      if (!Array.isArray(segments) || !segments.length) {
        return [];
      }
      const results = [];
      for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index];
        const params = new URLSearchParams();
        params.append('q', segment);
        params.append('langpair', `${FALLBACK_SOURCE_LANG}|${DEEPL_TARGET_LANG}`);
        params.append('de', FALLBACK_CONTACT_EMAIL);

        const response = await fetch(`${FALLBACK_TRANSLATE_URL}?${params.toString()}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Backup translator error (${response.status})`);
        }
        const data = await response.json();
        if (data?.responseStatus !== 200 || typeof data?.responseData?.translatedText !== 'string') {
          const detail = typeof data?.responseDetails === 'string' && data.responseDetails.trim();
          throw new Error(detail || 'Backup translation service returned an empty response.');
        }

        results.push(decodeHtmlEntities(data.responseData.translatedText));

        if (segments.length > 1 && index < segments.length - 1) {
          await sleep(FALLBACK_DELAY_MS);
        }
      }
      return results;
    }

    async function callDeepL(_apiKey, segments) {
      if (!Array.isArray(segments) || segments.length === 0) {
        return [];
      }

      const response = await fetch(DEEPL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          segments,
          targetLang: DEEPL_TARGET_LANG,
          options: {
            splitSentences: 'nonewlines',
            preserveFormatting: '1',
            formality: 'prefer_more',
          },
        }),
      });

      if (!response.ok) {
        let message = `Translation proxy error (${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson?.message) {
            message = errJson.message;
          } else if (errJson?.error?.message) {
            message = errJson.error.message;
          } else {
            message = JSON.stringify(errJson);
          }
        } catch {
          try {
            message = await response.text();
          } catch {
            // ignore parse failure
          }
        }
        throw new Error(message);
      }

      const data = await response.json();
      if (!Array.isArray(data?.translations) || data.translations.length === 0) {
        throw new Error('DeepL response did not contain any translations. Please try again.');
      }

      return data.translations.map((item) => item?.text ?? '');
    }

    async function translateBatchWithRetry(apiKey, batchSegments) {
      let attempt = 0;
      let lastError;
      while (attempt <= BATCH_RETRY_LIMIT) {
        try {
          const translations = await callDeepL(apiKey, batchSegments);
          if (!translations.length) {
            throw new Error('DeepL returned an empty batch.');
          }
          return { translations, fallbackUsed: false };
        } catch (error) {
          lastError = error;
          attempt += 1;
          if (attempt > BATCH_RETRY_LIMIT) {
            break;
          }
          await sleep(BATCH_RETRY_DELAY_MS * attempt);
        }
      }

      if (isLikelyNetworkError(lastError)) {
        const translations = await callFallbackTranslator(batchSegments);
        return { translations, fallbackUsed: true };
      }

      throw lastError || new Error('Translation batch failed.');
    }

    async function translateInBatches(apiKey, lockedSegments, originalSegments, glossaryMappings, onProgress) {
      if (!Array.isArray(lockedSegments) || !lockedSegments.length) {
        return { pairs: [], usedFallback: false, errors: [] };
      }

      const totalBatches = Math.ceil(lockedSegments.length / BATCH_SIZE);
      const allPairs = [];
      let usedFallback = false;
      const errors = [];

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
        const start = batchIndex * BATCH_SIZE;
        const batchLocked = lockedSegments.slice(start, start + BATCH_SIZE);
        const batchOriginal = originalSegments.slice(start, start + BATCH_SIZE);
        const progressLabel = `批次 ${batchIndex + 1} / ${totalBatches}`;

        onProgress?.(batchIndex, totalBatches, progressLabel);
        let translations;
        let fallbackUsed = false;
        try {
          const result = await translateBatchWithRetry(apiKey, batchLocked);
          translations = result.translations;
          fallbackUsed = result.fallbackUsed;
          usedFallback = usedFallback || fallbackUsed;
        } catch (batchError) {
          console.error('[translator] Batch failed', batchError);
          errors.push({ batch: batchIndex + 1, message: batchError?.message || 'Batch translation failed.' });
          const preservedNote = batchError?.message
            ? `Translation failed: ${batchError.message}`
            : 'Translation failed for this batch.';
          batchOriginal.forEach((original) => {
            allPairs.push({
              original,
              translation: `${preservedNote}\n\n${original || ''}`,
            });
          });
          onProgress?.(batchIndex + 1, totalBatches, `${progressLabel}（失敗，已保留原文）`);
          continue;
        }

        translations.forEach((text, idx) => {
          const restored = restoreGlossaryTokens(text, glossaryMappings);
          allPairs.push({
            original: batchOriginal[idx] ?? '',
            translation: restored,
          });
        });

        onProgress?.(
          batchIndex + 1,
          totalBatches,
          fallbackUsed ? `${progressLabel}（已切換備援）` : progressLabel
        );
      }

      return { pairs: allPairs, usedFallback, errors };
    }

    function loadScriptOnce(url, resolver, label) {
      return new Promise((resolve, reject) => {
        try {
          const existingValue = resolver();
          if (existingValue) {
            resolve(existingValue);
            return;
          }
        } catch (error) {
          reject(error);
          return;
        }

        const encodedUrl = encodeURIComponent(url);
        const existingScript = document.querySelector(`script[data-loader-src="${encodedUrl}"]`);
        if (existingScript) {
          if (existingScript.dataset.loaderReady === 'true') {
            try {
              const value = resolver();
              if (value) {
                resolve(value);
                return;
              }
            } catch (error) {
              reject(error);
              return;
            }
          }

          const onLoad = () => {
            existingScript.removeEventListener('error', onError);
            try {
              const value = resolver();
              if (value) {
                resolve(value);
              } else {
                reject(new Error(`${label} loaded but did not expose the expected API.`));
              }
            } catch (error) {
              reject(error);
            }
          };

          const onError = () => {
            existingScript.removeEventListener('load', onLoad);
            reject(new Error(`Failed to load ${label} script: ${url}`));
          };

          existingScript.addEventListener('load', onLoad, { once: true });
          existingScript.addEventListener('error', onError, { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.dataset.loaderSrc = encodedUrl;
        script.onload = () => {
          script.dataset.loaderReady = 'true';
          try {
            const value = resolver();
            if (value) {
              resolve(value);
            } else {
              reject(new Error(`${label} loaded but did not expose the expected API.`));
            }
          } catch (error) {
            reject(error);
          }
        };
        script.onerror = () => {
          script.remove();
          reject(new Error(`Failed to load ${label} script: ${url}`));
        };
        document.head.appendChild(script);
      });
    }

    async function ensureDocxLibrary() {
      if (window.docx) return window.docx;

      if (!docxLoaderPromise) {
        docxLoaderPromise = loadScriptOnce(DOCX_CDN_URL, () => window.docx, 'docx library')
          .catch((cdnError) => {
            console.warn('[translator] Unable to load docx from CDN, trying local fallback.', cdnError);
            return loadScriptOnce(DOCX_LOCAL_URL, () => window.docx, 'docx library');
          })
          .catch((error) => {
            docxLoaderPromise = null;
            throw error;
          });
      }

      return docxLoaderPromise;
    }

    async function ensurePdfJs() {
      if (window.pdfjsLib) return window.pdfjsLib;

      async function loadPdfJs(scriptUrl, workerUrl) {
        const lib = await loadScriptOnce(scriptUrl, () => window.pdfjsLib, 'pdf.js');
        if (lib?.GlobalWorkerOptions) {
          lib.GlobalWorkerOptions.workerSrc = workerUrl;
        }
        return lib;
      }

      if (!pdfJsLoaderPromise) {
        pdfJsLoaderPromise = loadPdfJs(PDFJS_CDN_URL, PDFJS_WORKER_CDN_URL)
          .catch((cdnError) => {
            console.warn('[translator] Unable to load pdf.js from CDN, trying local fallback.', cdnError);
            return loadPdfJs(PDFJS_LOCAL_URL, PDFJS_WORKER_LOCAL_URL);
          })
          .catch((error) => {
            pdfJsLoaderPromise = null;
            throw error;
          });
      }

      return pdfJsLoaderPromise;
    }

    async function readDocxFile(file) {
      const mammoth = window.mammoth;
      if (!mammoth?.extractRawText) {
        throw new Error('Docx parser is not ready yet. Please refresh the page and try again.');
      }
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = normalizeText(result.value || '');
      const warnings =
        Array.isArray(result.messages) && result.messages.length
          ? result.messages.filter((msg) => msg?.type === 'warning' && msg.message).map((msg) => msg.message)
          : [];
      return { text, warnings };
    }

    async function readPdfFile(file) {
      const pdfjsLib = await ensurePdfJs();
      const data = new Uint8Array(await file.arrayBuffer());
      const pdfDocument = await pdfjsLib.getDocument({ data }).promise;
      const pageTexts = [];

      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
        const page = await pdfDocument.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const lines = [];
        let currentLine = '';

        textContent.items.forEach((item) => {
          const str = (item.str || '').trim();
          if (!str) return;
          if (currentLine.length) currentLine += ' ';
          currentLine += str;
          if (item.hasEOL) {
            if (currentLine.trim()) lines.push(currentLine.trim());
            currentLine = '';
          }
        });

        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }

        pageTexts.push(lines.join('\n'));
      }

      const text = normalizeText(pageTexts.join('\n\n'));
      return { text, warnings: [] };
    }

    async function readPlainTextFile(file) {
      const text = await file.text();
      return { text: normalizeText(text), warnings: [] };
    }

    async function readUploadedFile(file) {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (extension === 'docx') {
        await ensureDocxLibrary();
        return readDocxFile(file);
      }
      if (extension === 'pdf') {
        return readPdfFile(file);
      }
      if (TEXT_EXTENSIONS.has(extension)) {
        return readPlainTextFile(file);
      }
      throw new Error('Unsupported file type. Please upload a .docx, .pdf, or plain-text file.');
    }

    function setupPreviewLayout() {
      if (previewPanels.original && previewPanels.translation) return;

      const previewCard = elements.previewBody?.closest('.mt-8');
      if (previewCard) {
        previewCard.classList.add('hidden');
      }

      const host = elements.previewHtmlContainer || document.createElement('div');
      host.className = 'mt-8 space-y-4';
      host.innerHTML = `
        <div class="rounded-2xl border border-slate-700/70 bg-slate-950/70 shadow-2xl shadow-slate-900/40 backdrop-blur">
          <div class="flex flex-col gap-2 border-b border-slate-800 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Bilingual Preview</p>
              <p class="text-[11px] text-slate-400">同步捲動 | 10 行摘要 | 等寬字體方便檢查數據與代碼</p>
            </div>
            <div class="flex items-center gap-3 text-xs text-slate-300">
              <span class="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1">預覽上限：10 行</span>
              <span data-preview-count class="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-100">0 項</span>
            </div>
          </div>
          <div class="grid gap-4 px-5 pb-5 pt-4 lg:grid-cols-2">
            <div class="flex flex-col rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div class="flex items-center justify-between text-xs text-slate-400">
                <span class="font-semibold text-slate-200">原文</span>
                <span class="text-[11px] text-slate-500">Sync Scroll</span>
              </div>
              <div data-preview-original class="mt-3 max-h-[420px] overflow-auto rounded-lg bg-slate-950/60 p-3 font-mono text-[13px] leading-relaxed text-slate-200 shadow-inner shadow-slate-900/50"></div>
            </div>
            <div class="flex flex-col rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div class="flex items-center justify-between text-xs text-emerald-300">
                <span class="font-semibold text-emerald-100">譯文</span>
                <span class="text-[11px] text-emerald-200/80">Sync Scroll</span>
              </div>
              <div data-preview-translation class="mt-3 max-h-[420px] overflow-auto rounded-lg bg-slate-950/60 p-3 font-mono text-[13px] leading-relaxed text-emerald-100 shadow-inner shadow-slate-900/50"></div>
            </div>
          </div>
          <div class="space-y-2 border-t border-slate-800 px-5 pb-5 pt-4">
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-emerald-200">Glossary Locks</span>
              <span class="text-slate-400">避免 DeepL 意譯專業術語</span>
            </div>
            <div data-glossary-list class="grid gap-2 sm:grid-cols-2"></div>
          </div>
        </div>
      `;

      const parent = previewCard?.parentElement || elements.resultSection || document.body;
      parent.appendChild(host);
      host.classList.remove('hidden');

      previewPanels.original = host.querySelector('[data-preview-original]');
      previewPanels.translation = host.querySelector('[data-preview-translation]');
      previewPanels.host = host;
      previewPanels.countLabel = host.querySelector('[data-preview-count]');
      glossaryListEl = host.querySelector('[data-glossary-list]');

      const syncScroll = (source, target) => {
        if (!source || !target) return;
        source.addEventListener('scroll', () => {
          if (syncScrollState.busy) return;
          syncScrollState.busy = true;
          const ratio =
            source.scrollTop / Math.max(1, source.scrollHeight - source.clientHeight);
          target.scrollTop = ratio * Math.max(0, target.scrollHeight - target.clientHeight);
          syncScrollState.busy = false;
        });
      };

      syncScroll(previewPanels.original, previewPanels.translation);
      syncScroll(previewPanels.translation, previewPanels.original);
    }

    function renderPreview(pairs) {
      setupPreviewLayout();
      if (!previewPanels.original || !previewPanels.translation) return;

      previewPanels.original.innerHTML = '';
      previewPanels.translation.innerHTML = '';

      const limit = Math.min(pairs.length, 10);
      if (previewPanels.countLabel) {
        previewPanels.countLabel.textContent = `${limit} / ${pairs.length} 行`;
      }

      const sourceFrag = document.createDocumentFragment();
      const targetFrag = document.createDocumentFragment();

      for (let i = 0; i < limit; i += 1) {
        const { original, translation } = pairs[i];
        const blockNumber = i + 1;

        const sourceBlock = document.createElement('div');
        sourceBlock.className =
          'rounded-lg border border-slate-800/80 bg-slate-900/80 px-3 py-2 text-slate-100 shadow-sm shadow-slate-900/60';
        sourceBlock.innerHTML = `
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span>Segment ${blockNumber}</span>
          </div>
          <div class="mt-1 whitespace-pre-wrap leading-relaxed">${escapeHtml(original || '')}</div>
        `;
        sourceFrag.appendChild(sourceBlock);

        const targetBlock = document.createElement('div');
        targetBlock.className =
          'rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-50 shadow-sm shadow-emerald-900/60';
        targetBlock.innerHTML = `
          <div class="flex items-center justify-between text-[11px] text-emerald-200/90">
            <span>Segment ${blockNumber}</span>
          </div>
          <div class="mt-1 whitespace-pre-wrap leading-relaxed">${escapeHtml(translation || '')}</div>
        `;
        targetFrag.appendChild(targetBlock);
      }

      previewPanels.original.appendChild(sourceFrag);
      previewPanels.translation.appendChild(targetFrag);
    }

    async function generateDocx(pairs) {
      const docx = await ensureDocxLibrary();
      const {
        AlignmentType,
        BorderStyle,
        Document,
        Header,
        Paragraph,
        Packer,
        Table,
        TableRow,
        TableCell,
        TextRun,
        WidthType,
      } = docx;

      const title = (elements.docTitleInput.value || 'Bilingual Contract').trim();
      const date = elements.docDateInput.value.trim();
      const invisibleBorders = {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      };

      let watermark = null;
      try {
        if (docx.Watermark && typeof docx.Watermark === 'function') {
          watermark = new docx.Watermark('Machine Translated Draft');
        } else if (docx.Watermark && typeof docx.Watermark.fromText === 'function') {
          watermark = docx.Watermark.fromText('Machine Translated Draft');
        }
      } catch (error) {
        console.warn('[translator] Unable to create watermark, continuing without it.', error);
      }

      const header = new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'TOPTEC GLOBAL', bold: true, color: '0ea5e9', size: 26 }),
              new TextRun({ text: '  ·  Machine Translated Draft', color: '475569', size: 20 }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 120 },
          }),
        ],
      });

      const headingParagraphs = [
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 32, color: '0f172a' })],
          spacing: { after: 80 },
        }),
      ];

      if (date) {
        headingParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: `Date: ${date}`, color: '475569', size: 22 })],
            spacing: { after: 240 },
          })
        );
      }

      headingParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Machine Translated Draft — for internal review only',
              italics: true,
              color: '94a3b8',
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );

      const rows = pairs.map((pair, index) => {
        const originalParagraphs = [
          new Paragraph({
            children: [
              new TextRun({ text: `Segment ${index + 1} · Original`, bold: true, color: '334155', size: 20 }),
            ],
            spacing: { after: 80 },
          }),
          ...String(pair.original || '')
            .split('\n')
            .map(
              (line) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line || ' ',
                      font: 'Consolas',
                      size: 20,
                      color: '0f172a',
                    }),
                  ],
                  spacing: { after: 60 },
                })
            ),
        ];

        const translationParagraphs = [
          new Paragraph({
            children: [
              new TextRun({
                text: `Segment ${index + 1} · Translation`,
                bold: true,
                color: '0f766e',
                size: 20,
              }),
            ],
            spacing: { after: 80 },
          }),
          ...String(pair.translation || '')
            .split('\n')
            .map(
              (line) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line || ' ',
                      font: 'Microsoft JhengHei',
                      size: 20,
                      color: '0f172a',
                    }),
                  ],
                  spacing: { after: 60 },
                })
            ),
        ];

        return new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: invisibleBorders,
              children: originalParagraphs,
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: invisibleBorders,
              children: translationParagraphs,
            }),
          ],
        });
      });

      const sectionProps = {
        page: {
          margin: { top: 720, right: 960, bottom: 720, left: 960 },
        },
        headers: { default: header },
      };
      if (watermark) {
        sectionProps.watermark = watermark;
      }

      const document = new Document({
        sections: [
          {
            properties: sectionProps,
            children: [
              ...headingParagraphs,
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: invisibleBorders,
                rows,
              }),
            ],
          },
        ],
      });

      return Packer.toBlob(document);
    }

    function openPrintPreview(pairs) {
      if (!pairs.length) {
        showFeedback('No translation content available for printing.', true);
        return;
      }
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showFeedback('Pop-up blocked. Please allow pop-ups and try again.', true);
        return;
      }

      const title = (elements.docTitleInput.value || 'Bilingual Contract').trim();
      const date = elements.docDateInput.value.trim();
      const styles = `
        :root { color-scheme: light; }
        body { font-family: "Times New Roman", "Microsoft JhengHei", sans-serif; margin: 24px; color: #1f2937; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        h2 { font-size: 16px; margin: 16px 0 8px; color: #1d4ed8; }
        .meta { margin-bottom: 16px; font-size: 12px; color: #4b5563; }
        .block { border: 1px solid #cbd5f5; border-radius: 10px; margin-bottom: 12px; padding: 12px; background: #f8fafc; }
        .label { font-weight: 600; margin-bottom: 6px; color: #0f172a; }
        .content { white-space: pre-wrap; line-height: 1.55; }
        @media print {
          body { margin: 12mm; }
          .block { page-break-inside: avoid; }
          .print-hint { display: none; }
        }
      `;

      const blocksHtml = pairs
        .map((pair, index) => {
          const original = escapeHtml(pair.original || '').replace(/\n/g, '<br>');
          const translation = escapeHtml(pair.translation || '').replace(/\n/g, '<br>');
          return `
          <section class="block">
            <h2>Block ${index + 1}</h2>
            <div class="label">Original</div>
            <div class="content">${original || '<em>(empty)</em>'}</div>
            <div class="label" style="margin-top:12px;">Translation</div>
            <div class="content">${translation || '<em>(empty)</em>'}</div>
          </section>`;
        })
        .join('\n');

      const html = `<!DOCTYPE html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)} - Bilingual PDF</title>
    <style>${styles}</style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    ${date ? `<div class="meta">Date: ${escapeHtml(date)}</div>` : '<div class="meta"></div>'}
    ${blocksHtml}
    <p class="print-hint">提示：請使用瀏覽器的列印功能（Ctrl/Cmd + P）並選擇「儲存為 PDF」。</p>
    <script>
      window.addEventListener('load', () => {
        try {
          window.focus();
          window.print();
        } catch (error) {
          console.error(error);
        }
      });
    <\/script>
  </body>
</html>`;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    }

            function resetSession() {
      state.segments = [];
      state.translationPairs = [];
      state.docBlob = null;
      state.docFileName = '';
      state.pdfFileName = '';
      state.sourceFileName = '';

      if (elements.previewBody) elements.previewBody.innerHTML = '';
      if (previewPanels.original) previewPanels.original.innerHTML = '';
      if (previewPanels.translation) previewPanels.translation.innerHTML = '';
      if (previewPanels.countLabel) previewPanels.countLabel.textContent = '';
      if (elements.downloadDocxBtn) elements.downloadDocxBtn.disabled = true;
      if (elements.downloadPdfBtn) elements.downloadPdfBtn.disabled = true;
      elements.progressPanel?.classList.add('hidden');
      elements.resultSection?.classList.add('hidden');
      resetProgressBar();
      setSegmentCount(0);
      showFeedback('');
    }

    function loadStoredApiKey() {
      if (!elements.apiKeyStatus) return;
      if (SERVER_MANAGED_API_KEY) {
        elements.apiKeyStatus.textContent = 'DeepL access handled by secure server proxy.';
        if (elements.apiKeyInput) {
          elements.apiKeyInput.value = '';
          elements.apiKeyInput.disabled = true;
        }
        if (elements.saveApiKeyBtn) elements.saveApiKeyBtn.disabled = true;
        if (elements.clearApiKeyBtn) elements.clearApiKeyBtn.disabled = true;
        return;
      }
      if (!elements.apiKeyInput) return;
      const storedKey = (localStorage.getItem(API_KEY_STORAGE_KEY) || '').trim();
      if (storedKey) {
        elements.apiKeyInput.value = storedKey;
        elements.apiKeyStatus.textContent = 'API key loaded from browser storage.';
      } else {
        elements.apiKeyStatus.textContent = 'No API key configured.';
      }
    }

    function ensureApiKey() {
      if (SERVER_MANAGED_API_KEY) {
        return 'proxy-managed';
      }
      const value = (elements.apiKeyInput?.value || '').trim();
      if (value) return value;
      const stored = (localStorage.getItem(API_KEY_STORAGE_KEY) || '').trim();
      if (stored) {
        if (elements.apiKeyInput) elements.apiKeyInput.value = stored;
        elements.apiKeyStatus.textContent = 'API key loaded from browser storage.';
        return stored;
      }
      return '';
    }

    if (!SERVER_MANAGED_API_KEY) {
      elements.saveApiKeyBtn?.addEventListener('click', () => {
        const value = (elements.apiKeyInput?.value || '').trim();
        if (!value) {
          elements.apiKeyStatus.textContent = 'Please enter an API key first.';
          return;
        }
        localStorage.setItem(API_KEY_STORAGE_KEY, value);
        elements.apiKeyStatus.textContent = 'API key saved to the browser.';
      });

      elements.clearApiKeyBtn?.addEventListener('click', () => {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        if (elements.apiKeyInput) elements.apiKeyInput.value = '';
        elements.apiKeyStatus.textContent = 'Saved API key has been removed.';
      });
    }

    elements.analyzeButton?.addEventListener('click', () => {
      const segments = parseSegments();
      if (!segments.length) {
        showFeedback('No translatable segments were found. Please check your input.', true);
        return;
      }
      showFeedback(`Detected ${segments.length} segments.`);
    });

    elements.translateButton?.addEventListener('click', async () => {
      const apiKey = ensureApiKey();
      if (!SERVER_MANAGED_API_KEY && !apiKey) {
        showFeedback('Please enter and save a DeepL API key first.', true);
        return;
      }

      const segments = parseSegments();
      if (!segments.length) {
        showFeedback('No translatable segments were found. Please check your input.', true);
        return;
      }

      showFeedback('');
      elements.progressPanel?.classList.remove('hidden');
      elements.translateButton.disabled = true;
      elements.analyzeButton.disabled = true;
      if (elements.downloadDocxBtn) elements.downloadDocxBtn.disabled = true;
      if (elements.downloadPdfBtn) elements.downloadPdfBtn.disabled = true;
      elements.resultSection?.classList.add('hidden');
      resetProgressBar();
      setupPreviewLayout();

      try {
        const { lockedSegments, activeMappings } = lockGlossaryTerms(segments);
        updateGlossaryPanel(activeMappings);

        const { pairs, usedFallback, errors } = await translateInBatches(
          apiKey,
          lockedSegments,
          segments,
          activeMappings,
          (completed, total, detailText) => {
            updateProgressBar(completed, total, detailText);
          }
        );

        if (!Array.isArray(pairs) || !pairs.length) {
          showFeedback('Translation service returned no content. Please verify your input and try again.', true);
          elements.progressPanel?.classList.add('hidden');
          return;
        }

        state.translationPairs = pairs;
        state.usedFallback = usedFallback;

        const timestamp = new Date();
        const stamp = `${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}_${String(timestamp.getHours()).padStart(2, '0')}${String(timestamp.getMinutes()).padStart(2, '0')}`;
        state.docFileName = `Bilingual_Contract_${stamp}.docx`;
        state.pdfFileName = `Bilingual_Contract_${stamp}.pdf`;

        renderPreview(pairs);
        state.docBlob = await generateDocx(pairs);
        if (elements.downloadDocxBtn) elements.downloadDocxBtn.disabled = !state.docBlob;
        if (elements.downloadPdfBtn) elements.downloadPdfBtn.disabled = false;

        elements.progressPanel?.classList.add('hidden');
        elements.resultSection?.classList.remove('hidden');
        const successMessage =
          errors.length > 0
            ? `完成但有 ${errors.length} 個批次需人工覆核（已保留原文）。`
            : usedFallback
              ? 'DeepL 連線不穩，已切換備援翻譯，請加強人工檢視。'
              : 'Translation complete. Files are ready.';
        showFeedback(successMessage);
      } catch (error) {
        console.error(error);
        showFeedback(error.message || 'Translation failed. Please try again later.', true);
        elements.progressPanel?.classList.add('hidden');
      } finally {
        elements.translateButton.disabled = false;
        elements.analyzeButton.disabled = false;
      }
    });

    elements.downloadDocxBtn?.addEventListener('click', () => {
      if (!state.docBlob) return;
      const url = URL.createObjectURL(state.docBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = state.docFileName || 'Bilingual_Contract.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 200);
    });

    elements.downloadPdfBtn?.addEventListener('click', () => {
      openPrintPreview(state.translationPairs);
    });

    elements.resetSessionBtn?.addEventListener('click', () => {
      if (elements.sourceTextarea) elements.sourceTextarea.value = '';
      if (elements.docTitleInput) elements.docTitleInput.value = '';
      if (elements.docDateInput) elements.docDateInput.value = '';
      setFileStatus('');
      resetSession();
    });

    elements.sourceFileInput?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        setFileStatus('');
        return;
      }

      if (file.size > FILE_SIZE_LIMIT) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setFileStatus(`File size is ${sizeMb} MB, exceeding the 15 MB limit. Please compress or split the file.`, true);
        elements.sourceFileInput.value = '';
        return;
      }

      resetSession();
      showFeedback('');
      setFileStatus(`Importing ${file.name} ...`);

      try {
        const result = await readUploadedFile(file);
        if (!result.text) {
          setFileStatus('No content found in the file. Please verify the format.', true);
          return;
        }

        elements.sourceTextarea.value = result.text;
        state.sourceFileName = file.name;

        if (!elements.docTitleInput.value.trim()) {
          const inferred = deriveTitleFromFile(file.name);
          if (inferred) {
            elements.docTitleInput.value = inferred;
          }
        }

        const parsedSegments = parseSegments();
        if (!parsedSegments.length) {
          setFileStatus('No translatable segments detected. Please ensure the file contains plain text content.', true);
          return;
        }

        let message = `Imported ${file.name} (${parsedSegments.length} segments)`;
        if (result.warnings?.length) {
          message += `, ${result.warnings.length} format warnings were ignored.`;
        }
        setFileStatus(message);
      } catch (error) {
        console.error(error);
        setFileStatus(error.message || 'Import failed. Please try again later.', true);
        elements.sourceTextarea.value = '';
        state.sourceFileName = '';
      }
    });

    resetSession();
    loadStoredApiKey();
  }
  bootstrapTranslator.initialized = false;

  bootstrapTranslator();
})();
