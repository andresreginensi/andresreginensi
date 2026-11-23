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
    if (lightboxImg) lightboxImg.removeAttribute('src');
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

  function trapFocusInContainer(container, event) {
    if (!container || event.key !== 'Tab') return;
    const focusables = Array.from(
      container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter((el) => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
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
      if (e.key === 'Tab') trapFocusInContainer(lightbox, e);
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

  // 4. Carga dinámica del portafolio desde site-data.json + autodetección de orientación vertical/horizontal
  let allPortfolioPhotos = [];
  let lastRenderedSignature = '';

  function syncCardOrientationFromImage(img) {
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    const card = img.closest('.photo-item');
    if (!card) return;
    // En la grilla de arquitectura/inmobiliaria respetamos el encuadre panorámico editorial
    if (card.closest('.grid-realestate')) return;
    const isPortrait = img.naturalHeight > img.naturalWidth * 1.05;
    card.classList.toggle('aspect-portrait', isPortrait);
    card.classList.toggle('aspect-landscape', !isPortrait);
  }

  function bindAutoOrientation(root = document) {
    root.querySelectorAll('.photo-item img').forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        syncCardOrientationFromImage(img);
      } else if (img.dataset.orientBound !== 'true') {
        img.dataset.orientBound = 'true';
        img.addEventListener('load', () => syncCardOrientationFromImage(img), { once: true });
      }
    });
  }

  function buildPhotoCardHtml(p, forcedAspect) {
    const aspectClass = forcedAspect || (p.aspect === 'portrait' ? 'aspect-portrait' : 'aspect-landscape');
    const safeId = escapeHtml(p.id || '');
    const safeFull = escapeHtml(p.fullUrl);
    const safeThumb = escapeHtml(p.thumbUrl || p.fullUrl);
    const safeTitle = escapeHtml(p.title);
    const safeCaption = escapeHtml(p.caption || p.title);
    const safeTag = escapeHtml(p.tag || '');
    const w = aspectClass === 'aspect-landscape' ? 1000 : 667;
    const h = aspectClass === 'aspect-landscape' ? 666 : 1000;

    return `
      <article class="photo-item ${aspectClass} reveal is-visible" data-photo-id="${safeId}" data-full="${safeFull}" data-caption="${safeCaption}">
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
    const staticDefaultIds = new Set([
      'port-real-1', 'port-real-2', 'port-real-3',
      'port-boda-1', 'port-boda-2', 'port-boda-3',
      'port-ret-1', 'port-ret-2', 'port-ret-3',
      'port-corp-1', 'port-corp-2', 'port-corp-3'
    ]);

    const toPrepend = [];
    matchingPhotos.forEach((p) => {
      const alreadyExists = existingArticles.some(
        (art) =>
          art.getAttribute('data-full') === p.fullUrl ||
          (art.querySelector('.photo-name') &&
            art.querySelector('.photo-name').textContent.trim().toLowerCase() === (p.title || '').trim().toLowerCase())
      );
      if (!alreadyExists && !staticDefaultIds.has(p.id)) {
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

  async function fetchPublicSiteData() {
    try {
      const res = await fetch('assets/data/site-data.json', { cache: 'no-cache' });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  function sectionMatchesData(selector, photos) {
    const container = document.querySelector(selector);
    if (!container) return true;
    const domItems = Array.from(container.querySelectorAll('.photo-item'));
    if (domItems.length !== photos.length) return false;
    return photos.every((p, idx) => domItems[idx].getAttribute('data-full') === p.fullUrl);
  }

  async function loadAndRenderSections(forceRefresh = false) {
    const hasHomeGrids = document.querySelector('.grid-realestate, .grid-weddings, .grid-portraits, .grid-corporate');
    const hasServiceGrid = document.querySelector('.gallery-3col[data-gallery-category]');
    if (!hasHomeGrids && !hasServiceGrid) {
      bindAutoOrientation();
      setupPhotoLightboxEvents();
      observeReveals();
      return;
    }

    try {
      const pubData = await fetchPublicSiteData();
      allPortfolioPhotos = pubData && Array.isArray(pubData.portfolio) ? pubData.portfolio : [];

      if (hasHomeGrids && pubData && pubData.heroImage) {
        const heroUrl = pubData.heroImage;
        const heroImg = document.querySelector('.hero-backdrop img');
        if (heroImg && heroUrl !== 'assets/images/portada.webp' && heroImg.getAttribute('src') !== heroUrl) {
          heroImg.removeAttribute('srcset');
          heroImg.src = heroUrl;
        }
      }

      if (allPortfolioPhotos.length > 0) {
        const signature = JSON.stringify(
          allPortfolioPhotos.map((p) => [p.id, p.category, p.aspect, p.thumbUrl, p.fullUrl, p.title, p.tag])
        );

        if (forceRefresh || signature !== lastRenderedSignature) {
          lastRenderedSignature = signature;

          if (hasHomeGrids) {
            const sections = [
              ['realestate', '.grid-realestate'],
              ['bodas', '.grid-weddings'],
              ['retratos', '.grid-portraits'],
              ['empresarial', '.grid-corporate']
            ];
            sections.forEach(([cat, sel]) => {
              const catPhotos = allPortfolioPhotos.filter((p) => p.category === cat);
              if (catPhotos.length > 0 && !sectionMatchesData(sel, catPhotos)) {
                renderSectionGrid(cat, sel);
              }
            });
          }

          if (hasServiceGrid) {
            renderServicePageGallery();
          }
        }
      }

      bindAutoOrientation();
      setupPhotoLightboxEvents();
      observeReveals();
    } catch (err) {
      bindAutoOrientation();
      setupPhotoLightboxEvents();
      observeReveals();
    }
  }

  function initLivePortfolioSync() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'andres_portfolio_broadcast_ts') {
        loadAndRenderSections(true);
      }
    });

    if (typeof window.BroadcastChannel !== 'undefined') {
      try {
        const channel = new window.BroadcastChannel('andres_cms_channel');
        channel.addEventListener('message', (ev) => {
          if (ev && ev.data && ev.data.type === 'portfolio_updated') {
            loadAndRenderSections(true);
          }
        });
      } catch (e) {}
    }
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
      if (!drawer.classList.contains('is-active')) return;
      if (e.key === 'Tab') trapFocusInContainer(drawer, e);
      if (e.key === 'Escape') {
        closeDrawer();
      }
    });
  }

  // 6. Formulario de contacto real (envío directo a /api/contact + confirmación visual + opción WhatsApp)
  function initInquiryForm() {
    const form = document.getElementById('project-inquiry-form');
    if (!form) return;

    const btnWhatsapp = document.getElementById('btn-inquiry-whatsapp');
    const btnSubmit = document.getElementById('btn-inquiry-submit');
    const serviceSelect = document.getElementById('inq-service');
    const feedbackBox = document.getElementById('inquiry-feedback');

    function normalizeService(str) {
      return String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    }

    function selectMatchingService(targetService) {
      if (!serviceSelect || !targetService) return false;
      const targetNorm = normalizeService(targetService);
      const options = Array.from(serviceSelect.options);

      let matched = options.find((opt) => opt.value === targetService);
      if (!matched) {
        matched = options.find((opt) => normalizeService(opt.value) === targetNorm);
      }
      if (!matched) {
        matched = options.find(
          (opt) =>
            normalizeService(opt.value).includes(targetNorm) ||
            normalizeService(opt.textContent).includes(targetNorm)
        );
      }

      if (matched) {
        serviceSelect.value = matched.value;
        serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
        serviceSelect.classList.add('is-highlighted');
        setTimeout(() => serviceSelect.classList.remove('is-highlighted'), 1800);
        return true;
      }
      return false;
    }

    // Al pulsar cualquier tarjeta de tarifas o CTA de sección con data-select-service, preselecciona el servicio exacto
    document.querySelectorAll('[data-select-service]').forEach((cta) => {
      cta.addEventListener('click', () => {
        const targetService = cta.getAttribute('data-select-service');
        selectMatchingService(targetService);
        document.querySelectorAll('.seo-tariff-dropdown[open]').forEach((det) => {
          det.removeAttribute('open');
        });
        document.querySelectorAll('.seo-card.is-tariff-open').forEach((card) => {
          card.classList.remove('is-tariff-open');
        });
      });
    });

    function buildInquiryData() {
      const name = (document.getElementById('inq-name')?.value || '').trim();
      const contact = (document.getElementById('inq-contact')?.value || '').trim();
      const service = (document.getElementById('inq-service')?.value || '').trim();
      const meta = (document.getElementById('inq-meta')?.value || '').trim();
      const message = (document.getElementById('inq-message')?.value || '').trim();
      const website = (document.getElementById('inq-website')?.value || '').trim();

      const lines = [
        `Hola Andrés, soy ${name || 'un cliente interesado'}.`,
        contact ? `Contacto: ${contact}` : '',
        `Servicio: ${service || 'Fotografía profesional'}`,
        meta ? `Ubicación / Fecha: ${meta}` : '',
        message ? `Detalles del encargo: ${message}` : ''
      ].filter(Boolean);

      return { name, contact, service, meta, message, website, text: lines.join('\n') };
    }

    function showFeedback(type, htmlContent) {
      if (!feedbackBox) return;
      feedbackBox.className = `inquiry-feedback is-visible ${type === 'success' ? 'is-success' : 'is-error'}`;
      feedbackBox.innerHTML = htmlContent;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;

      const data = buildInquiryData();
      const origHtml = btnSubmit ? btnSubmit.innerHTML : '';
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enviando solicitud...';
      }
      if (feedbackBox) {
        feedbackBox.className = 'inquiry-feedback';
        feedbackBox.innerHTML = '';
      }

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            name: data.name,
            contact: data.contact,
            service: data.service,
            meta: data.meta,
            message: data.message,
            website: data.website,
            pageUrl: window.location.pathname
          })
        });
        const result = await res.json().catch(() => ({}));

        if (!res.ok || !result.ok) {
          throw new Error(result.error || 'No se pudo enviar tu solicitud en este momento.');
        }

        if (window.AndresAnalytics && window.AndresAnalytics.trackEvent) {
          window.AndresAnalytics.trackEvent('conversion', 'submit_inquiry_form', data.service);
        }

        const waUrl = `https://wa.me/34664848096?text=${encodeURIComponent(data.text)}`;
        showFeedback(
          'success',
          `<strong>✓ ¡Solicitud enviada correctamente!</strong><br>Gracias, ${escapeHtml(data.name)}. He recibido tu consulta sobre <strong>${escapeHtml(data.service)}</strong> y te responderé personalmente en menos de 24 horas en <strong>${escapeHtml(data.contact)}</strong>. Si lo prefieres, también puedes <a href="${waUrl}" target="_blank" rel="noopener">escribirme ahora por WhatsApp</a>.`
        );
        form.reset();
      } catch (err) {
        const waUrl = `https://wa.me/34664848096?text=${encodeURIComponent(data.text)}`;
        showFeedback(
          'error',
          `<strong>No se pudo completar el envío automático:</strong> ${escapeHtml(err.message || 'Error de conexión')}. Puedes enviarme tu consulta al instante por <a href="${waUrl}" target="_blank" rel="noopener">WhatsApp</a> o escribir a <a href="mailto:andresreginensi@gmail.com">andresreginensi@gmail.com</a>.`
        );
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = origHtml;
        }
      }
    });

    if (btnWhatsapp) {
      btnWhatsapp.addEventListener('click', () => {
        const data = buildInquiryData();
        if (!data.name && !data.message && !form.reportValidity()) return;
        if (window.AndresAnalytics && window.AndresAnalytics.trackEvent) {
          window.AndresAnalytics.trackEvent('conversion', 'submit_inquiry_whatsapp', data.service);
        }
        const waUrl = `https://wa.me/34664848096?text=${encodeURIComponent(data.text)}`;
        window.open(waUrl, '_blank', 'noopener');
      });
    }
  }

  // 7. Desplegables interactivos de tarifas en los 6 cuadrados de especialidad (.seo-card)
  function initServicePricingPopups() {
    const cards = Array.from(document.querySelectorAll('.seo-card'));
    if (!cards.length) return;

    function closeOtherTariffs(activeCard) {
      cards.forEach((c) => {
        if (c !== activeCard) {
          c.classList.remove('is-tariff-open');
          const det = c.querySelector('.seo-tariff-dropdown');
          if (det && det.hasAttribute('open')) {
            det.removeAttribute('open');
          }
        }
      });
    }

    cards.forEach((card) => {
      const details = card.querySelector('.seo-tariff-dropdown');
      const pillBtn = card.querySelector('[data-toggle-tariff]');

      if (details) {
        details.addEventListener('toggle', () => {
          if (details.open) {
            closeOtherTariffs(card);
            card.classList.add('is-tariff-open');
          } else {
            card.classList.remove('is-tariff-open');
          }
        });
      }

      if (pillBtn && details) {
        pillBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          details.open = !details.open;
        });
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeOtherTariffs(null);
      }
    });
  }

  function init() {
    initHeaderScroll();
    setupScrollReveal();
    initLightboxControls();
    initMobileNavigation();
    initInquiryForm();
    initServicePricingPopups();
    loadAndRenderSections();
    initLivePortfolioSync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
