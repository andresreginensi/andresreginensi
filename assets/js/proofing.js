const emailService = window.EmailService || {};
const db = window.AndresDB || {};

// ==========================================
// 1. ESTADO DE LA APLICACIÓN (State Store)
// ==========================================
const state = {
  session: null,
  selectedPhotoIds: new Set(),
  activeFilter: 'all', // 'all' | 'selected'
  isUnlocked: false
};

// Mapa dinámico de sesiones
let dynamicSessions = [];

// ==========================================
// 2. REFERENCIAS AL DOM
// ==========================================
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
  modalSelectedCount: document.getElementById('modal-selected-count'),
  btnModalCancel: document.getElementById('btn-modal-cancel'),
  btnModalSubmit: document.getElementById('btn-modal-submit'),

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

// ==========================================
// 3. INICIALIZACIÓN Y CONTROL DE ACCESO
// ==========================================
async function init() {
  if (emailService.initEmailService) emailService.initEmailService();
  if (db.initStorage) await db.initStorage();
  if (db.getAllClientSessions) {
    dynamicSessions = await db.getAllClientSessions();
  }

  // Leer parámetros de la URL: ?session=boda-laura-carlos&pin=2026
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session');
  const sessionPin = params.get('pin');

  if (sessionId) {
    try {
      const sessionData = await getSessionData(sessionId);
      if (sessionData && (!sessionData.pin || sessionData.pin === sessionPin)) {
        unlockSession(sessionData);
        return;
      }
    } catch (e) {
      console.warn('No se pudo cargar sesión directa:', e);
    }
  }

  // Si no se pasó por URL o el PIN no coincide, mostramos el modal de acceso
  showAuthModal(sessionId);
}

function showAuthModal(preselectedId = '') {
  if (dom.authCodeInput && preselectedId) {
    dom.authCodeInput.value = preselectedId;
  }
  if (dom.authModal) {
    dom.authModal.showModal();
  }
}

