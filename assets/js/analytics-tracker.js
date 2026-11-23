/**
 * Andrés Reginensi Photography — Rastreador de Analíticas & Eventos (Limpio y RGPD)
 * - Respeto estricto al consentimiento explícito del banner RGPD.
 * - Etiquetado preciso de conversiones reales sin falsos positivos ni errores en consola.
 */

(function (window, document) {
  'use strict';

  const CONFIG = {
    consentKey: 'andres_cookie_consent_v1',
    storageKey: 'andres_analytics_events',
    sessionKey: 'andres_analytics_session',
    supabaseKey: 'andres_supabase_config',
    maxLocalEvents: 500
  };

  let initialPageViewTracked = false;

  function safeGetLocal(key) {
    try {
      return window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (e) {
      return null;
    }
  }

  function safeSetLocal(key, val) {
    try {
      if (window.localStorage) window.localStorage.setItem(key, val);
    } catch (e) {}
  }

  function safeRemoveLocal(key) {
    try {
      if (window.localStorage) window.localStorage.removeItem(key);
    } catch (e) {}
  }

  function safeGetSession(key) {
    try {
      return window.sessionStorage ? window.sessionStorage.getItem(key) : null;
    } catch (e) {
      return null;
    }
  }

  function safeSetSession(key, val) {
    try {
      if (window.sessionStorage) window.sessionStorage.setItem(key, val);
    } catch (e) {}
  }

  function safeRemoveSession(key) {
    try {
      if (window.sessionStorage) window.sessionStorage.removeItem(key);
    } catch (e) {}
  }

  function getSupabaseConfig() {
    try {
      const localCfg = JSON.parse(safeGetLocal(CONFIG.supabaseKey) || 'null');
      if (localCfg && localCfg.url && localCfg.key) {
        return { url: localCfg.url.trim().replace(/\/$/, ''), key: localCfg.key.trim() };
      }
    } catch (e) {}

    if (window.SUPABASE_PUBLIC_CONFIG && window.SUPABASE_PUBLIC_CONFIG.url && window.SUPABASE_PUBLIC_CONFIG.key) {
      return {
        url: String(window.SUPABASE_PUBLIC_CONFIG.url).trim().replace(/\/$/, ''),
        key: String(window.SUPABASE_PUBLIC_CONFIG.key).trim()
      };
    }
    return null;
  }

  function getSessionId() {
    try {
      let session = JSON.parse(safeGetSession(CONFIG.sessionKey) || 'null');
      const now = Date.now();
      if (!session || now - session.lastActivity > 30 * 60 * 1000) {
        session = {
          id: 'sess_' + Math.random().toString(36).slice(2, 11) + '_' + now,
          startTime: now,
          lastActivity: now
        };
      } else {
        session.lastActivity = now;
      }
      safeSetSession(CONFIG.sessionKey, JSON.stringify(session));
      return session.id;
    } catch (e) {
      return 'sess_anonymous';
    }
  }

  function getDeviceType() {
    const ua = navigator.userAgent || '';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  function getBrowserName() {
    const ua = navigator.userAgent || '';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    return 'Otro';
  }

  function isAnalyticsAllowed() {
    try {
      const consent = JSON.parse(safeGetLocal(CONFIG.consentKey) || 'null');
      return Boolean(consent && consent.analytics === true);
    } catch (e) {
      return false;
    }
  }

  function purgeAnalyticsStorage() {
    safeRemoveLocal(CONFIG.storageKey);
    safeRemoveSession(CONFIG.sessionKey);
  }

  function sendToSupabase(payload) {
    const sb = getSupabaseConfig();
    if (!sb || !sb.url || !sb.key) return;

    const endpoint = `${sb.url}/rest/v1/site_events`;
    const record = {
      session_id: payload.sessionId,
      event_category: payload.category,
      event_action: payload.action,
      event_label: payload.label || '',
      page_path: payload.path,
      referrer: payload.referrer,
      device_type: payload.device,
      browser_name: payload.browser,
      screen_width: payload.screenWidth,
      language: payload.language,
      created_at: new Date(payload.timestamp).toISOString()
    };

    try {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: sb.key,
          Authorization: `Bearer ${sb.key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(record),
        keepalive: true
      }).catch(() => {});
    } catch (err) {}
  }

  function saveLocalEvent(event) {
    try {
      let events = JSON.parse(safeGetLocal(CONFIG.storageKey) || '[]');
      if (!Array.isArray(events)) events = [];
      events.push(event);
      if (events.length > CONFIG.maxLocalEvents) {
        events = events.slice(events.length - CONFIG.maxLocalEvents);
      }
      safeSetLocal(CONFIG.storageKey, JSON.stringify(events));
    } catch (e) {}
  }

  function trackEvent(category, action, label = '', value = 1) {
    if (!isAnalyticsAllowed()) return;

    const eventPayload = {
      sessionId: getSessionId(),
      timestamp: Date.now(),
      category: String(category || 'interaction'),
      action: String(action || 'event'),
      label: String(label || '').slice(0, 180),
      value: Number(value) || 1,
      path: (window.location.pathname || '/') + (window.location.hash || ''),
      referrer: document.referrer || 'direct',
      device: getDeviceType(),
      browser: getBrowserName(),
      screenWidth: window.innerWidth || 0,
      screenHeight: window.innerHeight || 0,
      language: navigator.language || 'es'
    };

    saveLocalEvent(eventPayload);
    sendToSupabase(eventPayload);
  }

  function initAutoTracking() {
    if (isAnalyticsAllowed() && !initialPageViewTracked) {
      initialPageViewTracked = true;
      trackEvent('navigation', 'page_view', document.title || 'Inicio');
    }

    window.addEventListener('cookieConsentUpdated', (e) => {
      const detail = e && e.detail ? e.detail : null;
      if (detail && detail.analytics === true) {
        if (!initialPageViewTracked) {
          initialPageViewTracked = true;
          trackEvent('navigation', 'page_view', document.title || 'Inicio');
        }
      } else {
        purgeAnalyticsStorage();
      }
    });

    window.addEventListener('hashchange', () => {
      trackEvent('navigation', 'section_view', window.location.hash || '#inicio');
    });

    // Rastreo preciso de clics (sin falsos positivos por clases de estilo reutilizadas)
    document.addEventListener(
      'click',
      (e) => {
        const originNode = e.target && e.target.nodeType === 1 ? e.target : e.target?.parentElement;
        if (!originNode || typeof originNode.closest !== 'function') return;

        const target = originNode.closest(
          '[data-track], [data-select-service], [data-toggle-tariff], summary.seo-card-tariff-btn, a, button, .photo-item'
        );
        if (!target) return;

        // Evitar doble conteo en el submit del formulario (ya se registra en main.js al confirmarse el envío)
        if (target.id === 'btn-inquiry-submit' || target.id === 'btn-inquiry-whatsapp') {
          return;
        }

        const href = typeof target.getAttribute === 'function' ? target.getAttribute('href') || '' : '';
        const textLabel = (target.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100);

        // 1. Atributo explícito data-select-service (CTAs de tarifas y secciones)
        if (target.hasAttribute('data-select-service')) {
          trackEvent('conversion', 'select_tariff_service', target.getAttribute('data-select-service') || textLabel);
          return;
        }

        // 2. Despliegue de tarjeta de tarifa
        if (target.hasAttribute('data-toggle-tariff') || target.classList.contains('seo-card-tariff-btn')) {
          const card = target.closest('.seo-card');
          const serviceTitle = card?.querySelector('.seo-card-h3')?.textContent?.trim() || textLabel;
          trackEvent('interaction', 'open_tariff', serviceTitle);
          return;
        }

        // 3. Atributo explícito data-track (siempre tiene prioridad sobre inferencias genéricas)
        if (target.dataset && target.dataset.track) {
          const isConversion = /cta|quote|whatsapp|email|phone|contact|form/i.test(target.dataset.track);
          trackEvent(isConversion ? 'conversion' : 'interaction', target.dataset.track, textLabel || href);
          return;
        }

        // 4. Canales de contacto directos
        if (href.startsWith('mailto:')) {
          trackEvent('conversion', 'click_contact_email', href);
          return;
        }
        if (href.startsWith('tel:')) {
          trackEvent('conversion', 'click_contact_phone', href);
          return;
        }
        if (href.includes('wa.me')) {
          trackEvent('conversion', 'click_whatsapp', textLabel || 'WhatsApp');
          return;
        }

        // 5. Acceso real al Área de Clientes (solo por destino real, nunca por clase CSS genérica)
        if (href.includes('proofing.html') || href.includes('/galeria/')) {
          trackEvent('conversion', 'click_client_area', textLabel || href);
          return;
        }

        // 6. Redes sociales
        if (href.includes('instagram.com')) {
          trackEvent('interaction', 'social_instagram', href);
          return;
        }
        if (href.includes('linkedin.com')) {
          trackEvent('interaction', 'social_linkedin', href);
          return;
        }

        // 7. Visor de fotos (Lightbox)
        if (target.classList.contains('photo-item')) {
          const caption = target.dataset.caption || target.dataset.full || 'Foto';
          trackEvent('interaction', 'open_lightbox', caption);
          return;
        }

        // 8. Selección de fotos en Proofing
        if (target.classList.contains('btn-select-photo')) {
          trackEvent('interaction', 'select_photo', 'Proofing Selection');
        }
      },
      { passive: true }
    );
  }

  window.AndresAnalytics = {
    trackEvent,
    getLocalEvents: () => {
      try {
        const parsed = JSON.parse(safeGetLocal(CONFIG.storageKey) || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    },
    clearLocalEvents: () => {
      safeRemoveLocal(CONFIG.storageKey);
    },
    getSupabaseConfig,
    setSupabaseConfig: (url, key) => {
      if (!url || !key) {
        safeRemoveLocal(CONFIG.supabaseKey);
      } else {
        safeSetLocal(CONFIG.supabaseKey, JSON.stringify({ url: url.trim(), key: key.trim() }));
      }
    },
    clearSupabaseConfig: () => {
      safeRemoveLocal(CONFIG.supabaseKey);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoTracking);
  } else {
    initAutoTracking();
  }
})(window, document);
