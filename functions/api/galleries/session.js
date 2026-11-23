import {
  jsonResponse,
  requireGallerySession,
  sanitizeSlug
} from '../../_lib/security.js';
import {
  getPrivateGalleryBySlug,
  stripSecretsFromGallery
} from '../../_lib/galleries-store.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const requestedSlug = sanitizeSlug(url.searchParams.get('session') || '');

  const auth = await requireGallerySession(request, env, requestedSlug || null);
  if (!auth) {
    return jsonResponse({ authenticated: false }, 200);
  }

  const gallery = await getPrivateGalleryBySlug(env, auth.slug);
  if (!gallery) {
    return jsonResponse({ authenticated: false }, 200);
  }

  return jsonResponse({
    authenticated: true,
    session: stripSecretsFromGallery(gallery)
  });
}
