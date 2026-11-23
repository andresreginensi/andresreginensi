import {
  ADMIN_COOKIE_NAME,
  ADMIN_TTL_SECONDS,
  buildCookieHeader,
  createSignedToken,
  hashSecretPbkdf2,
  isSameOriginRequest,
  jsonResponse,
  requireAdminSession,
  verifySecretHash
} from '../../_lib/security.js';
import {
  getActiveAdminCredentials,
  saveAdminCredentialsToKv
} from '../../_lib/admin-auth-store.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!isSameOriginRequest(request)) {
    return jsonResponse({ error: 'Origen no permitido.' }, 403);
  }

  const adminSession = await requireAdminSession(request, env);
  if (!adminSession) {
    return jsonResponse({ error: 'Sesión no válida. Inicia sesión de nuevo.' }, 401);
  }

  if (!env.PRIVATE_GALLERIES_KV) {
    return jsonResponse(
      {
        error:
          'Vincula un KV Namespace como PRIVATE_GALLERIES_KV en Cloudflare Pages > Settings > Bindings para guardar cambios de contraseña directamente desde el panel.'
      },
      503
    );
  }

  const activeCreds = await getActiveAdminCredentials(env);
  if (!activeCreds || !env.SESSION_SECRET) {
    return jsonResponse({ error: 'Credenciales iniciales no configuradas en Cloudflare.' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Solicitud JSON no válida.' }, 400);
  }

  const currentPassword = String(body.currentPassword || '');
  const newUsername = String(body.username || activeCreds.username).trim().toLowerCase();
  const newPassword = String(body.newPassword || '');

  if (!currentPassword) {
    return jsonResponse({ error: 'Introduce tu contraseña actual para confirmar el cambio.' }, 400);
  }

  const currentOk = await verifySecretHash(currentPassword, activeCreds.passwordHash);
  if (!currentOk) {
    return jsonResponse({ error: 'La contraseña actual no es correcta.' }, 401);
  }

  if (!/^[a-z0-9._-]{3,40}$/.test(newUsername)) {
    return jsonResponse(
      { error: 'El usuario debe tener entre 3 y 40 caracteres (letras, números, punto, guion o guion bajo).' },
      400
    );
  }

  if (newPassword.length < 10 || newPassword.length > 128) {
    return jsonResponse(
      { error: 'La nueva contraseña debe tener entre 10 y 128 caracteres.' },
      400
    );
  }

  const newHash = await hashSecretPbkdf2(newPassword, 100000);
  await saveAdminCredentialsToKv(env, newUsername, newHash);

  // Renovar la cookie HttpOnly con el usuario actualizado
  const freshToken = await createSignedToken(
    { role: 'admin', sub: newUsername },
    env.SESSION_SECRET,
    ADMIN_TTL_SECONDS
  );

  return jsonResponse(
    { ok: true, username: newUsername },
    200,
    { 'Set-Cookie': buildCookieHeader(ADMIN_COOKIE_NAME, freshToken, ADMIN_TTL_SECONDS, request) }
  );
}
