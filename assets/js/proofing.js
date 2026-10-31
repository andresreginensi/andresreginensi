(function () {
  'use strict';

  const emailService = window.EmailService || {};
  const db = window.AndresDB || {};

  const state = {
    session: null,
    selectedPhotoIds: new Set(),
    activeFilter: 'all',
    isUnlocked: false
  };

  const dom = {
    sessionBadge: document.getElementById('session-badge'),
    sessionTitle: document.getElementById('session-title'),
    sessionMeta: document.getElementById('session-meta'),
    grid: document.getElementById('proofing-grid'),
    totalCount: document.getElementById('total-count'),
    filterSelectedCount: document.getElementById('filter-selected-count'),
    selectedBadge: document.getElementById('selected-badge-count'),
    summaryText: document.getElementById('summary-text'),
    btnSubmit: document.getElementById('btn-open-submit'),
    btnClear: document.getElementById('btn-clear'),
    filterBtns: document.querySelectorAll('.filter-pill'),

    // Modal de Pedido
    orderModal: document.getElementById('order-modal'),
    orderForm: document.getElementById('order-form'),
    orderFieldsWrap: document.getElementById('order-fields-wrap'),
    modalSelectedCount: document.getElementById('modal-selected-count'),
    btnModalCancel: document.getElementById('btn-modal-cancel'),
    btnModalSubmit: document.getElementById('btn-modal-submit'),
    directPanel: document.getElementById('direct-delivery-panel'),
    directMsg: document.getElementById('direct-delivery-msg'),
    btnOrderWhatsapp: document.getElementById('btn-order-whatsapp'),
    btnOrderMailto: document.getElementById('btn-order-mailto'),
    btnOrderCopy: document.getElementById('btn-order-copy'),
    btnOrderDone: document.getElementById('btn-order-done'),

    // Modal de PIN / Acceso
    authModal: document.getElementById('auth-modal'),
    authForm: document.getElementById('auth-form'),
    authCodeInput: document.getElementById('auth-code-input'),
    authSessionSelect: document.getElementById('auth-session-select'),
    authPinInput: document.getElementById('auth-pin-input'),
    authError: document.getElementById('auth-error'),

    // Lightbox
    lightbox: document.getElementById('proofing-lightbox'),
    lightboxImg: document.getElementById('proofing-lightbox-img'),
    lightboxCode: document.getElementById('proofing-lightbox-code'),
    lightboxToggle: document.getElementById('proofing-lightbox-toggle'),
    lightboxClose: document.getElementById('proofing-lightbox-close')
  };

  let currentLightboxPhoto = null;
  let lastSummaryText = '';

  const PIN_LOCK_KEY = 'andres_proofing_lockout';
  const MAX_PIN_ATTEMPTS = 5;
  const PIN_LOCKOUT_MS = 60 * 1000;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function sha256Hex(value) {
    const str = String(value || '');
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return '';
  }

  async function isPinValid(sessionData, enteredPin) {
    const cleanPin = String(enteredPin || '').trim();
    if (!sessionData.pin && !sessionData.pinHash) return true;
    if (sessionData.pinHash) {
      const hash = await sha256Hex(cleanPin);
      if (hash && hash === sessionData.pinHash) return true;
    }
    if (sessionData.pin && String(sessionData.pin).trim() === cleanPin) {
      return true;
    }
    return false;
  }

  // Datos de respaldo local con hash SHA-256 en lugar de PIN en texto plano
  const FALLBACK_DATA = {
    'boda-laura-carlos': {
      id: 'boda-laura-carlos',
      pinHash: '158a323a7ba44870f23d96f1516dd70aa48e9a72db4ebb026b0a89e212a208ab',
      title: 'Boda Laura & Carlos — Reportaje Documental',
      date: '18 de Octubre, 2026',
      location: 'Finca Bellver, Mallorca',
      clientName: 'Laura Gómez & Carlos Martínez',
      maxSelectable: 50,
      photos: [
        { id: 'AR_LC_001', thumbUrl: 'assets/images/bodas/boda-salida-arroz-thumb.jpg', fullUrl: 'assets/images/bodas/boda-salida-arroz.jpg' },
        { id: 'AR_LC_002', thumbUrl: 'assets/images/bodas/boda-editorial-calle-thumb.jpg', fullUrl: 'assets/images/bodas/boda-editorial-calle.jpg' },
        { id: 'AR_LC_003', thumbUrl: 'assets/images/bodas/boda-playa-orilla-thumb.jpg', fullUrl: 'assets/images/bodas/boda-playa-orilla.jpg' },
        { id: 'AR_LC_004', thumbUrl: 'assets/images/bodas/boda-alianzas-manos-thumb.jpg', fullUrl: 'assets/images/bodas/boda-alianzas-manos.jpg' }
      ]
    },
    'inmobiliaria-villa-mediterranea': {
      id: 'inmobiliaria-villa-mediterranea',
      pinHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
      title: 'Villa Galileu - Reportaje Arquitectura & Lujo',
      date: '20 de Octubre, 2026',
      location: 'Jávea, Alicante',
      clientName: 'Habitat Luxury Real Estate',
      maxSelectable: 25,
      photos: [
        { id: 'AR_VM_001', thumbUrl: 'assets/images/realestate/galileu-piscina-thumb.jpg', fullUrl: 'assets/images/realestate/galileu-piscina.jpg' },
        { id: 'AR_VM_002', thumbUrl: 'assets/images/realestate/galileu-salon-thumb.jpg', fullUrl: 'assets/images/realestate/galileu-salon.jpg' },
        { id: 'AR_VM_003', thumbUrl: 'assets/images/realestate/galileu-cocina-thumb.jpg', fullUrl: 'assets/images/realestate/galileu-cocina.jpg' },
        { id: 'AR_VM_004', thumbUrl: 'assets/images/realestate/galileu-escalera-thumb.jpg', fullUrl: 'assets/images/realestate/galileu-escalera.jpg' },
        { id: 'AR_VM_005', thumbUrl: 'assets/images/realestate/galileu-exterior-noche-thumb.jpg', fullUrl: 'assets/images/realestate/galileu-exterior-noche.jpg' },
        { id: 'AR_VM_006', thumbUrl: 'assets/images/realestate/burgueras-fachada-thumb.jpg', fullUrl: 'assets/images/realestate/burgueras-fachada.jpg' }
      ]
    }
  };

  async function init() {
    if (emailService.initEmailService) emailService.initEmailService();
    if (db.initStorage) await db.initStorage();

    const params = new URLSearchParams(window.location.search);
    const sessionId = (params.get('session') || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
    const legacyPin = params.get('pin');

    // Higiene de seguridad: eliminar el PIN de la barra de direcciones si venía en un enlace antiguo
    if (legacyPin !== null && window.history && window.history.replaceState) {
      params.delete('pin');
      const qs = params.toString();
      const cleanUrl = window.location.pathname + (qs ? '?' + qs : '');
      window.history.replaceState({}, document.title, cleanUrl);
    }

    if (sessionId && legacyPin) {
      try {
        const sessionData = await getSessionData(sessionId);
        if (sessionData && await isPinValid(sessionData, legacyPin)) {
          unlockSession(sessionData);
          return;
        }
      } catch (e) {
        console.warn('No se pudo cargar sesión directa:', e);
      }
    }

    showAuthModal(sessionId);
  }

  function showAuthModal(preselectedId = '') {
    if (dom.authCodeInput && preselectedId) {
      dom.authCodeInput.value = preselectedId;
    }
    if (dom.authModal && typeof dom.authModal.showModal === 'function') {
      dom.authModal.showModal();
    }
  }

  if (dom.authForm) {
    dom.authForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Protección frente a fuerza bruta en cliente
      try {
        const lock = JSON.parse(sessionStorage.getItem(PIN_LOCK_KEY) || '{"count":0,"until":0}');
        const now = Date.now();
        if (lock.until && now < lock.until) {
          const waitSec = Math.ceil((lock.until - now) / 1000);
          if (dom.authError) {
            dom.authError.textContent = `Demasiados intentos. Espera ${waitSec} segundos antes de intentarlo de nuevo.`;
            dom.authError.style.display = 'block';
          }
          return;
        }
      } catch (err) {}

      const rawCode = (dom.authCodeInput ? dom.authCodeInput.value.trim() : '').toLowerCase();
      const enteredCode = rawCode.replace(/[^a-z0-9_-]/g, '');
      const enteredPin = dom.authPinInput ? dom.authPinInput.value.trim() : '';

      const directSlugs = ['cliente-1', 'villa-galileu', 'boda-laura-carlos'];
      if (directSlugs.includes(enteredCode) && enteredCode !== 'boda-laura-carlos') {
        window.location.href = `galeria/${encodeURIComponent(enteredCode)}/`;
        return;
      }

      try {
        const selectedSessionId = enteredCode || (dom.authSessionSelect ? dom.authSessionSelect.value : '');
        const sessionData = await getSessionData(selectedSessionId);
        if (!sessionData) {
          if (enteredCode && directSlugs.includes(enteredCode)) {
            window.location.href = `galeria/${encodeURIComponent(enteredCode)}/`;
            return;
          }
          throw new Error('Sesión no encontrada');
        }

        const pinOk = await isPinValid(sessionData, enteredPin);
        if (!pinOk) {
          try {
            const lock = JSON.parse(sessionStorage.getItem(PIN_LOCK_KEY) || '{"count":0,"until":0}');
            const nextCount = (lock.count || 0) + 1;
            const nextUntil = nextCount >= MAX_PIN_ATTEMPTS ? Date.now() + PIN_LOCKOUT_MS : 0;
            sessionStorage.setItem(PIN_LOCK_KEY, JSON.stringify({ count: nextCount, until: nextUntil }));
          } catch (e2) {}

          if (dom.authError) {
            dom.authError.textContent = 'Código PIN incorrecto. Por favor verifícalo con el fotógrafo.';
            dom.authError.style.display = 'block';
          }
          return;
        }

        try {
          sessionStorage.removeItem(PIN_LOCK_KEY);
        } catch (e3) {}
        if (dom.authError) dom.authError.style.display = 'none';
        if (dom.authModal) dom.authModal.close();
        unlockSession(sessionData);
      } catch (err) {
        if (dom.authError) {
          dom.authError.textContent = 'Galería no encontrada o código PIN no válido.';
          dom.authError.style.display = 'block';
        }
      }
    });
  }

  async function getSessionData(sessionId) {
    if (!sessionId || !/^[a-zA-Z0-9_-]+$/.test(sessionId)) return null;

    try {
      if (db && db.getClientSessionById) {
        const dbSession = await db.getClientSessionById(sessionId);
        if (dbSession) return dbSession;
      }
    } catch (e) {
      console.warn('Error consultando base de datos:', e);
    }

    if (FALLBACK_DATA[sessionId]) {
      return FALLBACK_DATA[sessionId];
    }

    try {
      const res = await fetch(`data/sessions/${encodeURIComponent(sessionId)}.json`);
      if (res.ok) return await res.json();
    } catch (e) {}

    return null;
  }

  function unlockSession(sessionData) {
    state.session = sessionData;
    state.isUnlocked = true;

    dom.sessionBadge.textContent = sessionData.clientName || 'Cliente';
    dom.sessionTitle.textContent = sessionData.title;
    dom.sessionMeta.textContent = `${sessionData.date || ''} • ${sessionData.location || ''} • Límite sugerido: ${sessionData.maxSelectable || 'Ilimitado'} fotos`;
    dom.totalCount.textContent = (sessionData.photos || []).length;

    if (sessionData.clientName) {
      const clientInput = document.getElementById('client-name');
      if (clientInput) clientInput.value = sessionData.clientName;
    }

    renderGallery();
    updateUI();
  }

  function renderGallery() {
    if (!dom.grid || !state.session) return;
    dom.grid.innerHTML = '';

    const photos = state.session.photos || [];
    const photosToDisplay = state.activeFilter === 'selected'
      ? photos.filter((p) => state.selectedPhotoIds.has(p.id))
      : photos;

    if (photosToDisplay.length === 0 && state.activeFilter === 'selected') {
      dom.grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-pure);">No tienes ninguna fotografía seleccionada aún.</p>
          <p style="font-size: 0.85rem;">Haz clic sobre cualquier foto para añadirla a tu selección.</p>
        </div>
      `;
      return;
    }

    photosToDisplay.forEach((photo) => {
      const isSelected = state.selectedPhotoIds.has(photo.id);
      const card = document.createElement('article');
      card.className = `photo-card ${isSelected ? 'is-selected' : ''}`;
      card.dataset.photoId = photo.id;
      card.setAttribute('role', 'checkbox');
      card.setAttribute('aria-checked', String(isSelected));
      card.setAttribute('aria-label', `Fotografía ${photo.id}`);
      card.setAttribute('tabindex', '0');

      const safeThumb = escapeHtml(photo.thumbUrl || photo.fullUrl);
      const safeId = escapeHtml(photo.id);

      card.innerHTML = `
        <button type="button" class="zoom-btn" title="Ver foto en grande" aria-label="Ampliar fotografía ${safeId}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>

        <div class="select-toggle" title="Seleccionar/Deseleccionar" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>

        <img src="${safeThumb}" alt="Fotografía ${safeId}" loading="lazy" decoding="async">
        <span class="photo-code">${safeId}</span>
      `;

      dom.grid.appendChild(card);
    });
  }

  function togglePhoto(photoId) {
    if (!state.session) return;

    if (state.selectedPhotoIds.has(photoId)) {
      state.selectedPhotoIds.delete(photoId);
    } else {
      if (state.session.maxSelectable && state.selectedPhotoIds.size >= state.session.maxSelectable) {
        alert(`Has alcanzado el límite recomendado de ${state.session.maxSelectable} fotos.`);
        return;
      }
      state.selectedPhotoIds.add(photoId);
    }

    const cards = dom.grid.querySelectorAll('.photo-card');
    cards.forEach((c) => {
      if (c.dataset.photoId === photoId) {
        const isSelected = state.selectedPhotoIds.has(photoId);
        c.classList.toggle('is-selected', isSelected);
        c.setAttribute('aria-checked', String(isSelected));
      }
    });

    if (state.activeFilter === 'selected') {
      renderGallery();
    }

    updateUI();
  }

  function updateUI() {
    const count = state.selectedPhotoIds.size;
    dom.selectedBadge.textContent = count;
    dom.filterSelectedCount.textContent = count;
    dom.modalSelectedCount.textContent = count;

    dom.summaryText.textContent = count === 1 ? '1 foto elegida' : `${count} fotos elegidas`;
    dom.btnSubmit.disabled = count === 0;
  }

  if (dom.grid) {
    dom.grid.addEventListener('click', (e) => {
      const card = e.target.closest('.photo-card');
      if (!card) return;

      const photoId = card.dataset.photoId;
      const isZoomClick = e.target.closest('.zoom-btn');

      if (isZoomClick) {
        e.stopPropagation();
        const photo = (state.session.photos || []).find((p) => p.id === photoId);
        if (photo) openProofingLightbox(photo);
        return;
      }

      togglePhoto(photoId);
    });

    dom.grid.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        const card = e.target.closest('.photo-card');
        if (card && !e.target.closest('.zoom-btn')) {
          e.preventDefault();
          togglePhoto(card.dataset.photoId);
        }
      }
    });
  }

  dom.filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      dom.filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.filter;
      renderGallery();
    });
  });

  if (dom.btnClear) {
    dom.btnClear.addEventListener('click', () => {
      if (state.selectedPhotoIds.size === 0) return;
      if (confirm('¿Deseas desmarcar todas las fotos de tu selección?')) {
        state.selectedPhotoIds.clear();
        renderGallery();
        updateUI();
      }
    });
  }

  function openProofingLightbox(photo) {
    currentLightboxPhoto = photo;
    dom.lightboxImg.src = photo.fullUrl || photo.thumbUrl;
    dom.lightboxCode.textContent = photo.id;
    updateLightboxToggle();
    dom.lightbox.classList.add('active');
    dom.lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeProofingLightbox() {
    dom.lightbox.classList.remove('active');
    dom.lightbox.setAttribute('aria-hidden', 'true');
    dom.lightboxImg.src = '';
    currentLightboxPhoto = null;
    document.body.style.overflow = 'auto';
  }

  function navigateProofingLightbox(delta) {
    if (!currentLightboxPhoto || !state.session) return;
    const list = state.session.photos || [];
    const idx = list.findIndex((p) => p.id === currentLightboxPhoto.id);
    if (idx < 0 || list.length === 0) return;
    const nextIdx = (idx + delta + list.length) % list.length;
    openProofingLightbox(list[nextIdx]);
  }

  function updateLightboxToggle() {
    if (!currentLightboxPhoto) return;
    const isSelected = state.selectedPhotoIds.has(currentLightboxPhoto.id);
    dom.lightboxToggle.textContent = isSelected ? '✓ Seleccionada (Quitar)' : '+ Seleccionar foto';
    dom.lightboxToggle.className = isSelected ? 'btn-bar-clear' : 'btn-bar-submit';
  }

  if (dom.lightboxToggle) {
    dom.lightboxToggle.addEventListener('click', () => {
      if (!currentLightboxPhoto) return;
      togglePhoto(currentLightboxPhoto.id);
      updateLightboxToggle();
    });
  }

  if (dom.lightboxClose) dom.lightboxClose.addEventListener('click', closeProofingLightbox);
  if (dom.lightbox) {
    dom.lightbox.addEventListener('click', (e) => {
      if (e.target === dom.lightbox) closeProofingLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!dom.lightbox || !dom.lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeProofingLightbox();
    if (e.key === 'ArrowLeft') navigateProofingLightbox(-1);
    if (e.key === 'ArrowRight') navigateProofingLightbox(1);
  });

  function resetOrderModalState() {
    if (dom.orderFieldsWrap) dom.orderFieldsWrap.style.display = 'block';
    if (dom.directPanel) dom.directPanel.style.display = 'none';
  }

  if (dom.btnSubmit) {
    dom.btnSubmit.addEventListener('click', () => {
      resetOrderModalState();
      dom.modalSelectedCount.textContent = state.selectedPhotoIds.size;
      dom.orderModal.showModal();
    });
  }

  if (dom.btnModalCancel) {
    dom.btnModalCancel.addEventListener('click', () => {
      dom.orderModal.close();
    });
  }

  if (dom.btnOrderDone) {
    dom.btnOrderDone.addEventListener('click', () => {
      dom.orderModal.close();
    });
  }

  if (dom.btnOrderCopy) {
    dom.btnOrderCopy.addEventListener('click', () => {
      if (!lastSummaryText) return;
      navigator.clipboard.writeText(lastSummaryText).then(() => {
        dom.btnOrderCopy.textContent = '✓ Lista copiada al portapapeles';
        setTimeout(() => {
          dom.btnOrderCopy.textContent = 'Copiar lista de fotos al portapapeles';
        }, 2500);
      }).catch(() => {
        prompt('Copia tu selección de fotos:', lastSummaryText);
      });
    });
  }

  if (dom.orderForm) {
    dom.orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      dom.btnModalSubmit.disabled = true;
      dom.btnModalSubmit.textContent = 'Procesando selección...';

      const payload = {
        sessionId: state.session.id,
        sessionTitle: state.session.title,
        clientName: document.getElementById('client-name').value.trim(),
        clientEmail: document.getElementById('client-email').value.trim(),
        notes: document.getElementById('order-notes').value.trim(),
        selectedPhotos: Array.from(state.selectedPhotoIds)
      };

      try {
        const result = emailService.sendOrder
          ? await emailService.sendOrder(payload)
          : { success: false, mode: 'direct_channel', message: 'Selecciona el canal de envío.' };

        lastSummaryText = result.summaryText || payload.selectedPhotos.join(', ');

        if (window.AndresAnalytics && window.AndresAnalytics.trackEvent) {
          window.AndresAnalytics.trackEvent('conversion', 'submit_proofing_order', payload.sessionId, payload.selectedPhotos.length);
        }

        if (result.success) {
          alert(`¡Listo! Se ha enviado tu selección de ${payload.selectedPhotos.length} fotos a Andrés Reginensi.\n\n${result.message}`);
          dom.orderModal.close();
        } else if (dom.directPanel) {
          if (dom.orderFieldsWrap) dom.orderFieldsWrap.style.display = 'none';
          dom.directPanel.style.display = 'block';
          if (dom.directMsg) dom.directMsg.textContent = result.message;
          if (dom.btnOrderWhatsapp && result.whatsappUrl) dom.btnOrderWhatsapp.href = result.whatsappUrl;
          if (dom.btnOrderMailto && result.mailtoUrl) dom.btnOrderMailto.href = result.mailtoUrl;
        }
      } catch (err) {
        alert('Ocurrió un inconveniente al preparar el pedido: ' + err.message);
      } finally {
        dom.btnModalSubmit.disabled = false;
        dom.btnModalSubmit.textContent = 'Preparar y Enviar Selección';
      }
    });
  }

  init();
})();
