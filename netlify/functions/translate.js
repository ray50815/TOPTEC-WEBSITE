const allowedOrigins = new Set([
  'http://localhost:8888',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://www.toptecglobal.com',
  'https://toptecglobal.com',
]);

const targetLanguageOverrides = {
  'ZH-TW': 'ZH-HANT',
};

const ok = (body, status = 200, originHeader = '*') => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': originHeader,
  },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

const errorResponse = (message, status = 500, originHeader = '*') =>
  ok({ message }, status, originHeader);

const resolveOrigin = (event) => {
  const origin = event.headers?.origin || '';
  if (allowedOrigins.has(origin)) {
    return origin;
  }
  return '*';
};

exports.handler = async (event) => {
  const originHeader = resolveOrigin(event);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': originHeader,
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    };
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse('Method Not Allowed', 405, originHeader);
  }

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return errorResponse('DeepL API key is not configured.', 500, originHeader);
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return errorResponse('Request body must be valid JSON.', 400, originHeader);
  }

  const { segments, targetLang = 'ZH-TW', options = {} } = payload;
  if (!Array.isArray(segments) || segments.length === 0) {
    return errorResponse('Missing translation segments.', 400, originHeader);
  }

  const normalizedTarget = String(targetLang || '').trim().toUpperCase();
  const deeplTarget =
    targetLanguageOverrides[normalizedTarget] || normalizedTarget || targetLanguageOverrides['ZH-TW'];
  if (!deeplTarget) {
    return errorResponse('Unable to resolve target language.', 400, originHeader);
  }

  const params = new URLSearchParams();
  params.append('target_lang', deeplTarget);
  params.append('split_sentences', options.splitSentences ?? 'nonewlines');
  params.append('preserve_formatting', options.preserveFormatting ?? '1');
  params.append('formality', options.formality ?? 'prefer_more');

  segments.forEach((segment) => {
    params.append('text', segment);
  });

  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  }).catch((error) => ({
    ok: false,
    status: 502,
    statusText: error?.message || 'Fetch error',
    json: async () => ({ message: error?.message || 'Fetch error' }),
    text: async () => error?.message || 'Fetch error',
  }));

  if (!response.ok) {
    let detail;
    try {
      detail = await response.json();
    } catch {
      detail = { message: await response.text() };
    }
    const message =
      detail?.message || detail?.error?.message || response.statusText || 'DeepL request failed.';
    return errorResponse(message, response.status || 502, originHeader);
  }

  const data = await response.text();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
      'Access-Control-Allow-Origin': originHeader,
    },
    body: data,
  };
};
