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
    };

    let docxLoaderPromise = null;
    let pdfJsLoaderPromise = null;

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

        results.push({
          original: segment,
          translation: decodeHtmlEntities(data.responseData.translatedText),
        });

        if (segments.length > 1 && index < segments.length - 1) {
          await sleep(FALLBACK_DELAY_MS);
        }
      }
      return results;
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

    function renderPreview(pairs) {
      if (!elements.previewBody) return;
      elements.previewBody.innerHTML = '';
      const limit = Math.min(pairs.length, 10);
      for (let i = 0; i < limit; i += 1) {
        const { original, translation } = pairs[i];
        const row = document.createElement('tr');
        row.className = 'align-top';

        const originalCell = document.createElement('td');
        originalCell.className = 'whitespace-pre-wrap px-4 py-3 text-slate-200';
        originalCell.textContent = original || '';

        const translationCell = document.createElement('td');
        translationCell.className = 'whitespace-pre-wrap px-4 py-3 text-slate-100';
        translationCell.textContent = translation || '';

        row.append(originalCell, translationCell);
        elements.previewBody.appendChild(row);
      }
    }

    async function generateDocx(pairs) {
      const docx = await ensureDocxLibrary();
      const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, HeadingLevel } = docx;

      const title = (elements.docTitleInput.value || 'Bilingual Contract').trim();
      const date = elements.docDateInput.value.trim();

      const header = [
        new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
      ];
      if (date) {
        header.push(new Paragraph({ text: `Date: ${date}` }));
      }

      const rows = pairs.map((pair, index) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Block ${index + 1} - Original:\n${pair.original || ''}`,
                      font: 'Times New Roman',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Block ${index + 1} - Translation:\n${pair.translation || ''}`,
                      font: 'Microsoft JhengHei',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      );

      const document = new Document({
        sections: [
          {
            children: [
              ...header,
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
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
      if (elements.previewHtmlContainer) elements.previewHtmlContainer.innerHTML = '';
      if (elements.downloadDocxBtn) elements.downloadDocxBtn.disabled = true;
      if (elements.downloadPdfBtn) elements.downloadPdfBtn.disabled = true;
      elements.progressPanel?.classList.add('hidden');
      elements.resultSection?.classList.add('hidden');
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

      return data.translations.map((item, index) => ({
        original: segments[index] ?? '',
        translation: item?.text ?? '',
      }));
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

      try {
        let pairs = [];
        let usedFallback = false;

        try {
          pairs = await callDeepL(apiKey, segments);
        } catch (primaryError) {
          console.error(primaryError);
          if (isLikelyNetworkError(primaryError)) {
            try {
              pairs = await callFallbackTranslator(segments);
              usedFallback = true;
            } catch (fallbackError) {
              console.error(fallbackError);
              showFeedback(
                fallbackError.message ||
                  'DeepL service is unreachable and the backup translator also failed. Please try again later.',
                true
              );
              elements.progressPanel?.classList.add('hidden');
              return;
            }
          } else {
            showFeedback(primaryError.message || 'Translation failed. Please try again later.', true);
            elements.progressPanel?.classList.add('hidden');
            return;
          }
        }

        if (!Array.isArray(pairs) || !pairs.length) {
          showFeedback('Translation service returned no content. Please verify your input and try again.', true);
          elements.progressPanel?.classList.add('hidden');
          return;
        }

        state.translationPairs = pairs;

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
        const successMessage = usedFallback
          ? 'DeepL connection unavailable. Backup translator used—please review the output carefully.'
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

        const segments = parseSegments();
        if (!segments.length) {
          setFileStatus('No translatable segments detected. Please ensure the file contains plain text content.', true);
          return;
        }

        let message = `Imported ${file.name} (${segments.length} segments)`;
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
