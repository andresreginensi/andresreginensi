/**
 * ==========================================================================
 * ANDRÉS REGINENSI PHOTOGRAPHY — SCRIPT DE GALERÍA PRIVADA DE CLIENTE
 * Validación de PIN en frontend, visualización fluida y descarga directa
 * ==========================================================================
 */

(function () {
  'use strict';

  // Configuración por defecto si no estuviera definida en la página
  const config = window.GALLERY_CONFIG || {
    title: 'Galería Privada',
    client: 'Cliente',
    date: '',
    location: '',
    pin: '1234',
    zipDownloadUrl: '',
    photos: []
  };

  const storageKey = 'auth_galeria_' + (window.location.pathname.replace(/\/+$/, '') || 'root');

  // Elementos del DOM
  const pinScreen = document.getElementById('pin-screen');
  const pinForm = document.getElementById('pin-form');
  const pinInput = document.getElementById('pin-input');
  const pinError = document.getElementById('pin-error');
  const galleryLayout = document.getElementById('gallery-layout');

  const elTitle = document.getElementById('gallery-title');
  const elClient = document.getElementById('gallery-client');
  const elMetaDate = document.getElementById('gallery-meta-date');
  const elMetaLocation = document.getElementById('gallery-meta-location');
  const elMetaCount = document.getElementById('gallery-meta-count');
  const photoGrid = document.getElementById('photo-grid');

  const btnDownloadAll = document.getElementById('btn-download-all');
  const btnLock = document.getElementById('btn-lock');

  // Lightbox
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxBtnDownload = document.getElementById('lightbox-btn-download');
  const lightboxBtnPrev = document.getElementById('lightbox-btn-prev');
  const lightboxBtnNext = document.getElementById('lightbox-btn-next');
  const lightboxBtnClose = document.getElementById('lightbox-btn-close');

  let currentPhotoIndex = 0;

  // 1. Inicialización
  function init() {
    // Si ya fue desbloqueada en esta sesión de navegador, mostrar directamente
    if (sessionStorage.getItem(storageKey) === 'true') {
      unlockGallery(false);
    } else {
      if (pinInput) pinInput.focus();
    }

    setupEventListeners();
  }

  // 2. Control de eventos
  function setupEventListeners() {
    if (pinForm) {
      pinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        validatePin();
      });
    }

    if (btnDownloadAll) {
      btnDownloadAll.addEventListener('click', (e) => {
        e.preventDefault();
        handleDownloadAll();
      });
    }

    if (btnLock) {
      btnLock.addEventListener('click', () => {
        lockGallery();
      });
    }

    // Lightbox controles
    if (lightboxBtnClose) {
      lightboxBtnClose.addEventListener('click', closeLightbox);
    }
    if (lightbox) {
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
      });
    }
    if (lightboxBtnPrev) {
      lightboxBtnPrev.addEventListener('click', showPrevPhoto);
    }
    if (lightboxBtnNext) {
      lightboxBtnNext.addEventListener('click', showNextPhoto);
    }

    document.addEventListener('keydown', (e) => {
      if (!lightbox || !lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrevPhoto();
      if (e.key === 'ArrowRight') showNextPhoto();
    });
  }

  // 3. Validación de PIN
  function validatePin() {
    const entered = (pinInput ? pinInput.value : '').trim();
    const expected = String(config.pin || '').trim();

    if (entered === expected) {
      if (pinError) pinError.classList.remove('visible');
      sessionStorage.setItem(storageKey, 'true');
      unlockGallery(true);
    } else {
      if (pinError) {
        pinError.textContent = 'Código PIN incorrecto. Por favor, verifícalo con Andrés.';
        pinError.classList.add('visible');
      }
      if (pinInput) {
        pinInput.classList.add('shake');
        setTimeout(() => pinInput.classList.remove('shake'), 450);
        pinInput.value = '';
        pinInput.focus();
      }
    }
  }

  // 4. Desbloqueo y render de galería
  function unlockGallery(withAnimation) {
    if (pinScreen) {
      pinScreen.classList.add('unlocked');
    }
    if (galleryLayout) {
      galleryLayout.classList.add('active');
    }

    renderGalleryData();
  }

  function lockGallery() {
    sessionStorage.removeItem(storageKey);
    if (galleryLayout) galleryLayout.classList.remove('active');
    if (pinScreen) pinScreen.classList.remove('unlocked');
    if (pinInput) {
      pinInput.value = '';
      pinInput.focus();
    }
  }

  // 5. Poblar datos y fotos en el DOM
  function renderGalleryData() {
    if (elTitle) elTitle.textContent = config.title;
    if (elClient) elClient.textContent = config.client || 'Cliente';
    if (elMetaDate) elMetaDate.textContent = config.date ? `📅 ${config.date}` : '';
    if (elMetaLocation) elMetaLocation.textContent = config.location ? `📍 ${config.location}` : '';
    if (elMetaCount) elMetaCount.textContent = `🖼️ ${config.photos.length} fotografías en alta resolución`;

    if (!photoGrid) return;
    photoGrid.innerHTML = '';

    config.photos.forEach((photo, idx) => {
      const card = document.createElement('article');
      card.className = 'photo-card';

      const filename = photo.full ? photo.full.split('/').pop() : `foto-${idx + 1}.jpg`;

      card.innerHTML = `
        <div class="photo-img-wrap" data-index="${idx}">
          <img src="${photo.thumb || photo.full}" alt="${photo.caption || photo.title || 'Fotografía'}" loading="lazy">
        </div>
        <div class="photo-card-footer">
          <div class="photo-info">
            <h3 class="photo-caption">${photo.caption || photo.title || `Foto ${idx + 1}`}</h3>
            <span class="photo-id-tag">${photo.id || `AR-${idx + 1}`}</span>
          </div>
          <button class="btn-photo-download" data-url="${photo.full}" data-name="${filename}" title="Descargar en alta resolución">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Descargar
          </button>
        </div>
      `;

      // Clic en la foto para abrir Lightbox
      card.querySelector('.photo-img-wrap').addEventListener('click', () => {
        openLightbox(idx);
      });

      // Botón individual de descarga
      card.querySelector('.btn-photo-download').addEventListener('click', (e) => {
        e.stopPropagation();
        triggerDownload(photo.full, filename);
      });

      photoGrid.appendChild(card);
    });
  }

  // 6. Funcionalidad de Descarga
  function triggerDownload(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'fotografia.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleDownloadAll() {
    if (config.zipDownloadUrl) {
      window.open(config.zipDownloadUrl, '_blank');
      return;
    }

    if (confirm(`¿Deseas descargar las ${config.photos.length} fotografías de esta sesión a tu dispositivo?`)) {
      config.photos.forEach((photo, idx) => {
        setTimeout(() => {
          const filename = photo.full ? photo.full.split('/').pop() : `foto-${idx + 1}.jpg`;
          triggerDownload(photo.full, filename);
        }, idx * 300);
      });
    }
  }

  // 7. Lightbox Fullscreen
  function openLightbox(index) {
    currentPhotoIndex = index;
    updateLightboxContent();
    if (lightbox) {
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function updateLightboxContent() {
    const photo = config.photos[currentPhotoIndex];
    if (!photo || !lightboxImg) return;

    lightboxImg.src = photo.full || photo.thumb;
    if (lightboxCaption) {
      lightboxCaption.textContent = photo.caption || photo.title || `Foto ${currentPhotoIndex + 1} de ${config.photos.length}`;
    }

    if (lightboxBtnDownload) {
      lightboxBtnDownload.onclick = () => {
        const filename = photo.full ? photo.full.split('/').pop() : `foto-${currentPhotoIndex + 1}.jpg`;
        triggerDownload(photo.full, filename);
      };
    }
  }

  function showPrevPhoto() {
    currentPhotoIndex = (currentPhotoIndex - 1 + config.photos.length) % config.photos.length;
    updateLightboxContent();
  }

  function showNextPhoto() {
    currentPhotoIndex = (currentPhotoIndex + 1) % config.photos.length;
    updateLightboxContent();
  }

  // Ejecutar al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

