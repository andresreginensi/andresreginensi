import {
  ADMIN_COOKIE_NAME,
  ADMIN_TTL_SECONDS,
  buildCookieHeader,
  createSignedToken,
  isSameOriginRequest,
  jsonResponse,
  verifySecretHash
} from '../../_lib/security.js';
import { getActiveAdminCredentials } from '../../_lib/admin-auth-store.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!isSameOriginRequest(request)) {
    return jsonResponse({ error: 'Origen no permitido.' }, 403);
  }

  const activeCreds = await getActiveAdminCredentials(env);
  if (!activeCreds || !env.SESSION_SECRET) {
    return jsonResponse(
      {
        error:
          'Autenticación de servidor pendiente de configurar. Define ADMIN_PASSWORD_HASH y SESSION_SECRET en Cloudflare Pages > Settings > Environment variables.'
      },
      503
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Solicitud JSON no válida.' }, 400);
  }

  const enteredUser = String(body.username || '').trim().toLowerCase();
  const enteredPassword = String(body.password || '');

  const userOk = enteredUser === activeCreds.username;
  const passOk = await verifySecretHash(enteredPassword, activeCreds.passwordHash);

  if (!userOk || !passOk) {
    return jsonResponse({ error: 'Usuario o contraseña incorrectos.' }, 401);
  }

  const token = await createSignedToken(
    { role: 'admin', sub: activeCreds.username },
    env.SESSION_SECRET,
    ADMIN_TTL_SECONDS
  );

  return jsonResponse(
    { ok: true, username: activeCreds.username },
    200,
    { 'Set-Cookie': buildCookieHeader(ADMIN_COOKIE_NAME, token, ADMIN_TTL_SECONDS, request) }
  );
}
