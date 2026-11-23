import { jsonResponse, requireAdminSession } from '../../_lib/security.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const admin = await requireAdminSession(request, env);
  if (!admin) {
    return jsonResponse({ error: 'No autorizado.' }, 401);
  }

  return jsonResponse({
    configured: Boolean(env.GITHUB_TOKEN),
    owner: env.GITHUB_OWNER || 'andresreginensi',
    repo: env.GITHUB_REPO || 'andresreginensi',
    branch: env.GITHUB_BRANCH || 'main'
  });
}