if (dom.authForm) {
  dom.authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const enteredCode = (dom.authCodeInput ? dom.authCodeInput.value.trim() : '').toLowerCase();
    const enteredPin = dom.authPinInput ? dom.authPinInput.value.trim() : '';

    // Si coincide con alguna de las rutas de galería directa, redirigir
    const directSlugs = ['cliente-1', 'villa-galileu', 'boda-laura-carlos'];
    if (directSlugs.includes(enteredCode)) {
      window.location.href = `galeria/${enteredCode}/`;
      return;
    }

    try {
      const selectedSessionId = enteredCode || (dom.authSessionSelect ? dom.authSessionSelect.value : '');
      const sessionData = await getSessionData(selectedSessionId);
      if (!sessionData) {
        // Redirigir a la carpeta si existe
        if (enteredCode) {
          window.location.href = `galeria/${enteredCode}/`;
          return;
        }
        throw new Error('Sesión no encontrada');
      }

      if (sessionData.pin && sessionData.pin !== enteredPin) {
        if (dom.authError) {
          dom.authError.textContent = 'Código PIN incorrecto. Por favor verifícalo con el fotógrafo.';
          dom.authError.style.display = 'block';
        }
        return;
      }

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

// Datos embebidos como fallback si se abre con doble clic (protocolo file:// sin servidor local)
const FALLBACK_DATA = {
  'boda-laura-carlos': {
    "id": "boda-laura-carlos",
    "pin": "2026",
    "title": "Boda Laura & Carlos — Reportaje Documental",
    "date": "18 de Octubre, 2026",
    "location": "Finca Bellver, Mallorca",
    "clientName": "Laura Gómez & Carlos Martínez",
    "maxSelectable": 50,
    "photos": [
      { "id": "AR_LC_001", "thumbUrl": "assets/images/bodas/boda-salida-arroz-thumb.jpg", "fullUrl": "assets/images/bodas/boda-salida-arroz.jpg" },
      { "id": "AR_LC_002", "thumbUrl": "assets/images/bodas/boda-editorial-calle-thumb.jpg", "fullUrl": "assets/images/bodas/boda-editorial-calle.jpg" },
      { "id": "AR_LC_003", "thumbUrl": "assets/images/bodas/boda-playa-orilla-thumb.jpg", "fullUrl": "assets/images/bodas/boda-playa-orilla.jpg" },
      { "id": "AR_LC_004", "thumbUrl": "assets/images/bodas/boda-alianzas-manos-thumb.jpg", "fullUrl": "assets/images/bodas/boda-alianzas-manos.jpg" }
    ]
  },
  'inmobiliaria-villa-mediterranea': {
    "id": "inmobiliaria-villa-mediterranea",
    "pin": "1234",
    "title": "Villa Galileu - Reportaje Arquitectura & Lujo",
    "date": "20 de Octubre, 2026",
    "location": "Jávea, Alicante",
    "clientName": "Habitat Luxury Real Estate",
    "maxSelectable": 25,
    "photos": [
      { "id": "AR_VM_001", "thumbUrl": "assets/images/realestate/galileu-piscina-thumb.jpg", "fullUrl": "assets/images/realestate/galileu-piscina.jpg" },
      { "id": "AR_VM_002", "thumbUrl": "assets/images/realestate/galileu-salon-thumb.jpg", "fullUrl": "assets/images/realestate/galileu-salon.jpg" },
      { "id": "AR_VM_003", "thumbUrl": "assets/images/realestate/galileu-cocina-thumb.jpg", "fullUrl": "assets/images/realestate/galileu-cocina.jpg" },
      { "id": "AR_VM_004", "thumbUrl": "assets/images/realestate/galileu-escalera-thumb.jpg", "fullUrl": "assets/images/realestate/galileu-escalera.jpg" },
      { "id": "AR_VM_005", "thumbUrl": "assets/images/realestate/galileu-exterior-noche-thumb.jpg", "fullUrl": "assets/images/realestate/galileu-exterior-noche.jpg" },
      { "id": "AR_VM_006", "thumbUrl": "assets/images/realestate/burgueras-fachada-thumb.jpg", "fullUrl": "assets/images/realestate/burgueras-fachada.jpg" }
    ]
  }
};

async function getSessionData(sessionId) {
  // Primero buscar en la base de datos local
  try {
    if (db && db.getClientSessionById) {
      const dbSession = await db.getClientSessionById(sessionId);
      if (dbSession) return dbSession;
    }
  } catch (e) {
    console.warn('Error consultando base de datos:', e);
  }

  // Fallback si no está en IndexedDB
  if (FALLBACK_DATA[sessionId]) {
    return FALLBACK_DATA[sessionId];
  }

  // Intentar cargar JSON local si existe
  try {
    const res = await fetch(`data/sessions/${sessionId}.json`);
    if (res.ok) return await res.json();
  } catch (e) {
    // ignorar
  }

  return null;
}

function unlockSession(sessionData) {
  state.session = sessionData;
  state.isUnlocked = true;

  // Header info
  dom.sessionBadge.textContent = sessionData.clientName || 'Cliente';
  dom.sessionTitle.textContent = sessionData.title;
  dom.sessionMeta.textContent = `${sessionData.date} • ${sessionData.location || ''} • Límite sugerido: ${sessionData.maxSelectable || 'Ilimitado'} fotos`;
  dom.totalCount.textContent = sessionData.photos.length;

  // Precargar nombre y email si existen en los datos
  if (sessionData.clientName) {
    document.getElementById('client-name').value = sessionData.clientName;
  }

  renderGallery();
  updateUI();
}

// ==========================================
// 4. RENDERIZADO DE FOTOS
// ==========================================
function renderGallery() {
  dom.grid.innerHTML = '';

  const photos = state.session.photos;
  const photosToDisplay = state.activeFilter === 'selected'
    ? photos.filter(p => state.selectedPhotoIds.has(p.id))
    : photos;

  if (photosToDisplay.length === 0 && state.activeFilter === 'selected') {
    dom.grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-secondary);">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No tienes ninguna fotografía seleccionada aún.</p>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Haz clic sobre cualquier foto para añadirla a tu selección.</p>
      </div>
    `;
    return;
  }

  photosToDisplay.forEach(photo => {
    const isSelected = state.selectedPhotoIds.has(photo.id);
    const card = document.createElement('article');
    card.className = `photo-card ${isSelected ? 'is-selected' : ''}`;
    card.dataset.photoId = photo.id;
    card.setAttribute('role', 'checkbox');
    card.setAttribute('aria-checked', isSelected);
    card.setAttribute('tabindex', '0');

    card.innerHTML = `
      <!-- Botón de Zoom -->
      <button class="zoom-btn" title="Ver foto en grande" aria-label="Ampliar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="11" y1="8" x2="11" y2="14"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>

      <!-- Indicador de Checkbox -->
      <div class="select-toggle" title="Seleccionar/Deseleccionar">
        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      </div>

      <!-- Imagen -->
      <img src="${photo.thumbUrl}" alt="Fotografía ${photo.id}" loading="lazy" decoding="async">
      <span class="photo-code">${photo.id}</span>
    `;

    dom.grid.appendChild(card);
  });
}

// ==========================================
// 5. GESTIÓN DEL ESTADO DE SELECCIÓN
// ==========================================
function togglePhoto(photoId) {
  if (state.selectedPhotoIds.has(photoId)) {
    state.selectedPhotoIds.delete(photoId);
  } else {
    // Verificación de límite máximo si está configurado
    if (state.session.maxSelectable && state.selectedPhotoIds.size >= state.session.maxSelectable) {
      alert(`Has alcanzado el límite recomendado de ${state.session.maxSelectable} fotos.`);
      return;
    }
    state.selectedPhotoIds.add(photoId);
  }

  // Actualizar tarjeta en el DOM sin re-renderizar todo el grid para máximo rendimiento
  const card = dom.grid.querySelector(`[data-photo-id="${photoId}"]`);
  if (card) {
    const isSelected = state.selectedPhotoIds.has(photoId);
    card.classList.toggle('is-selected', isSelected);
    card.setAttribute('aria-checked', isSelected);
  }

  // Si estamos en filtro "Solo seleccionadas", actualizamos la vista
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

// ==========================================
// 6. EVENTOS DE LA GALERÍA
// ==========================================

// Event delegation para clic en tarjeta o lupa
dom.grid.addEventListener('click', (e) => {
  const card = e.target.closest('.photo-card');
  if (!card) return;

  const photoId = card.dataset.photoId;
  const isZoomClick = e.target.closest('.zoom-btn');

  if (isZoomClick) {
    e.stopPropagation();
    const photo = state.session.photos.find(p => p.id === photoId);
    if (photo) openProofingLightbox(photo);
    return;
  }

  togglePhoto(photoId);
});

// Soporte con teclado
dom.grid.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    const card = e.target.closest('.photo-card');
    if (card) {
      e.preventDefault();
      togglePhoto(card.dataset.photoId);
    }
  }
});

// Filtros de vista
dom.filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    dom.filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeFilter = btn.dataset.filter;
    renderGallery();
  });
});

// Limpiar selección
dom.btnClear.addEventListener('click', () => {
  if (state.selectedPhotoIds.size === 0) return;
  if (confirm('¿Deseas desmarcar todas las fotos de tu selección?')) {
    state.selectedPhotoIds.clear();
    renderGallery();
    updateUI();
  }
});

// ==========================================
// 7. LIGHTBOX PARA PREVISUALIZAR
// ==========================================
function openProofingLightbox(photo) {
  currentLightboxPhoto = photo;
  dom.lightboxImg.src = photo.fullUrl || photo.thumbUrl;
  dom.lightboxCode.textContent = photo.id;
  updateLightboxToggle();
  dom.lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProofingLightbox() {
  dom.lightbox.classList.remove('active');
  dom.lightboxImg.src = '';
  currentLightboxPhoto = null;
  document.body.style.overflow = 'auto';
}

function updateLightboxToggle() {
  if (!currentLightboxPhoto) return;
  const isSelected = state.selectedPhotoIds.has(currentLightboxPhoto.id);
  dom.lightboxToggle.textContent = isSelected ? '✓ Seleccionada (Quitar)' : '+ Seleccionar foto';
  dom.lightboxToggle.className = isSelected ? 'btn-bar-clear' : 'btn-bar-submit';
}

dom.lightboxToggle.addEventListener('click', () => {
  if (!currentLightboxPhoto) return;
  togglePhoto(currentLightboxPhoto.id);
  updateLightboxToggle();
});

dom.lightboxClose.addEventListener('click', closeProofingLightbox);
dom.lightbox.addEventListener('click', (e) => {
  if (e.target === dom.lightbox) closeProofingLightbox();
});

// ==========================================
// 8. ENVÍO DE PEDIDO (FORMULARIO & API)
// ==========================================
dom.btnSubmit.addEventListener('click', () => {
  dom.modalSelectedCount.textContent = state.selectedPhotoIds.size;
  dom.orderModal.showModal();
});

dom.btnModalCancel.addEventListener('click', () => {
  dom.orderModal.close();
});

dom.orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  dom.btnModalSubmit.disabled = true;
  dom.btnModalSubmit.textContent = 'Enviando selección...';

  const payload = {
    sessionId: state.session.id,
    sessionTitle: state.session.title,
    clientName: document.getElementById('client-name').value.trim(),
    clientEmail: document.getElementById('client-email').value.trim(),
    notes: document.getElementById('order-notes').value.trim(),
    selectedPhotos: Array.from(state.selectedPhotoIds)
  };

  try {
    const result = emailService.sendOrder ? await emailService.sendOrder(payload) : { message: 'Pedido registrado.' };
    alert(`¡Listo! Se ha enviado tu selección de ${payload.selectedPhotos.length} fotos a Andrés Reginensi.\n\n${result.message}`);
    dom.orderModal.close();
  } catch (err) {
    alert('Ocurrió un inconveniente al enviar el pedido: ' + err.message);
  } finally {
    dom.btnModalSubmit.disabled = false;
    dom.btnModalSubmit.textContent = 'Confirmar y Enviar Selección';
  }
});

// Iniciar aplicación
init();
