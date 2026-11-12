/**
 * Andrés Reginensi Photography — Script Principal Optimizado
 * Sin código muerto, accesible por teclado, sanitizado frente a XSS y compatible con GitHub CMS.
 */

(function () {
  'use strict';

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const siteHeader = document.querySelector('.site-header');

  let activeLightboxItems = [];
  let currentLightboxIdx = -1;
  let lastTriggerElement = null;
  let revealObserver = null;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 1. Reacción ligera de la cabecera al hacer scroll (rAF pasivo)
  function initHeaderScroll() {
    if (!siteHeader) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          siteHeader.classList.toggle('is-scrolled', window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // 2. Animación progresiva al hacer scroll (IntersectionObserver)
  function setupScrollReveal() {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px'
    });

    observeReveals();
  }

  function observeReveals() {
    if (!revealObserver) return;
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
      revealObserver.observe(el);
    });
  }

  // 3. Visor Lightbox accesible con navegación Anterior/Siguiente y teclado
  function openLightboxAt(index) {
    if (!lightbox || !lightboxImg || !activeLightboxItems[index]) return;
    currentLightboxIdx = index;
    const item = activeLightboxItems[index];
    const fullUrl = item.dataset.full;
    const caption = item.dataset.caption || '';
    if (!fullUrl) return;

    lightboxImg.src = fullUrl;
    lightboxImg.alt = caption || 'Fotografía ampliada de Andrés Reginensi';
    if (lightboxCaption) {
      lightboxCaption.textContent = caption;
    }

    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (lightboxClose) {
      lightboxClose.focus();
    }
  }

  function navigateLightbox(delta) {
    if (!activeLightboxItems.length) return;
    const nextIdx = (currentLightboxIdx + delta + activeLightboxItems.length) % activeLightboxItems.length;
    openLightboxAt(nextIdx);
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    if (lightboxImg) lightboxImg.src = '';
    document.body.style.overflow = '';

    if (lastTriggerElement && typeof lastTriggerElement.focus === 'function') {
      lastTriggerElement.focus();
      lastTriggerElement = null;
    }
  }

  function setupPhotoLightboxEvents() {
    activeLightboxItems = Array.from(document.querySelectorAll('.photo-item'));

    activeLightboxItems.forEach((item, idx) => {
      if (item.dataset.lbBound === 'true') return;
      item.dataset.lbBound = 'true';
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      const titleText = item.dataset.caption || (item.querySelector('.photo-name') ? item.querySelector('.photo-name').textContent : 'Fotografía');
      item.setAttribute('aria-label', `Ampliar fotografía: ${titleText}`);

      item.addEventListener('click', () => {
        lastTriggerElement = item;
        const freshIdx = activeLightboxItems.indexOf(item);
        openLightboxAt(freshIdx >= 0 ? freshIdx : idx);
      });

      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          lastTriggerElement = item;
          const freshIdx = activeLightboxItems.indexOf(item);
          openLightboxAt(freshIdx >= 0 ? freshIdx : idx);
        }
      });
    });
  }

  function initLightboxControls() {
    if (!lightbox) return;

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); navigateLightbox(-1); });
    if (lightboxNext) lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); navigateLightbox(1); });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    // Gestos táctiles (swipe horizontal para navegar y vertical para cerrar)
    let touchStartY = 0;
    let touchStartX = 0;

    lightbox.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      if (!lightbox.classList.contains('active') || !e.changedTouches || e.changedTouches.length !== 1) return;
      const diffY = e.changedTouches[0].clientY - touchStartY;
      const diffX = e.changedTouches[0].clientX - touchStartX;

      if (Math.abs(diffX) > 70 && Math.abs(diffY) < 80) {
        navigateLightbox(diffX < 0 ? 1 : -1);
      } else if (diffY > 90 && Math.abs(diffX) < 80) {
        closeLightbox();
      }
    }, { passive: true });
  }

  // 4. Carga dinámica del portafolio desde GitHub CMS / site-data.json + IndexedDB (en index.html y páginas de especialidad)
  let allPortfolioPhotos = [];

  function buildPhotoCardHtml(p, forcedAspect) {
    const aspectClass = forcedAspect || (p.aspect === 'landscape' ? 'aspect-landscape' : 'aspect-portrait');
    const safeId = escapeHtml(p.id || '');
    const safeFull = escapeHtml(p.fullUrl);
    const safeThumb = escapeHtml(p.thumbUrl || p.fullUrl);
    const safeTitle = escapeHtml(p.title);
    const safeCaption = escapeHtml(p.caption || p.title);
    const safeTag = escapeHtml(p.tag || '');
    const w = aspectClass === 'aspect-landscape' ? 1000 : 667;
    const h = aspectClass === 'aspect-landscape' ? 666 : 1000;

    return `
      <article class="photo-item ${aspectClass} reveal visible" data-photo-id="${safeId}" data-full="${safeFull}" data-caption="${safeCaption}">
        <div class="img-box">
          <img src="${safeThumb}" alt="${safeCaption}" loading="lazy" decoding="async" width="${w}" height="${h}">
        </div>
        <div class="photo-info">
          <h3 class="photo-name">${safeTitle}</h3>
          <span class="photo-tag">${safeTag}</span>
        </div>
      </article>
    `;
  }

  function renderSectionGrid(category, selector) {
    const container = document.querySelector(selector);
    if (!container) return;

    const photos = allPortfolioPhotos.filter((p) => p.category === category);
    if (photos.length === 0) return;

    if (category === 'realestate') {
      const mainPhoto = photos[0];
      const subPhotos = photos.slice(1, 3);
      const extraPhotos = photos.slice(3);
      let html = buildPhotoCardHtml(mainPhoto, 'aspect-landscape');

      if (subPhotos.length > 0) {
        html += `<div class="realestate-subgrid">${subPhotos.map((p) => buildPhotoCardHtml(p, 'aspect-landscape')).join('')}</div>`;
      }
      if (extraPhotos.length > 0) {
        html += `<div class="realestate-extra-grid">${extraPhotos.map((p) => buildPhotoCardHtml(p, 'aspect-landscape')).join('')}</div>`;
      }
      container.innerHTML = html;
    } else {
      container.innerHTML = photos.map((p) => buildPhotoCardHtml(p)).join('');
    }
  }

  function renderServicePageGallery() {
    const serviceGrid = document.querySelector('.gallery-3col[data-gallery-category]');
    if (!serviceGrid || allPortfolioPhotos.length === 0) return;

    const cats = (serviceGrid.getAttribute('data-gallery-category') || '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cats.length === 0) return;

    const matchingPhotos = allPortfolioPhotos.filter((p) => cats.includes(p.category));
    if (matchingPhotos.length === 0) return;

    // Eliminar tarjetas inyectadas previamente en re-renderizados en vivo
    serviceGrid.querySelectorAll('[data-dynamic-injected="true"]').forEach((el) => el.remove());

    const existingArticles = Array.from(serviceGrid.querySelectorAll('.photo-item'));
    const defaultIds = new Set(
      (window.AndresDB && Array.isArray(window.AndresDB.DEFAULT_PORTFOLIO)
        ? window.AndresDB.DEFAULT_PORTFOLIO
        : []
      ).map((d) => d.id)
    );

    const toPrepend = [];
    matchingPhotos.forEach((p) => {
      const alreadyExists = existingArticles.some(
        (art) =>
          art.getAttribute('data-full') === p.fullUrl ||
          (art.querySelector('.photo-name') &&
            art.querySelector('.photo-name').textContent.trim().toLowerCase() === (p.title || '').trim().toLowerCase())
      );
      if (!alreadyExists && !defaultIds.has(p.id)) {
        toPrepend.push(p);
      }
    });

    if (toPrepend.length > 0) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = toPrepend.map((p) => buildPhotoCardHtml(p)).join('');
      const newNodes = Array.from(wrapper.children);
      newNodes.reverse().forEach((node) => {
        node.setAttribute('data-dynamic-injected', 'true');
        serviceGrid.insertBefore(node, serviceGrid.firstChild);
      });
    }
  }

  async function loadAndRenderSections() {
    const hasHomeGrids = document.querySelector('.grid-realestate, .grid-weddings, .grid-portraits, .grid-corporate');
    const hasServiceGrid = document.querySelector('.gallery-3col[data-gallery-category]');
    if (!hasHomeGrids && !hasServiceGrid) {
      setupPhotoLightboxEvents();
      observeReveals();
      return;
    }

    try {
      const db = window.AndresDB;
      if (db && db.initStorage) {
        await db.initStorage();
        allPortfolioPhotos = await db.getAllPortfolioPhotos();
      }

      if (hasHomeGrids && db && db.getHeroImage) {
        const heroUrl = await db.getHeroImage();
        const heroImg = document.querySelector('.hero-backdrop img');
        // Si el administrador subió una foto de portada personalizada distinta a la de serie, actualizarla
        if (heroImg && heroUrl && heroUrl !== 'assets/images/portada.jpg') {
          heroImg.removeAttribute('srcset');
          heroImg.src = heroUrl;
        }
      }

      if (hasHomeGrids) {
        renderSectionGrid('realestate', '.grid-realestate');
        renderSectionGrid('bodas', '.grid-weddings');
        renderSectionGrid('retratos', '.grid-portraits');
        renderSectionGrid('empresarial', '.grid-corporate');
      }

      if (hasServiceGrid) {
        renderServicePageGallery();
      }

      setupPhotoLightboxEvents();
      observeReveals();
    } catch (err) {
      console.warn('Cargando con contenido estático:', err);
      setupPhotoLightboxEvents();
      observeReveals();
    }
  }

  function initLivePortfolioSync() {
    window.addEventListener('storage', (e) => {
      if (
        !e.key ||
        e.key === 'andres_portfolio_broadcast_ts' ||
        e.key === 'andres_local_portfolio_updated_at' ||
        e.key === 'andres_portfolio'
      ) {
        loadAndRenderSections();
      }
    });

    if (typeof window.BroadcastChannel !== 'undefined') {
      try {
        const channel = new window.BroadcastChannel('andres_cms_channel');
        channel.addEventListener('message', (ev) => {
          if (ev && ev.data && ev.data.type === 'portfolio_updated') {
            loadAndRenderSections();
          }
        });
      } catch (e) {}
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        loadAndRenderSections();
      }
    });
  }

  // 5. Navegación móvil accesible
  function initMobileNavigation() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const drawer = document.getElementById('mobile-nav-drawer');
    const closeBtn = document.getElementById('mobile-nav-close');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    const links = document.querySelectorAll('.mobile-nav-link, .btn-mobile-client, .btn-mobile-whatsapp');

    if (!toggleBtn || !drawer) return;

    function openDrawer() {
      drawer.classList.add('is-active');
      drawer.setAttribute('aria-hidden', 'false');
      toggleBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function closeDrawer() {
      drawer.classList.remove('is-active');
      drawer.setAttribute('aria-hidden', 'true');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      toggleBtn.focus();
    }

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (drawer.classList.contains('is-active')) closeDrawer();
      else openDrawer();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    links.forEach((link) => {
      link.addEventListener('click', () => {
        drawer.classList.remove('is-active');
        drawer.setAttribute('aria-hidden', 'true');
        toggleBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-active')) {
        closeDrawer();
      }
    });
  }

  // 6. Formulario rápido de presupuesto (WhatsApp o Correo pre-estructurado sin fricción)
  function initInquiryForm() {
    const form = document.getElementById('project-inquiry-form');
    if (!form) return;

    const btnEmail = document.getElementById('btn-inquiry-email');

    function buildInquiryData() {
      const name = (document.getElementById('inq-name')?.value || '').trim();
      const service = (document.getElementById('inq-service')?.value || '').trim();
      const locationDate = (document.getElementById('inq-meta')?.value || '').trim();
      const details = (document.getElementById('inq-message')?.value || '').trim();

      const lines = [
        `Hola Andrés, soy ${name || 'un cliente interesado'}.`,
        `Servicio: ${service || 'Fotografía profesional'}`,
        locationDate ? `Ubicación / Fecha: ${locationDate}` : '',
        details ? `Detalles del encargo: ${details}` : ''
      ].filter(Boolean);

      return { name, service, text: lines.join('\n') };
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = buildInquiryData();
      if (window.AndresAnalytics && window.AndresAnalytics.trackEvent) {
        window.AndresAnalytics.trackEvent('conversion', 'submit_inquiry_whatsapp', data.service);
      }
      const waUrl = `https://wa.me/34664848096?text=${encodeURIComponent(data.text)}`;
      window.open(waUrl, '_blank', 'noopener');
    });

    if (btnEmail) {
      btnEmail.addEventListener('click', () => {
        if (!form.reportValidity()) return;
        const data = buildInquiryData();
        if (window.AndresAnalytics && window.AndresAnalytics.trackEvent) {
          window.AndresAnalytics.trackEvent('conversion', 'submit_inquiry_email', data.service);
        }
        const subject = `Solicitud de presupuesto — ${data.service} (${data.name})`;
        window.location.href = `mailto:andresreginensi@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(data.text)}`;
      });
    }
  }

  function init() {
    initHeaderScroll();
    setupScrollReveal();
    initLightboxControls();
    initMobileNavigation();
    initInquiryForm();
    loadAndRenderSections();
    initLivePortfolioSync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
