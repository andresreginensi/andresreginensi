import { jsonResponse, requireAdminSession } from '../../_lib/security.js';

const SITE_DATA_PATH = 'assets/data/site-data.json';

function decodeBase64Utf8(b64) {
  const clean = String(b64 || '').replace(/\s/g, '');
  const binStr = atob(clean);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

async function githubFetch(env, endpointPath) {
  const owner = encodeURIComponent(env.GITHUB_OWNER || 'andresreginensi');
  const repo = encodeURIComponent(env.GITHUB_REPO || 'andresreginensi');
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}${endpointPath}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'User-Agent': 'AndresReginensi-CloudflarePages'
    }
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    const err = new Error(errJson.message || `GitHub HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const admin = await requireAdminSession(request, env);
  if (!admin) {
    return jsonResponse({ error: 'No autorizado.' }, 401);
  }
  if (!env.GITHUB_TOKEN) {
    return jsonResponse(
      { error: 'GITHUB_TOKEN no configurado en Cloudflare Pages Environment Variables.' },
      503
    );
  }

  const branch = env.GITHUB_BRANCH || 'main';
  try {
    const refObj = await githubFetch(env, `/git/ref/heads/${encodeURIComponent(branch)}`);
    const sha = refObj?.object?.sha || branch;
    const fileObj = await githubFetch(env, `/contents/${SITE_DATA_PATH}?ref=${encodeURIComponent(sha)}`);
    if (!fileObj || !fileObj.content) {
      return jsonResponse({ error: 'site-data.json vacío o no disponible.' }, 404);
    }

    const parsed = JSON.parse(decodeBase64Utf8(fileObj.content));
    // Defensa en profundidad: nunca devolvemos sesiones privadas desde site-data.json
    const publicOnly = {
      version: parsed.version || 1,
      updatedAt: parsed.updatedAt || 0,
      heroImage: parsed.heroImage || 'assets/images/portada.jpg',
      portfolio: Array.isArray(parsed.portfolio) ? parsed.portfolio : []
    };
    return jsonResponse(publicOnly, 200);
  } catch (err) {
    return jsonResponse(
      { error: err.message || 'Error consultando GitHub desde servidor.' },
      err.status === 404 ? 404 : 502
    );
  }
}
