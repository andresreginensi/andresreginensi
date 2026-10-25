/**
 * Andrés Reginensi Photography — Gestor de Consentimiento de Cookies (RGPD / GDPR)
 * Cumplimiento estricto de las directivas europeas y guías de la AEPD:
 * - Consentimiento granular y explícito (sin casillas pre-marcadas en no esenciales).
 * - Mismo peso visual entre Aceptar y Rechazar (cero patrones oscuros).
 * - Posibilidad de revocar o modificar el consentimiento en cualquier momento.
 * - Registro con fecha y versión en localStorage.
 */

(function (window, document) {
  'use strict';

  const STORAGE_KEY = 'andres_cookie_consent_v1';
  const CONSENT_VERSION = '1.0';

  // Configuración de estado por defecto
  const defaultConsent = {
    essential: true,   // Siempre activas por necesidad técnica
    analytics: false,  // Desactivadas por defecto según RGPD
    marketing: false,  // Desactivadas por defecto según RGPD
    timestamp: null,
    version: CONSENT_VERSION
  };

  // Elementos del DOM
  let bannerEl = null;
  let modalOverlayEl = null;
  let modalEl = null;
  let toggleAnalyticsEl = null;
  let toggleMarketingEl = null;

  /**
   * 1. INICIALIZACIÓN
   */
  function init() {
    cacheElements();

    const savedConsent = getConsent();

    if (!savedConsent) {
      // Mostrar el banner con una ligera transición tras cargar la página
      setTimeout(() => {
        showBanner();
      }, 700);
    } else {
      // Si el usuario ya dio su consentimiento previamente, ejecutar los scripts autorizados
      applyConsent(savedConsent);
    }

    setupEventListeners();
  }

  function cacheElements() {
    bannerEl = document.getElementById('cookie-banner');
    modalOverlayEl = document.getElementById('cookie-modal-overlay');
    modalEl = document.getElementById('cookie-modal');
    toggleAnalyticsEl = document.getElementById('cookie-toggle-analytics');
    toggleMarketingEl = document.getElementById('cookie-toggle-marketing');
  }

  function setupEventListeners() {
    // Banner: Aceptar todas
    const btnAcceptAll = document.getElementById('cookie-btn-accept-all');
    if (btnAcceptAll) {
      btnAcceptAll.addEventListener('click', () => {
        saveConsent({ essential: true, analytics: true, marketing: true });
      });
    }

    // Banner: Rechazar no esenciales
    const btnRejectNonEssential = document.getElementById('cookie-btn-reject-all');
    if (btnRejectNonEssential) {
      btnRejectNonEssential.addEventListener('click', () => {
        saveConsent({ essential: true, analytics: false, marketing: false });
      });
    }

    // Banner: Abrir configuración
    const btnOpenConfig = document.getElementById('cookie-btn-open-config');
    if (btnOpenConfig) {
      btnOpenConfig.addEventListener('click', () => {
        openModal();
      });
    }

    // Modal: Cerrar
    const btnCloseModal = document.getElementById('cookie-btn-close-modal');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => {
        closeModal();
      });
    }

    // Modal: Guardar preferencias seleccionadas
    const btnSavePreferences = document.getElementById('cookie-btn-save-preferences');
    if (btnSavePreferences) {
      btnSavePreferences.addEventListener('click', () => {
        const analytics = toggleAnalyticsEl ? toggleAnalyticsEl.checked : false;
        const marketing = toggleMarketingEl ? toggleMarketingEl.checked : false;
        saveConsent({ essential: true, analytics, marketing });
      });
    }

    // Modal: Aceptar todas desde el modal
    const btnModalAcceptAll = document.getElementById('cookie-btn-modal-accept-all');
    if (btnModalAcceptAll) {
      btnModalAcceptAll.addEventListener('click', () => {
        saveConsent({ essential: true, analytics: true, marketing: true });
      });
    }

    // Enlace o botón del footer para reabrir preferencias en cualquier momento
    const reopenBtns = document.querySelectorAll('[data-open-cookie-settings]');
    reopenBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });

    // Cerrar modal al hacer clic en el fondo oscuro
    if (modalOverlayEl) {
      modalOverlayEl.addEventListener('click', (e) => {
        if (e.target === modalOverlayEl) {
          closeModal();
        }
      });
    }

    // Accesibilidad: Cerrar con la tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlayEl && modalOverlayEl.classList.contains('is-visible')) {
        closeModal();
      }
    });
  }

  /**
   * 2. GESTIÓN DEL ESTADO Y PERSISTENCIA (localStorage)
   */
  function getConsent() {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (!item) return null;
      const parsed = JSON.parse(item);
      // Validar versión por si en el futuro cambias la política de cookies
      if (parsed.version !== CONSENT_VERSION) return null;
      return parsed;
    } catch (e) {
      console.warn('[Cookies] No se pudo leer localStorage:', e);
      return null;
    }
  }

  function saveConsent(consentData) {
    const consent = {
      essential: true,
      analytics: Boolean(consentData.analytics),
      marketing: Boolean(consentData.marketing),
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch (e) {
      console.warn('[Cookies] No se pudo guardar en localStorage:', e);
    }

    // Ocultar interfaces
    hideBanner();
    closeModal();

    // Aplicar los scripts autorizados de inmediato
    applyConsent(consent);
  }

  /**
   * 3. VISIBILIDAD DE INTERFAZ
   */
  function showBanner() {
    if (bannerEl) {
      bannerEl.classList.add('is-visible');
      bannerEl.setAttribute('aria-hidden', 'false');
    }
  }

  function hideBanner() {
    if (bannerEl) {
      bannerEl.classList.remove('is-visible');
      bannerEl.setAttribute('aria-hidden', 'true');
    }
  }

  function openModal() {
    const current = getConsent() || defaultConsent;

    // Sincronizar estado de los interruptores
    if (toggleAnalyticsEl) toggleAnalyticsEl.checked = current.analytics;
    if (toggleMarketingEl) toggleMarketingEl.checked = current.marketing;

    if (modalOverlayEl) {
      modalOverlayEl.classList.add('is-visible');
      modalOverlayEl.setAttribute('aria-hidden', 'false');
      // Enfocar el botón de cerrar para accesibilidad (A11y)
      const closeBtn = document.getElementById('cookie-btn-close-modal');
      if (closeBtn) closeBtn.focus();
    }
  }

  function closeModal() {
    if (modalOverlayEl) {
      modalOverlayEl.classList.remove('is-visible');
      modalOverlayEl.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * 4. DISPARADOR DE SCRIPTS SEGÚN CONSENTIMIENTO (RGPD Compliant)
   * Aquí se inyectan las herramientas externas ÚNICAMENTE si el usuario dio permiso explícito.
   */
  function applyConsent(consent) {
    // A) Cookies Técnicas: siempre activas (sesión, preferencias locales)
    initEssentialCookies();

    // B) Cookies Analíticas (Google Analytics, Plausible, etc.)
    if (consent.analytics) {
      enableAnalyticsCookies();
    } else {
      disableAnalyticsCookies();
    }

    // C) Cookies de Marketing / Publicidad (Meta Pixel, LinkedIn Insight, etc.)
    if (consent.marketing) {
      enableMarketingCookies();
    } else {
      disableMarketingCookies();
    }

    // Despachar evento para componentes de la web que escuchen cambios de consentimiento
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consent }));
  }

  function initEssentialCookies() {
    // Las cookies técnicas no requieren consentimiento previo (RGPD Art. 5.1 ePrivacy)
    // Se utilizan para el funcionamiento del portfolio y guardado de selección de clientes.
  }

  /**
   * EJEMPLO: Inyección de Google Analytics 4 (GA4)
   * Descomenta y sustituye 'G-XXXXXXXXXX' por tu ID cuando lo tengas.
   */
  function enableAnalyticsCookies() {
    console.info('[Cookies] Consentimiento de Analítica concedido.');
    
    /*
    if (!window.gtagLoaded) {
      window.gtagLoaded = true;
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX', { anonymize_ip: true });
    }
    */
  }

  function disableAnalyticsCookies() {
    // Si el usuario revoca su consentimiento, se evitan nuevas llamadas analíticas
    console.info('[Cookies] Analítica deshabilitada.');
  }

  /**
   * EJEMPLO: Inyección de Meta Pixel / Redes Sociales
   * Descomenta y sustituye tu PIXEL_ID cuando lo requieras.
   */
  function enableMarketingCookies() {
    console.info('[Cookies] Consentimiento de Marketing concedido.');
    
    /*
    if (!window.fbqLoaded) {
      window.fbqLoaded = true;
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', 'TU_PIXEL_ID');
      fbq('track', 'PageView');
    }
    */
  }

  function disableMarketingCookies() {
    console.info('[Cookies] Marketing deshabilitado.');
  }

  /**
   * 5. API GLOBAL (Para reabrir configuración o consultar estado)
   */
  window.CookieConsent = {
    openSettings: openModal,
    getConsent: getConsent,
    resetConsent: function () {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  };

  // Arrancar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
