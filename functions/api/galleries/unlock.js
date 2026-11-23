import {
  GALLERY_COOKIE_NAME,
  GALLERY_TTL_SECONDS,
  buildCookieHeader,
  createSignedToken,
  isSameOriginRequest,
  jsonResponse,
  sanitizeSlug,
  verifySecretHash
} from '../../_lib/security.js';
import {
  getPrivateGalleryBySlug,
  stripSecretsFromGallery
} from '../../_lib/galleries-store.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!isSameOriginRequest(request)) {
    return jsonResponse({ error: 'Origen no permitido.' }, 403);
  }

  if (!env.SESSION_SECRET) {
    return jsonResponse(
      { error: 'Servicio de galerías privadas pendiente de configuración en servidor.' },
      503
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Solicitud no válida.' }, 400);
  }

  const slug = sanitizeSlug(body.sessionId || body.slug || '');
  const pin = String(body.pin || '').trim();

  if (!slug || !pin) {
    return jsonResponse({ error: 'Introduce el identificador de galería y el código PIN.' }, 400);
  }

  const gallery = await getPrivateGalleryBySlug(env, slug);

  // Validación uniforme para evitar enumeración de galerías existentes
  const storedHash = gallery ? gallery.pinHash : null;
  const pinMatches = storedHash ? await verifySecretHash(pin, storedHash) : false;

  if (!gallery || !pinMatches) {
    return jsonResponse(
      { error: 'Identificador de galería o código PIN incorrecto.' },
      401
    );
  }

  const token = await createSignedToken(
    { role: 'gallery', slug: gallery.id },
    env.SESSION_SECRET,
    GALLERY_TTL_SECONDS
  );

  return jsonResponse(
    { ok: true, session: stripSecretsFromGallery(gallery) },
    200,
    {
      'Set-Cookie': buildCookieHeader(GALLERY_COOKIE_NAME, token, GALLERY_TTL_SECONDS, request)
    }
  );
}
