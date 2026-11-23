const ADMIN_CREDS_KV_KEY = 'admin:credentials';

/**
 * Obtiene las credenciales activas del administrador:
 * 1) Prioriza las credenciales actualizadas desde el panel y guardadas en Cloudflare KV.
 * 2) Si no se han modificado en KV, usa las variables de entorno iniciales (ADMIN_USERNAME / ADMIN_PASSWORD_HASH).
 */
export async function getActiveAdminCredentials(env) {
  if (env.PRIVATE_GALLERIES_KV) {
    try {
      const raw = await env.PRIVATE_GALLERIES_KV.get(ADMIN_CREDS_KV_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.username && parsed.passwordHash) {
          return {
            username: String(parsed.username).trim().toLowerCase(),
            passwordHash: String(parsed.passwordHash).trim(),
            source: 'kv'
          };
        }
      }
    } catch (e) {}
  }

  if (env.ADMIN_PASSWORD_HASH) {
    return {
      username: String(env.ADMIN_USERNAME || 'admin').trim().toLowerCase(),
      passwordHash: String(env.ADMIN_PASSWORD_HASH).trim(),
      source: 'env'
    };
  }

  return null;
}

export async function saveAdminCredentialsToKv(env, username, passwordHash) {
  if (!env.PRIVATE_GALLERIES_KV) {
    throw new Error(
      'Para cambiar la contraseña desde el panel, vincula el KV Namespace como PRIVATE_GALLERIES_KV en Cloudflare Pages > Settings > Bindings.'
    );
  }
  const cleanUser = String(username || '').trim().toLowerCase();
  const record = {
    username: cleanUser,
    passwordHash: String(passwordHash).trim(),
    updatedAt: Date.now()
  };
  await env.PRIVATE_GALLERIES_KV.put(ADMIN_CREDS_KV_KEY, JSON.stringify(record));
  return record;
}
