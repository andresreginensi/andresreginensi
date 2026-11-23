/**
 * Utilidades de seguridad para Cloudflare Pages Functions
 * - Comparación en tiempo constante (anti timing attacks)
 * - Verificación de contraseñas y PINs con PBKDF2-SHA256 o SHA-256
 * - Cookies de sesión firmadas con HMAC-SHA256 (HttpOnly, Secure, SameSite=Strict)
 */

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const ADMIN_COOKIE_NAME = 'ar_admin_session';
export const GALLERY_COOKIE_NAME = 'ar_gallery_session';
export const ADMIN_TTL_SECONDS = 8 * 60 * 60; // 8 horas
export const GALLERY_TTL_SECONDS = 12 * 60 * 60; // 12 horas

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive'
  });
  Object.entries(extraHeaders).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v.forEach((item) => headers.append(k, item));
    } else if (v !== undefined && v !== null) {
      headers.set(k, String(v));
    }
  });
  return new Response(JSON.stringify(data), { status, headers });
}

export function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex) {
  const clean = String(hex || '').trim();
  if (!clean || clean.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(clean)) {
    return null;
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function base64UrlEncode(input) {
  const bytes = typeof input === 'string' ? textEncoder.encode(input) : new Uint8Array(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64UrlDecodeToBytes(str) {
  const clean = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = clean.length % 4 === 0 ? '' : '='.repeat(4 - (clean.length % 4));
  const binary = atob(clean + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function timingSafeEqualBytes(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(String(value || '')));
  return bytesToHex(digest);
}

/**
 * Genera un hash seguro PBKDF2-SHA256 con salt aleatorio:
 * Formato: pbkdf2_sha256$<iteraciones>$<saltHex>$<hashHex>
 */
export async function hashSecretPbkdf2(plainSecret, iterations = 100000) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(String(plainSecret || '')),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return `pbkdf2_sha256$${iterations}$${bytesToHex(salt)}$${bytesToHex(derived)}`;
}

/**
 * Verifica un secreto (contraseña o PIN) frente a:
 * - pbkdf2_sha256$<iter>$<saltHex>$<hashHex> (recomendado)
 * - SHA-256 hex de 64 caracteres (compatibilidad de migración)
 */
export async function verifySecretHash(plainSecret, storedHash) {
  const secretStr = String(plainSecret || '');
  const hashStr = String(storedHash || '').trim();
  if (!secretStr || !hashStr) return false;

  if (hashStr.startsWith('pbkdf2_sha256$')) {
    const parts = hashStr.split('$');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = hexToBytes(parts[2]);
    const expected = hexToBytes(parts[3]);
    if (!Number.isFinite(iterations) || iterations < 10000 || iterations > 600000 || !salt || !expected) {
      return false;
    }
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(secretStr),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derived = new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
        keyMaterial,
        expected.length * 8
      )
    );
    return timingSafeEqualBytes(derived, expected);
  }

  if (/^[0-9a-fA-F]{64}$/.test(hashStr)) {
    const expected = hexToBytes(hashStr.toLowerCase());
    const actual = hexToBytes(await sha256Hex(secretStr));
    return timingSafeEqualBytes(actual, expected);
  }

  return false;
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    textEncoder.encode(String(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSignedToken(payload, secret, ttlSeconds) {
  if (!secret || String(secret).length < 16) {
    throw new Error('SESSION_SECRET no configurado o demasiado corto (mínimo 16 caracteres).');
  }
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = Object.assign({}, payload, {
    iat: now,
    exp: now + ttlSeconds
  });
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const key = await importHmacKey(secret);
  const sigBuf = await crypto.subtle.sign('HMAC', key, textEncoder.encode(encodedPayload));
  const encodedSig = base64UrlEncode(sigBuf);
  return `${encodedPayload}.${encodedSig}`;
}

export async function verifySignedToken(token, secret) {
  if (!token || !secret || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSig] = parts;
  if (!encodedPayload || !encodedSig) return null;

  try {
    const key = await importHmacKey(secret);
    const sigBytes = base64UrlDecodeToBytes(encodedSig);
    const expectedSig = new Uint8Array(
      await crypto.subtle.sign('HMAC', key, textEncoder.encode(encodedPayload))
    );
    if (!timingSafeEqualBytes(sigBytes, expectedSig)) return null;

    const payloadBytes = base64UrlDecodeToBytes(encodedPayload);
    const payload = JSON.parse(textDecoder.decode(payloadBytes));
    const now = Math.floor(Date.now() / 1000);
    if (!payload || typeof payload.exp !== 'number' || payload.exp < now) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

export function parseCookies(request) {
  const raw = request.headers.get('Cookie') || '';
  const map = {};
  raw.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) map[key] = decodeURIComponent(val);
  });
  return map;
}

export function buildCookieHeader(name, value, maxAgeSeconds, request) {
  const url = new URL(request.url);
  const isHttps = url.protocol === 'https:';
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/api',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`
  ];
  if (isHttps) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export function clearCookieHeader(name, request) {
  return buildCookieHeader(name, '', 0, request);
}

/**
 * Comprueba que la sesión de administrador sea válida:
 * 1) Cookie HttpOnly firmada con SESSION_SECRET
 * 2) O cabecera autenticada por Cloudflare Access (si el propietario activa Zero Trust)
 */
export async function requireAdminSession(request, env) {
  const cfAccessEmail = request.headers.get('CF-Access-Authenticated-User-Email');
  if (cfAccessEmail && env.ALLOW_CF_ACCESS === 'true') {
    return { username: cfAccessEmail, authMethod: 'cloudflare_access' };
  }

  const secret = env.SESSION_SECRET;
  if (!secret) return null;

  const cookies = parseCookies(request);
  const token = cookies[ADMIN_COOKIE_NAME];
  const payload = await verifySignedToken(token, secret);
  if (!payload || payload.role !== 'admin') return null;

  return { username: payload.sub || 'admin', authMethod: 'session_cookie' };
}

export async function requireGallerySession(request, env, expectedSlug = null) {
  const secret = env.SESSION_SECRET;
  if (!secret) return null;

  const cookies = parseCookies(request);
  const token = cookies[GALLERY_COOKIE_NAME];
  const payload = await verifySignedToken(token, secret);
  if (!payload || payload.role !== 'gallery' || !payload.slug) return null;
  if (expectedSlug && payload.slug !== expectedSlug) return null;

  return payload;
}

export function sanitizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/**
 * Protección anti-CSRF básica: exige mismo origen en peticiones mutantes (POST/PUT/DELETE)
 */
export function isSameOriginRequest(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true; // Peticiones same-origin sin Origin o clientes directos
  try {
    const reqUrl = new URL(request.url);
    const origUrl = new URL(origin);
    return reqUrl.origin === origUrl.origin;
  } catch (e) {
    return false;
  }
}
