import {
  isSameOriginRequest,
  jsonResponse,
  requireAdminSession,
  sha256Hex
} from '../_lib/security.js';

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SEC = 600; // 10 minutos
const LEAD_TTL_SEC = 60 * 60 * 24 * 60; // 60 días de respaldo en KV

function sanitizeLine(value, maxLen = 200) {
  return String(value || '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function sanitizeMessage(value, maxLen = 1500) {
  return String(value || '').trim().slice(0, maxLen);
}

async function checkRateLimit(request, env) {
  if (!env.PRIVATE_GALLERIES_KV) return true;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = (await sha256Hex(`contact:${ip}`)).slice(0, 24);
  const key = `ratelimit:contact:${ipHash}`;
  const raw = await env.PRIVATE_GALLERIES_KV.get(key);
  const count = raw ? parseInt(raw, 10) || 0 : 0;
  if (count >= RATE_LIMIT_MAX) return false;
  await env.PRIVATE_GALLERIES_KV.put(key, String(count + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SEC
  });
  return true;
}

async function sendViaResend(env, lead) {
  if (!env.RESEND_API_KEY) return null;
  const toEmail = (env.CONTACT_TO_EMAIL || 'andresreginensi@gmail.com').trim();
  const fromEmail = (env.RESEND_FROM_EMAIL || 'Web Andrés Reginensi <onboarding@resend.dev>').trim();

  const textBody = [
    'Nueva solicitud de presupuesto desde andresreginensi.es',
    '-------------------------------------------------------',
    `Nombre / Empresa: ${lead.name}`,
    `Email / Teléfono: ${lead.contact}`,
    `Servicio: ${lead.service}`,
    lead.meta ? `Ubicación / Fecha: ${lead.meta}` : '',
    `Página de origen: ${lead.pageUrl}`,
    `Fecha recepción: ${lead.receivedAt}`,
    '',
    'Mensaje:',
    lead.message
  ]
    .filter(Boolean)
    .join('\n');

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.contact);
  const payload = {
    from: fromEmail,
    to: [toEmail],
    subject: `Nuevo presupuesto: ${lead.service} — ${lead.name}`,
    text: textBody
  };
  if (isEmail) {
    payload.reply_to = lead.contact;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Resend HTTP ${res.status}: ${errText.slice(0, 160)}`);
  }
  return 'resend';
}

async function sendViaWeb3Forms(env, lead) {
  if (!env.WEB3FORMS_ACCESS_KEY) return null;
  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: env.WEB3FORMS_ACCESS_KEY,
      subject: `Nuevo presupuesto: ${lead.service} — ${lead.name}`,
      from_name: 'Web Andrés Reginensi Photography',
      name: lead.name,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.contact)
        ? lead.contact
        : 'no-reply@andresreginensi.es',
      contact: lead.contact,
      service: lead.service,
      location_date: lead.meta || 'No indicada',
      page_url: lead.pageUrl,
      message: lead.message
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Web3Forms HTTP ${res.status}`);
  }
  return 'web3forms';
}

async function sendViaFormspree(env, lead) {
  if (!env.FORMSPREE_ENDPOINT) return null;
  const res = await fetch(env.FORMSPREE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: lead.name,
      contact: lead.contact,
      service: lead.service,
      locationDate: lead.meta,
      message: lead.message,
      pageUrl: lead.pageUrl,
      _subject: `Nuevo presupuesto: ${lead.service} — ${lead.name}`
    })
  });
  if (!res.ok) {
    throw new Error(`Formspree HTTP ${res.status}`);
  }
  return 'formspree';
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!isSameOriginRequest(request)) {
    return jsonResponse({ error: 'Origen no permitido.' }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Solicitud JSON no válida.' }, 400);
  }

  // Honeypot anti-spam: si un bot rellena el campo oculto "website", respondemos OK sin procesar
  if (body.website && String(body.website).trim() !== '') {
    return jsonResponse({ ok: true, deliveredVia: 'filtered' }, 200);
  }

  const allowed = await checkRateLimit(request, env);
  if (!allowed) {
    return jsonResponse(
      { error: 'Has enviado varias consultas seguidas. Espera unos minutos o escríbenos por WhatsApp.' },
      429
    );
  }

  const name = sanitizeLine(body.name, 120);
  const contact = sanitizeLine(body.contact, 160);
  const service = sanitizeLine(body.service || 'Fotografía profesional', 120);
  const meta = sanitizeLine(body.meta, 180);
  const message = sanitizeMessage(body.message, 1500);
  const pageUrl = sanitizeLine(body.pageUrl || '/', 250);

  if (!name || name.length < 2) {
    return jsonResponse({ error: 'Por favor, indica tu nombre o empresa.' }, 400);
  }
  if (!contact || contact.length < 5) {
    return jsonResponse({ error: 'Por favor, indica tu correo electrónico o teléfono para responderte.' }, 400);
  }
  if (!message || message.length < 5) {
    return jsonResponse({ error: 'Cuéntame brevemente qué necesitas para poder preparar tu propuesta.' }, 400);
  }

  const nowIso = new Date().toISOString();
  const leadId = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const lead = {
    id: leadId,
    name,
    contact,
    service,
    meta,
    message,
    pageUrl,
    receivedAt: nowIso
  };

  // 1. Guardar copia de respaldo en Cloudflare KV (garantiza 0 pérdida de leads)
  let savedToKv = false;
  if (env.PRIVATE_GALLERIES_KV) {
    try {
      await env.PRIVATE_GALLERIES_KV.put(`lead:${leadId}`, JSON.stringify(lead), {
        expirationTtl: LEAD_TTL_SEC
      });
      savedToKv = true;
    } catch (e) {}
  }

  // 2. Intentar envío por correo real (Resend -> Web3Forms -> Formspree)
  let deliveredVia = null;
  let emailError = null;
  try {
    deliveredVia =
      (await sendViaResend(env, lead)) ||
      (await sendViaWeb3Forms(env, lead)) ||
      (await sendViaFormspree(env, lead));
  } catch (err) {
    emailError = err.message || 'Error en proveedor de correo';
  }

  if (deliveredVia) {
    return jsonResponse({ ok: true, id: leadId, deliveredVia, savedToKv }, 200);
  }

  if (savedToKv) {
    return jsonResponse(
      {
        ok: true,
        id: leadId,
        deliveredVia: 'kv_inbox',
        savedToKv: true,
        emailPendingConfig: !emailError
      },
      200
    );
  }

  return jsonResponse(
    { error: 'No se pudo completar el envío automático. Puedes escribirnos directamente por WhatsApp.' },
    503
  );
}

// Consulta de leads guardados en KV (solo administrador autenticado)
export async function onRequestGet(context) {
  const { request, env } = context;
  const admin = await requireAdminSession(request, env);
  if (!admin) {
    return jsonResponse({ error: 'No autorizado.' }, 401);
  }
  if (!env.PRIVATE_GALLERIES_KV) {
    return jsonResponse({ ok: true, leads: [] }, 200);
  }

  const list = await env.PRIVATE_GALLERIES_KV.list({ prefix: 'lead:', limit: 50 });
  const leads = [];
  for (const k of list.keys) {
    const raw = await env.PRIVATE_GALLERIES_KV.get(k.name);
    if (raw) {
      try {
        leads.push(JSON.parse(raw));
      } catch (e) {}
    }
  }
  leads.sort((a, b) => String(b.receivedAt || '').localeCompare(String(a.receivedAt || '')));
  return jsonResponse({ ok: true, leads }, 200);
}
