import {
  hashSecretPbkdf2,
  isSameOriginRequest,
  jsonResponse,
  requireAdminSession,
  sanitizeSlug
} from '../../_lib/security.js';
import {
  deletePrivateGalleryFromKv,
  getPrivateGalleryBySlug,
  listPrivateGalleriesForAdmin,
  savePrivateGalleryToKv
} from '../../_lib/galleries-store.js';

function decodeDataUrl(dataUrl) {
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i.exec(
    String(dataUrl || '')
  );
  if (!match) return null;
  const mime = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
  const ext = mime === 'image/webp' ? 'webp' : mime === 'image/png' ? 'png' : 'jpg';
  const bin = atob(match[2].replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { mime, ext, bytes };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const admin = await requireAdminSession(request, env);
  if (!admin) return jsonResponse({ error: 'No autorizado.' }, 401);

  const sessions = await listPrivateGalleriesForAdmin(env);
  return jsonResponse({
    ok: true,
    storage: env.PRIVATE_GALLERIES_KV
      ? 'kv'
      : env.PRIVATE_GALLERIES_JSON
        ? 'env_secret'
        : 'unconfigured',
    r2Configured: Boolean(env.PRIVATE_MEDIA_R2),
    sessions
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!isSameOriginRequest(request)) {
    return jsonResponse({ error: 'Origen no permitido.' }, 403);
  }
  const admin = await requireAdminSession(request, env);
  if (!admin) return jsonResponse({ error: 'No autorizado.' }, 401);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'JSON no válido.' }, 400);
  }

  const slug = sanitizeSlug(body.id || body.title || `sesion-${Date.now()}`);
  if (!slug) {
    return jsonResponse({ error: 'Identificador de sesión inválido.' }, 400);
  }

  const existing = await getPrivateGalleryBySlug(env, slug);
  const rawPin = String(body.pin || '').trim();
  let pinHash = existing ? existing.pinHash : '';

  if (rawPin) {
    if (rawPin.length < 4 || rawPin.length > 32) {
      return jsonResponse({ error: 'El PIN debe tener entre 4 y 32 caracteres.' }, 400);
    }
    pinHash = await hashSecretPbkdf2(rawPin);
  }

  if (!pinHash) {
    return jsonResponse({ error: 'Es obligatorio definir un PIN de acceso para la galería.' }, 400);
  }

  const rawPhotos = Array.isArray(body.photos) ? body.photos : [];
  const savedPhotos = [];

  for (let i = 0; i < rawPhotos.length; i++) {
    const ph = rawPhotos[i] || {};
    const photoId = String(ph.id || `AR_${i + 1}`).slice(0, 60);
    let fullUrl = String(ph.fullUrl || ph.full || '');
    let thumbUrl = String(ph.thumbUrl || ph.thumb || fullUrl);

    if (fullUrl.startsWith('data:') || thumbUrl.startsWith('data:')) {
      if (!env.PRIVATE_MEDIA_R2) {
        return jsonResponse(
          {
            error:
              'Para subir fotos privadas de clientes sin exponerlas en GitHub público, vincula un bucket privado de Cloudflare R2 como PRIVATE_MEDIA_R2 (o indica URLs privadas ya subidas).'
          },
          503
        );
      }

      if (fullUrl.startsWith('data:')) {
        const parsed = decodeDataUrl(fullUrl);
        if (!parsed) return jsonResponse({ error: `Imagen inválida en ${photoId}.` }, 400);
        const key = `${slug}/${Date.now()}-${i + 1}-full.${parsed.ext}`;
        await env.PRIVATE_MEDIA_R2.put(key, parsed.bytes, {
          httpMetadata: { contentType: parsed.mime }
        });
        fullUrl = `/api/galleries/media?session=${encodeURIComponent(slug)}&key=${encodeURIComponent(key)}`;
      }

      if (thumbUrl.startsWith('data:')) {
        const parsed = decodeDataUrl(thumbUrl);
        if (!parsed) return jsonResponse({ error: `Miniatura inválida en ${photoId}.` }, 400);
        const key = `${slug}/${Date.now()}-${i + 1}-thumb.${parsed.ext}`;
        await env.PRIVATE_MEDIA_R2.put(key, parsed.bytes, {
          httpMetadata: { contentType: parsed.mime }
        });
        thumbUrl = `/api/galleries/media?session=${encodeURIComponent(slug)}&key=${encodeURIComponent(key)}`;
      }
    }

    savedPhotos.push({
      id: photoId,
      caption: String(ph.caption || ph.title || '').slice(0, 200),
      thumbUrl,
      fullUrl
    });
  }

  const record = {
    id: slug,
    clientName: String(body.clientName || '').slice(0, 140),
    title: String(body.title || '').slice(0, 180),
    date: String(body.date || '').slice(0, 80),
    location: String(body.location || '').slice(0, 120),
    maxSelectable: Number(body.maxSelectable) > 0 ? Number(body.maxSelectable) : 40,
    zipDownloadUrl: String(body.zipDownloadUrl || '').slice(0, 400),
    pinHash,
    photos: savedPhotos,
    createdAt: existing?.createdAt || Number(body.createdAt) || Date.now(),
    updatedAt: Date.now()
  };

  try {
    const saved = await savePrivateGalleryToKv(env, record);
    return jsonResponse({ ok: true, session: saved }, 200);
  } catch (err) {
    return jsonResponse({ error: err.message || 'No se pudo guardar la galería.' }, 503);
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!isSameOriginRequest(request)) {
    return jsonResponse({ error: 'Origen no permitido.' }, 403);
  }
  const admin = await requireAdminSession(request, env);
  if (!admin) return jsonResponse({ error: 'No autorizado.' }, 401);

  const url = new URL(request.url);
  const slug = sanitizeSlug(url.searchParams.get('id') || '');
  if (!slug) return jsonResponse({ error: 'Falta parámetro id.' }, 400);

  try {
    await deletePrivateGalleryFromKv(env, slug);
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err.message || 'No se pudo eliminar la galería.' }, 503);
  }
}
