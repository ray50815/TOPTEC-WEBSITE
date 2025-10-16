(function () {
  const API_KEY_STORAGE_KEY = 'toptec-translation-api-key';
  const DEFAULT_GEMINI_KEY =
    typeof window.TOPTEC_GEMINI_KEY === 'string' ? window.TOPTEC_GEMINI_KEY.trim() : '';

  const appRoot = document.getElementById('translator-app');
  if (appRoot) {
    appRoot.removeAttribute('hidden');
  }

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
    pdfBlob: null,
    docFileName: '',
    pdfFileName: '',
    sourceFileName: '',
  };

  const FILE_SIZE_LIMIT = 2.5 * 1024 * 1024;
  const TEXT_EXTENSIONS = new Set(['txt', 'text', 'md', 'markdown', 'csv', 'tsv', 'json', 'html', 'htm']);
  const DOCX_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/docx@8.3.2/build/index.min.js';
  let docxLoaderPromise = null;

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

  async function ensureDocxLibrary() {
    if (window.docx) {
      return window.docx;
    }

    if (!docxLoaderPromise) {
      docxLoaderPromise = new Promise((resolve, reject) => {
        if (window.docx) {
          resolve(window.docx);
          return;
        }

        const existing = document.querySelector('script[data-docx-loader="true"]');
        if (existing) {
          existing.addEventListener('load', () => {
            if (window.docx) {
              resolve(window.docx);
            } else {
              docxLoaderPromise = null;
              reject(new Error('docx library failed to initialize after loading.'));
            }
          });
          existing.addEventListener('error', () => {
            docxLoaderPromise = null;
            reject(new Error('Failed to load the docx library (network error).'));
          });
          return;
        }

        const script = document.createElement('script');
        script.src = DOCX_SCRIPT_URL;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.dataset.docxLoader = 'true';
        script.onload = () => {
          if (window.docx) {
            resolve(window.docx);
          } else {
            docxLoaderPromise = null;
            reject(new Error('docx library loaded but did not expose the expected API.'));
          }
        };
        script.onerror = () => {
          docxLoaderPromise = null;
          reject(new Error('Failed to load the docx library (network error).'));
        };
        document.head.appendChild(script);
      });
    }

    return docxLoaderPromise;
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

  async function readPlainTextFile(file) {
    const text = await file.text();
    return { text: normalizeText(text), warnings: [] };
  }

  async function readUploadedFile(file) {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (extension === 'docx') return readDocxFile(file);
    if (TEXT_EXTENSIONS.has(extension)) return readPlainTextFile(file);
    throw new Error('Only .docx or plain-text files are supported. Please convert the file and try again.');
  }

  function buildPrompt(segments) {
    const numbered = segments.map((block, index) => `Block ${index + 1}:\n${block}`).join('\n\n');
    return `
You are a professional International Business & Trade Contract Translator, fluent in English and Traditional Chinese, with expertise in law, finance, international trade agreements, payment instruments (DLC, SBLC, MT103), NCNDA, and corporate contracts.

GOAL
Translate the user-provided English document into Traditional Chinese with maximal legal/financial accuracy, then respond ONLY with valid JSON following the schema:
{
  "pairs": [
    { "original": "...", "translation": "..." }
  ]
}

RULES
1. Keep one source block to one translated block. Do NOT merge or split.
2. Preserve numbering, headings, bullet symbols, punctuation, and emphasis markers by mirroring them in text form.
3. Maintain all numbers, dates, currencies, and units as in the original text.
4. For the first occurrence of each legal/financial term, present it as "Chinese Term (English Term)"; subsequent occurrences may use the Chinese term alone when unambiguous.
5. Company, person, and bank names remain in English.
6. Tone must remain formal and precise.
7. Return JSON only. Do not include markdown, code fences, or explanations.

ORIGINAL BLOCKS
${numbered}
`;
  }

  function sanitizeModelResponse(raw) {
    if (!raw) return '';
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```/g, '');
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('Unable to parse the JSON response from the translation service. Please try again later.');
    }
    return cleaned.slice(start, end + 1);
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
      originalCell.className = 'whitespace-pre-wrap px-4 py-3 text-slate-700';
      originalCell.textContent = original || '';

      const translationCell = document.createElement('td');
      translationCell.className = 'whitespace-pre-wrap px-4 py-3 text-slate-900';
      translationCell.textContent = translation || '';

      row.append(originalCell, translationCell);
      elements.previewBody.appendChild(row);
    }
  }

  async function generateDocx(pairs) {
    const docx = await ensureDocxLibrary();
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun } = docx;

    const title = (elements.docTitleInput.value || 'Bilingual Contract').trim();
    const date = elements.docDateInput.value.trim();

    const header = [
      new Paragraph({ text: title, heading: docx.HeadingLevel.HEADING_1 }),
    ];
    if (date) {
      header.push(new Paragraph({ text: `Date: ${date}` }));
    }

    const rows = pairs.map((pair) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: pair.original || '', font: 'Times New Roman' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: pair.translation || '', font: 'Microsoft JhengHei' })],
              }),
            ],
          }),
        ],
      }),
    );

    const doc = new Document({
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

    return Packer.toBlob(doc);
  }

  async function generatePdf(pairs) {
    if (!elements.previewHtmlContainer) return null;
    elements.previewHtmlContainer.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'p-8';

    const heading = document.createElement('h2');
    heading.className = 'text-xl font-semibold mb-4 text-center';
    heading.textContent = elements.docTitleInput.value
      ? `${elements.docTitleInput.value} - Bilingual Overview`
      : 'Bilingual Overview';
    wrapper.appendChild(heading);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '12px';
    table.innerHTML = `
      <thead>
        <tr>
          <th style="border:1px solid #CBD5F5;padding:8px;background:#EEF2FF;">Original (English)</th>
          <th style="border:1px solid #CBD5F5;padding:8px;background:#EEF2FF;">Translation (Traditional Chinese)</th>
        </tr>
      </thead>
    `;

    const tbody = document.createElement('tbody');
    pairs.forEach((pair) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="border:1px solid #E2E8F0;padding:8px;white-space:pre-wrap;font-family:'Times New Roman',serif;">${(pair.original || '').replace(/</g, '&lt;')}</td>
        <td style="border:1px solid #E2E8F0;padding:8px;white-space:pre-wrap;font-family:'Microsoft JhengHei',sans-serif;">${(pair.translation || '').replace(/</g, '&lt;')}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);
    elements.previewHtmlContainer.appendChild(wrapper);

    const pdfOptions = {
      margin: [20, 15, 20, 15],
      filename: state.pdfFileName,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    return window.html2pdf().set(pdfOptions).from(wrapper).outputPdf('blob');
  }

  function resetSession() {
    state.segments = [];
    state.translationPairs = [];
    state.docBlob = null;
    state.pdfBlob = null;
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

  async function callGemini(apiKey, segments) {
    const prompt = buildPrompt(segments);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      let message = `Gemini API error (${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) {
          message = errJson.error.message;
        }
      } catch {
        // ignore parsing failure
      }
      throw new Error(message);
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.output ||
      '';
    if (!text) {
      throw new Error('No translation text was returned by the API. Please try again.');
    }

    const payload = JSON.parse(sanitizeModelResponse(text));
    if (!Array.isArray(payload.pairs) || !payload.pairs.length) {
      throw new Error('Invalid translation payload received. Please verify the source content or try again.');
    }

    return payload.pairs.map((pair, index) => ({
      original: pair.original ?? segments[index] ?? '',
      translation: pair.translation ?? '',
    }));
  }

  function loadStoredApiKey() {
    const stored = (localStorage.getItem(API_KEY_STORAGE_KEY) || '').trim();
    if (stored) {
      elements.apiKeyInput.value = stored;
      elements.apiKeyStatus.textContent = 'API key loaded from browser storage.';
      return;
    }
    if (DEFAULT_GEMINI_KEY) {
      elements.apiKeyInput.value = DEFAULT_GEMINI_KEY;
      localStorage.setItem(API_KEY_STORAGE_KEY, DEFAULT_GEMINI_KEY);
      elements.apiKeyStatus.textContent = 'Loaded default company API key.';
      return;
    }
    elements.apiKeyStatus.textContent = 'No API key configured.';
  }

  function ensureApiKey() {
    const direct = (elements.apiKeyInput.value || '').trim();
    if (direct) return direct;
    const stored = (localStorage.getItem(API_KEY_STORAGE_KEY) || '').trim();
    if (stored) {
      elements.apiKeyInput.value = stored;
      elements.apiKeyStatus.textContent = 'API key loaded from browser storage.';
      return stored;
    }
    return '';
  }

  elements.saveApiKeyBtn?.addEventListener('click', () => {
    const value = (elements.apiKeyInput.value || '').trim();
    if (!value) {
      elements.apiKeyStatus.textContent = 'Please enter an API key first.';
      return;
    }
    localStorage.setItem(API_KEY_STORAGE_KEY, value);
    elements.apiKeyStatus.textContent = 'API key saved to the browser.';
  });

  elements.clearApiKeyBtn?.addEventListener('click', () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    elements.apiKeyInput.value = '';
    elements.apiKeyStatus.textContent = 'Saved API key has been removed.';
  });

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
    if (!apiKey) {
      showFeedback('Please enter and save a Gemini API key first.', true);
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
      const pairs = await callGemini(apiKey, segments);
      state.translationPairs = pairs;

      const timestamp = new Date();
      const stamp = `${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(
        timestamp.getDate(),
      ).padStart(2, '0')}_${String(timestamp.getHours()).padStart(2, '0')}${String(timestamp.getMinutes()).padStart(2, '0')}`;
      state.docFileName = `Bilingual_Contract_${stamp}.docx`;
      state.pdfFileName = `Bilingual_Contract_${stamp}.pdf`;

      renderPreview(pairs);
      state.docBlob = await generateDocx(pairs);
      state.pdfBlob = await generatePdf(pairs);

      if (elements.downloadDocxBtn) elements.downloadDocxBtn.disabled = !state.docBlob;
      if (elements.downloadPdfBtn) elements.downloadPdfBtn.disabled = !state.pdfBlob;

      elements.progressPanel?.classList.add('hidden');
      elements.resultSection?.classList.remove('hidden');
      showFeedback('Translation complete. Files are ready.');
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
    if (!state.pdfBlob) return;
    const url = URL.createObjectURL(state.pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = state.pdfFileName || 'Bilingual_Contract.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 200);
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
      setFileStatus(`File size is ${sizeMb} MB, exceeding the 2.5 MB limit. Please compress or split the file.`, true);
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
        if (inferred) elements.docTitleInput.value = inferred;
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

  function bootstrapApiKey() {
    if (!elements.apiKeyInput || !elements.apiKeyStatus) return;
    loadStoredApiKey();
  }

  bootstrapApiKey();
})();
