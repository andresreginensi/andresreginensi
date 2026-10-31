/**
 * ==========================================================================
 * ANDRÉS REGINENSI PHOTOGRAPHY — SCRIPT DE GALERÍA PRIVADA DE CLIENTE
 * Validación de PIN con soporte SHA-256, límite de intentos, sanitización XSS
 * y descarga directa.
 * ==========================================================================
 */

(function () {
  'use strict';

  const config = window.GALLERY_CONFIG || {
    title: 'Galería Privada',
    client: 'Cliente',
    date: '',
    location: '',
    pin: '',
    pinHash: '',
    zipDownloadUrl: '',
    photos: []
  };

  const cleanPath = window.location.pathname.replace(/\/+$/, '') || 'root';
  const storageKey = 'auth_galeria_' + cleanPath;
  const lockKey = 'lock_galeria_' + cleanPath;
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 60 * 1000;

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

  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxBtnDownload = document.getElementById('lightbox-btn-download');
  const lightboxBtnPrev = document.getElementById('lightbox-btn-prev');
  const lightboxBtnNext = document.getElementById('lightbox-btn-next');
  const lightboxBtnClose = document.getElementById('lightbox-btn-close');

  let currentPhotoIndex = 0;

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

  function init() {
    try {
      if (sessionStorage.getItem(storageKey) === 'true') {
        unlockGallery();
      } else if (pinInput) {
        pinInput.focus();
      }
    } catch (e) {
      if (pinInput) pinInput.focus();
    }

    setupEventListeners();
  }

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

  async function validatePin() {
    try {
      const lockState = JSON.parse(sessionStorage.getItem(lockKey) || '{"count":0,"until":0}');
      const now = Date.now();
      if (lockState.until && now < lockState.until) {
        const waitSec = Math.ceil((lockState.until - now) / 1000);
        if (pinError) {
          pinError.textContent = `Demasiados intentos. Espera ${waitSec} segundos para volver a intentarlo.`;
          pinError.classList.add('visible');
        }
        return;
      }
    } catch (e) {}

    const entered = (pinInput ? pinInput.value : '').trim();
    let matched = false;

    if (config.pinHash) {
      const enteredHash = await sha256Hex(entered);
      matched = Boolean(enteredHash && enteredHash === String(config.pinHash).trim());
    } else if (config.pin) {
      matched = entered === String(config.pin).trim();
    }

    if (matched) {
      if (pinError) pinError.classList.remove('visible');
      try {
        sessionStorage.removeItem(lockKey);
        sessionStorage.setItem(storageKey, 'true');
      } catch (e) {}
      unlockGallery();
    } else {
      let blocked = false;
      try {
        const lockState = JSON.parse(sessionStorage.getItem(lockKey) || '{"count":0,"until":0}');
        const nextCount = (lockState.count || 0) + 1;
        const nextUntil = nextCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
        blocked = Boolean(nextUntil);
        sessionStorage.setItem(lockKey, JSON.stringify({ count: nextCount, until: nextUntil }));
      } catch (e) {}

      if (pinError) {
        pinError.textContent = blocked
          ? 'Acceso bloqueado durante 60 segundos tras varios intentos fallidos.'
          : 'Código PIN incorrecto. Por favor, verifícalo con Andrés.';
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

  function unlockGallery() {
    if (pinScreen) pinScreen.classList.add('unlocked');
    if (galleryLayout) galleryLayout.classList.add('active');
    renderGalleryData();
  }

  function lockGallery() {
    try {
      sessionStorage.removeItem(storageKey);
    } catch (e) {}
    if (galleryLayout) galleryLayout.classList.remove('active');
    if (pinScreen) pinScreen.classList.remove('unlocked');
    if (pinInput) {
      pinInput.value = '';
      pinInput.focus();
    }
  }

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
      const safeThumb = escapeHtml(photo.thumb || photo.full);
      const safeCaption = escapeHtml(photo.caption || photo.title || `Foto ${idx + 1}`);
      const safeId = escapeHtml(photo.id || `AR-${idx + 1}`);
      const safeFull = escapeHtml(photo.full);
      const safeName = escapeHtml(filename);

      card.innerHTML = `
        <div class="photo-img-wrap" data-index="${idx}" tabindex="0" role="button" aria-label="Ampliar ${safeCaption}">
          <img src="${safeThumb}" alt="${safeCaption}" loading="lazy" decoding="async">
        </div>
        <div class="photo-card-footer">
          <div class="photo-info">
            <h3 class="photo-caption">${safeCaption}</h3>
            <span class="photo-id-tag">${safeId}</span>
          </div>
          <button type="button" class="btn-photo-download" data-url="${safeFull}" data-name="${safeName}" title="Descargar en alta resolución">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Descargar
          </button>
        </div>
      `;

      const imgWrap = card.querySelector('.photo-img-wrap');
      imgWrap.addEventListener('click', () => openLightbox(idx));
      imgWrap.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(idx);
        }
      });

      card.querySelector('.btn-photo-download').addEventListener('click', (e) => {
        e.stopPropagation();
        triggerDownload(photo.full, filename);
      });

      photoGrid.appendChild(card);
    });
  }

  function triggerDownload(url, filename) {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'fotografia.jpg';
    link.rel = 'noopener';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleDownloadAll() {
    if (config.zipDownloadUrl) {
      window.open(config.zipDownloadUrl, '_blank', 'noopener');
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

  function openLightbox(index) {
    currentPhotoIndex = index;
    updateLightboxContent();
    if (lightbox) {
      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
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
    if (!config.photos.length) return;
    currentPhotoIndex = (currentPhotoIndex - 1 + config.photos.length) % config.photos.length;
    updateLightboxContent();
  }

  function showNextPhoto() {
    if (!config.photos.length) return;
    currentPhotoIndex = (currentPhotoIndex + 1) % config.photos.length;
    updateLightboxContent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
