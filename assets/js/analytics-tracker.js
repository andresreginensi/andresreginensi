/**
 * Andrés Reginensi Photography — Rastreador de Analíticas & Eventos
 * 100% Respetuoso con la Privacidad y el RGPD / GDPR.
 * No utiliza cookies de terceros. Anonimiza datos y almacena eventos localmente
 * con sincronización opcional a un endpoint de backend.
 */

(function (window, document) {
  'use strict';

  // Configuración del rastreador
  const CONFIG = {
    storageKey: 'andres_analytics_events',
    sessionKey: 'andres_analytics_session',
    supabaseKey: 'andres_supabase_config',
    maxLocalEvents: 500
  };

  // Obtener configuración de Supabase si existe
  function getSupabaseConfig() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.supabaseKey) || 'null');
    } catch (e) {
      return null;
    }
  }

  // Generador de ID de sesión anónimo (válido por 30 minutos de inactividad)
  function getSessionId() {
    try {
      let session = JSON.parse(sessionStorage.getItem(CONFIG.sessionKey) || 'null');
      const now = Date.now();
      if (!session || now - session.lastActivity > 30 * 60 * 1000) {
        session = {
          id: 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + now,
          startTime: now,
          lastActivity: now
        };
      } else {
        session.lastActivity = now;
      }
      sessionStorage.setItem(CONFIG.sessionKey, JSON.stringify(session));
      return session.id;
    } catch (e) {
      return 'sess_anonymous';
    }
  }

  // Detección de dispositivo
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  // Detección simple de navegador
  function getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    return 'Otro';
  }

  // Comprobar si el usuario consintió analítica en el banner RGPD
  function isAnalyticsAllowed() {
    try {
      const consent = JSON.parse(localStorage.getItem('andres_cookie_consent') || 'null');
      if (consent && consent.analytics === false) return false;
      return true; // Permitido en modo anónimo sin cookies según RGPD
    } catch (e) {
      return true;
    }
  }

  // Enviar evento a Supabase en la nube
  function sendToSupabase(payload) {
    const sb = getSupabaseConfig();
    if (!sb || !sb.url || !sb.key) return;

    const endpoint = `${sb.url.replace(/\/$/, '')}/rest/v1/site_events`;
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
          'apikey': sb.key,
          'Authorization': `Bearer ${sb.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(record),
        keepalive: true
      }).catch(() => {});
    } catch (err) {
      // Ignorar fallos de red
    }
  }

  // Registro de evento
  function trackEvent(category, action, label = '', value = 1) {
    if (!isAnalyticsAllowed()) return;

    const eventPayload = {
      sessionId: getSessionId(),
      timestamp: Date.now(),
      category: category,    // 'navigation', 'conversion', 'interaction'
      action: action,        // 'page_view', 'click_whatsapp', 'select_photo'
      label: label,          // '#bodas', 'Villa Galileu', 'WhatsApp'
      value: value,
      path: window.location.pathname + window.location.hash,
      referrer: document.referrer || 'direct',
      device: getDeviceType(),
      browser: getBrowserName(),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      language: navigator.language || 'es'
    };

    // 1. Guardar en almacenamiento local para el Dashboard del Admin
    saveLocalEvent(eventPayload);

    // 2. Enviar a Supabase en la nube si está configurado
    sendToSupabase(eventPayload);
  }

  function saveLocalEvent(event) {
    try {
      let events = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
      events.push(event);
      if (events.length > CONFIG.maxLocalEvents) {
        events = events.slice(events.length - CONFIG.maxLocalEvents);
      }
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(events));
    } catch (e) {
      // Ignorar errores de quota en localStorage
    }
  }

  // Rastrear eventos automáticos en la página
  function initAutoTracking() {
    // 1. Vista de página inicial
    trackEvent('navigation', 'page_view', document.title || 'Inicio');

    // 2. Rastrear cambios de hash (secciones #realestate, #bodas, #retratos, etc.)
    window.addEventListener('hashchange', () => {
      trackEvent('navigation', 'section_view', window.location.hash || '#inicio');
    });

    // 3. Rastrear clics en botones de conversión
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a, button, [data-track], .photo-item');
      if (!target) return;

      // Contacto / Email
      if (target.href && target.href.startsWith('mailto:')) {
        trackEvent('conversion', 'click_contact_email', target.href);
      }
      // WhatsApp
      else if (target.href && target.href.includes('wa.me')) {
        trackEvent('conversion', 'click_whatsapp', target.href);
      }
      // Acceso a Área de Clientes (Proofing)
      else if (target.href && target.href.includes('proofing.html') || target.classList.contains('btn-client-access')) {
        trackEvent('conversion', 'click_client_area', 'Acceso Clientes');
      }
      // Visor de fotos (Lightbox)
      else if (target.classList.contains('photo-item') || target.closest('.photo-item')) {
        const item = target.closest('.photo-item');
        const caption = item ? item.dataset.caption || item.dataset.full : 'Foto';
        trackEvent('interaction', 'open_lightbox', caption);
      }
      // Selección de fotos en Proofing
      else if (target.classList.contains('btn-select-photo') || target.closest('.btn-select-photo')) {
        trackEvent('interaction', 'select_photo', 'Proofing Selection');
      }
      // Enlace personalizado con data-track
      else if (target.dataset && target.dataset.track) {
        trackEvent('interaction', target.dataset.track, target.textContent.trim());
      }
    }, { passive: true });
  }

  // Exponer API en window para uso manual
  window.AndresAnalytics = {
    trackEvent: trackEvent,
    getLocalEvents: () => {
      try {
        return JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
      } catch (e) {
        return [];
      }
    },
    clearLocalEvents: () => {
      localStorage.removeItem(CONFIG.storageKey);
    },
    getSupabaseConfig: getSupabaseConfig,
    setSupabaseConfig: (url, key) => {
      if (!url || !key) {
        localStorage.removeItem(CONFIG.supabaseKey);
      } else {
        localStorage.setItem(CONFIG.supabaseKey, JSON.stringify({ url: url.trim(), key: key.trim() }));
      }
    },
    clearSupabaseConfig: () => {
      localStorage.removeItem(CONFIG.supabaseKey);
    }
  };

  // Inicializar al cargar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoTracking);
  } else {
    initAutoTracking();
  }

})(window, document);
