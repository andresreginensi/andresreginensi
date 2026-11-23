import {
  jsonResponse,
  requireAdminSession,
  requireGallerySession,
  sanitizeSlug
} from '../../_lib/security.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.PRIVATE_MEDIA_R2) {
    return jsonResponse({ error: 'Almacenamiento privado R2 no configurado.' }, 503);
  }

  const url = new URL(request.url);
  const slug = sanitizeSlug(url.searchParams.get('session') || '');
  const key = String(url.searchParams.get('key') || '').trim();

  // Evitar path traversal: la clave debe pertenecer estrictamente al prefijo "<slug>/"
  if (!slug || !key || !key.startsWith(`${slug}/`) || key.includes('..')) {
    return jsonResponse({ error: 'Recurso no válido.' }, 400);
  }

  const admin = await requireAdminSession(request, env);
  const galleryAuth = admin ? null : await requireGallerySession(request, env, slug);
  if (!admin && !galleryAuth) {
    return jsonResponse({ error: 'No autorizado.' }, 401);
  }

  const object = await env.PRIVATE_MEDIA_R2.get(key);
  if (!object) {
    return jsonResponse({ error: 'Archivo no encontrado.' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (!headers.get('Content-Type')) {
    headers.set('Content-Type', 'image/jpeg');
  }
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');

  return new Response(object.body, { status: 200, headers });
}
