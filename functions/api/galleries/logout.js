import {
  GALLERY_COOKIE_NAME,
  clearCookieHeader,
  isSameOriginRequest,
  jsonResponse
} from '../../_lib/security.js';

export async function onRequestPost(context) {
  const { request } = context;
  if (!isSameOriginRequest(request)) {
    return jsonResponse({ error: 'Origen no permitido.' }, 403);
  }

  return jsonResponse(
    { ok: true },
    200,
    { 'Set-Cookie': clearCookieHeader(GALLERY_COOKIE_NAME, request) }
  );
}
