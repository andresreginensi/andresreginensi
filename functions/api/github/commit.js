import {
  isSameOriginRequest,
  jsonResponse,
  requireAdminSession
} from '../../_lib/security.js';

const SITE_DATA_PATH = 'assets/data/site-data.json';
const ALLOWED_UPLOAD_PATH_RE = /^assets\/images\/uploads\/[a-zA-Z0-9_-]{3,120}\.(jpg|jpeg|png|webp)$/;
const MAX_FILES_PER_COMMIT = 12;
const MAX_BASE64_LENGTH = 8 * 1024 * 1024; // ~6 MB por imagen en base64

async function githubFetch(env, endpointPath, options = {}) {
  const owner = encodeURIComponent(env.GITHUB_OWNER || 'andresreginensi');
  const repo = encodeURIComponent(env.GITHUB_REPO || 'andresreginensi');
  const headers = Object.assign(
    {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'User-Agent': 'AndresReginensi-CloudflarePages'
    },
    options.headers || {}
  );
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}${endpointPath}`, {
    method: options.method || 'GET',
    headers,
    body: options.body
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    const err = new Error(errJson.message || `GitHub HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!isSameOriginRequest(request)) {
    return jsonResponse({ error: 'Origen no permitido.' }, 403);
  }

  const admin = await requireAdminSession(request, env);
  if (!admin) {
    return jsonResponse({ error: 'No autorizado. Inicia sesión como administrador.' }, 401);
  }

  if (!env.GITHUB_TOKEN) {
    return jsonResponse(
      { error: 'GITHUB_TOKEN no configurado en Cloudflare Pages Environment Variables.' },
      503
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Cuerpo JSON no válido.' }, 400);
  }

  const filesToUpload = Array.isArray(body.files) ? body.files : [];
  if (filesToUpload.length > MAX_FILES_PER_COMMIT) {
    return jsonResponse(
      { error: `Máximo ${MAX_FILES_PER_COMMIT} archivos por publicación.` },
      400
    );
  }

  for (const f of filesToUpload) {
    if (!f || typeof f.path !== 'string' || !ALLOWED_UPLOAD_PATH_RE.test(f.path)) {
      return jsonResponse(
        { error: `Ruta de archivo no permitida: ${String(f?.path || '')}` },
        400
      );
    }
    if (typeof f.base64 !== 'string' || !f.base64.length || f.base64.length > MAX_BASE64_LENGTH) {
      return jsonResponse(
        { error: `Archivo inválido o demasiado grande: ${f.path}` },
        400
      );
    }
  }

  const rawSiteData = body.siteData;
  if (!rawSiteData || typeof rawSiteData !== 'object' || !Array.isArray(rawSiteData.portfolio)) {
    return jsonResponse({ error: 'Estructura siteData inválida.' }, 400);
  }

  // Defensa en profundidad: solo publicamos el portafolio público en site-data.json,
  // NUNCA sesiones privadas de clientes ni credenciales.
  const sanitizedSiteData = {
    version: 1,
    updatedAt: Date.now(),
    heroImage:
      typeof rawSiteData.heroImage === 'string' && rawSiteData.heroImage.trim()
        ? rawSiteData.heroImage.trim()
        : 'assets/images/portada.webp',
    portfolio: rawSiteData.portfolio.map((p) => ({
      id: String(p.id || ''),
      category: String(p.category || 'realestate'),
      categoryLabel: String(p.categoryLabel || ''),
      title: String(p.title || '').slice(0, 140),
      tag: String(p.tag || '').slice(0, 140),
      caption: String(p.caption || p.title || '').slice(0, 240),
      aspect: p.aspect === 'portrait' ? 'portrait' : 'landscape',
      thumbUrl: String(p.thumbUrl || p.fullUrl || ''),
      fullUrl: String(p.fullUrl || ''),
      createdAt: Number(p.createdAt) || Date.now(),
      updatedAt: Number(p.updatedAt) || Date.now()
    }))
  };

  const commitMessage = String(body.commitMessage || 'Admin: Actualizar portafolio web')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 180);
  const branch = env.GITHUB_BRANCH || 'main';

  try {
    const refData = await githubFetch(env, `/git/ref/heads/${encodeURIComponent(branch)}`);
    const latestCommitSha = refData.object.sha;

    const commitData = await githubFetch(env, `/git/commits/${latestCommitSha}`);
    const baseTreeSha = commitData.tree.sha;

    const treeEntries = [];
    for (const f of filesToUpload) {
      const blobRes = await githubFetch(env, '/git/blobs', {
        method: 'POST',
        body: JSON.stringify({
          content: f.base64,
          encoding: 'base64'
        })
      });
      treeEntries.push({
        path: f.path,
        mode: '100644',
        type: 'blob',
        sha: blobRes.sha
      });
    }

    const jsonBlobRes = await githubFetch(env, '/git/blobs', {
      method: 'POST',
      body: JSON.stringify({
        content: JSON.stringify(sanitizedSiteData, null, 2),
        encoding: 'utf-8'
      })
    });

    treeEntries.push({
      path: SITE_DATA_PATH,
      mode: '100644',
      type: 'blob',
      sha: jsonBlobRes.sha
    });

    const newTree = await githubFetch(env, '/git/trees', {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeEntries
      })
    });

    const newCommit = await githubFetch(env, '/git/commits', {
      method: 'POST',
      body: JSON.stringify({
        message: commitMessage,
        tree: newTree.sha,
        parents: [latestCommitSha]
      })
    });

    await githubFetch(env, `/git/refs/heads/${encodeURIComponent(branch)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: newCommit.sha,
        force: false
      })
    });

    return jsonResponse({
      ok: true,
      commitSha: newCommit.sha,
      updatedAt: sanitizedSiteData.updatedAt
    });
  } catch (err) {
    return jsonResponse(
      { error: err.message || 'No se pudo publicar en GitHub.' },
      err.status || 502
    );
  }
}
