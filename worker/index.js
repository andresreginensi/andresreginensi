/**
 * Cloudflare Worker entrypoint para andresreginensi.es
 * - Ejecuta únicamente las rutas /api/* (los archivos estáticos se sirven directamente desde el edge sin coste).
 * - Reutiliza los handlers seguros de functions/api/*.
 */

import * as adminLogin from '../functions/api/admin/login.js';
import * as adminLogout from '../functions/api/admin/logout.js';
import * as adminSession from '../functions/api/admin/session.js';
import * as adminChangePassword from '../functions/api/admin/change-password.js';

import * as githubStatus from '../functions/api/github/status.js';
import * as githubSiteData from '../functions/api/github/site-data.js';
import * as githubCommit from '../functions/api/github/commit.js';

import * as galleriesUnlock from '../functions/api/galleries/unlock.js';
import * as galleriesSession from '../functions/api/galleries/session.js';
import * as galleriesLogout from '../functions/api/galleries/logout.js';
import * as galleriesAdmin from '../functions/api/galleries/admin.js';
import * as galleriesMedia from '../functions/api/galleries/media.js';

import { jsonResponse } from '../functions/_lib/security.js';

const API_ROUTES = {
  '/api/admin/login': adminLogin,
  '/api/admin/logout': adminLogout,
  '/api/admin/session': adminSession,
  '/api/admin/change-password': adminChangePassword,
  '/api/github/status': githubStatus,
  '/api/github/site-data': githubSiteData,
  '/api/github/commit': githubCommit,
  '/api/galleries/unlock': galleriesUnlock,
  '/api/galleries/session': galleriesSession,
  '/api/galleries/logout': galleriesLogout,
  '/api/galleries/admin': galleriesAdmin,
  '/api/galleries/media': galleriesMedia
};

const METHOD_MAP = {
  GET: 'onRequestGet',
  POST: 'onRequestPost',
  PUT: 'onRequestPut',
  PATCH: 'onRequestPatch',
  DELETE: 'onRequestDelete'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    if (pathname.startsWith('/api/')) {
      const mod = API_ROUTES[pathname];
      if (!mod) {
        return jsonResponse({ error: 'Endpoint no encontrado.' }, 404);
      }

      const handlerName = METHOD_MAP[request.method.toUpperCase()];
      const handler = handlerName ? mod[handlerName] : null;
      if (typeof handler !== 'function') {
        return jsonResponse({ error: 'Método HTTP no permitido.' }, 405);
      }

      return handler({ request, env, ctx });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
