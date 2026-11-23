import { jsonResponse, requireAdminSession } from '../../_lib/security.js';
import { getActiveAdminCredentials } from '../../_lib/admin-auth-store.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const activeCreds = await getActiveAdminCredentials(env);
  const configured = Boolean(activeCreds && env.SESSION_SECRET);
  const session = await requireAdminSession(request, env);

  if (!session) {
    return jsonResponse({ authenticated: false, configured }, 200);
  }

  return jsonResponse({
    authenticated: true,
    configured,
    username: activeCreds ? activeCreds.username : session.username,
    authMethod: session.authMethod,
    canChangePasswordInPanel: Boolean(env.PRIVATE_GALLERIES_KV),
    githubConfigured: Boolean(env.GITHUB_TOKEN),
    galleriesStorage: env.PRIVATE_GALLERIES_KV
      ? 'kv'
      : env.PRIVATE_GALLERIES_JSON
        ? 'env_secret'
        : 'unconfigured'
  });
}
