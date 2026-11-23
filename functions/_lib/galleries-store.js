import { sanitizeSlug } from './security.js';

const KV_PREFIX = 'gallery:';
const KV_INDEX_KEY = 'galleries:index';

function parseEnvGalleriesMap(env) {
  if (!env.PRIVATE_GALLERIES_JSON) return {};
  try {
    const parsed = JSON.parse(env.PRIVATE_GALLERIES_JSON);
    if (Array.isArray(parsed)) {
      const map = {};
      parsed.forEach((g) => {
        if (g && g.id) map[sanitizeSlug(g.id)] = g;
      });
      return map;
    }
    if (parsed && typeof parsed === 'object') {
      const map = {};
      Object.entries(parsed).forEach(([k, v]) => {
        if (v && typeof v === 'object') {
          const slug = sanitizeSlug(v.id || k);
          map[slug] = Object.assign({ id: slug }, v);
        }
      });
      return map;
    }
  } catch (e) {}
  return {};
}

export async function getPrivateGalleryBySlug(env, rawSlug) {
  const slug = sanitizeSlug(rawSlug);
  if (!slug) return null;

  if (env.PRIVATE_GALLERIES_KV) {
    const raw = await env.PRIVATE_GALLERIES_KV.get(KV_PREFIX + slug);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }
  }

  const envMap = parseEnvGalleriesMap(env);
  return envMap[slug] || null;
}

export async function listPrivateGalleriesForAdmin(env) {
  const results = new Map();

  const envMap = parseEnvGalleriesMap(env);
  Object.values(envMap).forEach((g) => {
    if (g && g.id) results.set(g.id, Object.assign({ source: 'env_secret' }, g));
  });

  if (env.PRIVATE_GALLERIES_KV) {
    const idxRaw = await env.PRIVATE_GALLERIES_KV.get(KV_INDEX_KEY);
    let ids = [];
    if (idxRaw) {
      try {
        ids = JSON.parse(idxRaw);
      } catch (e) {}
    } else {
      const listed = await env.PRIVATE_GALLERIES_KV.list({ prefix: KV_PREFIX });
      ids = listed.keys.map((k) => k.name.slice(KV_PREFIX.length));
    }

    for (const id of ids) {
      const raw = await env.PRIVATE_GALLERIES_KV.get(KV_PREFIX + id);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          results.set(parsed.id || id, Object.assign({ source: 'kv' }, parsed));
        } catch (e) {}
      }
    }
  }

  return Array.from(results.values())
    .map(stripSecretsFromGallery)
    .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
}

export async function savePrivateGalleryToKv(env, galleryObj) {
  if (!env.PRIVATE_GALLERIES_KV) {
    throw new Error(
      'Almacenamiento privado no vinculado. Crea un KV Namespace en Cloudflare y vincúlalo como PRIVATE_GALLERIES_KV en Pages > Settings > Bindings.'
    );
  }
  const slug = sanitizeSlug(galleryObj.id);
  if (!slug) throw new Error('Identificador de galería inválido.');

  const record = Object.assign({}, galleryObj, { id: slug });
  await env.PRIVATE_GALLERIES_KV.put(KV_PREFIX + slug, JSON.stringify(record));

  const idxRaw = await env.PRIVATE_GALLERIES_KV.get(KV_INDEX_KEY);
  let ids = [];
  try {
    ids = idxRaw ? JSON.parse(idxRaw) : [];
  } catch (e) {}
  if (!ids.includes(slug)) {
    ids.unshift(slug);
    await env.PRIVATE_GALLERIES_KV.put(KV_INDEX_KEY, JSON.stringify(ids));
  }

  return stripSecretsFromGallery(record);
}

export async function deletePrivateGalleryFromKv(env, rawSlug) {
  if (!env.PRIVATE_GALLERIES_KV) {
    throw new Error('Binding PRIVATE_GALLERIES_KV no configurado.');
  }
  const slug = sanitizeSlug(rawSlug);
  if (!slug) throw new Error('Identificador de galería inválido.');

  await env.PRIVATE_GALLERIES_KV.delete(KV_PREFIX + slug);

  const idxRaw = await env.PRIVATE_GALLERIES_KV.get(KV_INDEX_KEY);
  if (idxRaw) {
    try {
      const ids = JSON.parse(idxRaw).filter((id) => id !== slug);
      await env.PRIVATE_GALLERIES_KV.put(KV_INDEX_KEY, JSON.stringify(ids));
    } catch (e) {}
  }
  return true;
}

export function stripSecretsFromGallery(gallery) {
  if (!gallery) return null;
  const { pin, pinHash, ...safe } = gallery;
  return Object.assign({}, safe, {
    hasPin: Boolean(pinHash || pin),
    photos: Array.isArray(safe.photos)
      ? safe.photos.map((ph, idx) => ({
          id: String(ph.id || `PHOTO_${idx + 1}`),
          caption: String(ph.caption || ph.title || ''),
          thumbUrl: String(ph.thumbUrl || ph.thumb || ph.fullUrl || ph.full || ''),
          fullUrl: String(ph.fullUrl || ph.full || '')
        }))
      : []
  });
}
