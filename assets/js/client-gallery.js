/**
 * ==========================================================================
 * ANDRÉS REGINENSI PHOTOGRAPHY — SCRIPT DE GALERÍA PRIVADA DE CLIENTE
 * Validación de PIN 100 % en servidor (/api/galleries/unlock y /session)
 * con cookie HttpOnly firmada. Cero fotos, clientes o hashes en el HTML.
 * ==========================================================================
 */

(function () {
  'use strict';

  const gallerySlug =
    (document.body && document.body.getAttribute('data-gallery-slug')) ||
    window.location.pathname
      .replace(/\/index\.html$/i, '')
      .replace(/\/+$/, '')
      .split('/')
      .pop() ||
    '';

  const lockKey = 'lock_galeria_' + gallerySlug;
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

  let activeSession = null;
  let currentPhotoIndex = 0;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resolveAssetPath(url) {
    const clean = String(url || '').trim();
    if (!clean) return '';
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/')) {
      return clean;
    }
    return '/' + clean.replace(/^\.?\//, '');
  }

  async function init() {
    setupEventListeners();

    try {
      const res = await fetch(`/api/galleries/session?session=${encodeURIComponent(gallerySlug)}`, {
        credentials: 'same-origin',
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.authenticated && data.session) {
          unlockGallery(data.session);
          return;
        }
      }
    } catch (e) {}

    if (pinInput) pinInput.focus();
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

    if (lightboxBtnClose) lightboxBtnClose.addEventListener('click', closeLightbox);
    if (lightbox) {
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
      });
    }
    if (lightboxBtnPrev) lightboxBtnPrev.addEventListener('click', showPrevPhoto);
    if (lightboxBtnNext) lightboxBtnNext.addEventListener('click', showNextPhoto);

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
    if (!entered) return;

    const btn = document.getElementById('btn-unlock');
    const origLabel = btn ? btn.textContent : '';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Verificando...';
    }

    try {
      const res = await fetch('/api/galleries/unlock', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ sessionId: gallerySlug, pin: entered })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok && data.session) {
        if (pinError) pinError.classList.remove('visible');
        try {
          sessionStorage.removeItem(lockKey);
        } catch (e) {}
        if (pinInput) pinInput.value = '';
        unlockGallery(data.session);
        return;
      }

      let blocked = false;
      if (res.status === 401) {
        try {
          const lockState = JSON.parse(sessionStorage.getItem(lockKey) || '{"count":0,"until":0}');
          const nextCount = (lockState.count || 0) + 1;
          const nextUntil = nextCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
          blocked = Boolean(nextUntil);
          sessionStorage.setItem(lockKey, JSON.stringify({ count: nextCount, until: nextUntil }));
        } catch (e) {}
      }

      if (pinError) {
        pinError.textContent = blocked
          ? 'Acceso bloqueado durante 60 segundos tras varios intentos fallidos.'
          : data.error || 'Código PIN incorrecto. Por favor, verifícalo con Andrés.';
        pinError.classList.add('visible');
      }
      if (pinInput) {
        pinInput.classList.add('shake');
        setTimeout(() => pinInput.classList.remove('shake'), 450);
        pinInput.value = '';
        pinInput.focus();
      }
    } catch (err) {
      if (pinError) {
        pinError.textContent = 'No se pudo contactar con el servidor de verificación.';
        pinError.classList.add('visible');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = origLabel;
      }
    }
  }

  function unlockGallery(sessionData) {
    activeSession = sessionData;
    if (pinScreen) pinScreen.classList.add('unlocked');
    if (galleryLayout) galleryLayout.classList.add('active');
    renderGalleryData();
  }

  async function lockGallery() {
    try {
      await fetch('/api/galleries/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (e) {}
    activeSession = null;
    if (photoGrid) photoGrid.innerHTML = '';
    if (galleryLayout) galleryLayout.classList.remove('active');
    if (pinScreen) pinScreen.classList.remove('unlocked');
    if (pinInput) {
      pinInput.value = '';
      pinInput.focus();
    }
  }

  function renderGalleryData() {
    if (!activeSession) return;
    const photos = Array.isArray(activeSession.photos) ? activeSession.photos : [];

    if (elTitle) elTitle.textContent = activeSession.title || 'Galería Privada';
    if (elClient) elClient.textContent = activeSession.clientName || 'Cliente';
    if (elMetaDate) elMetaDate.textContent = activeSession.date ? `📅 ${activeSession.date}` : '';
    if (elMetaLocation) elMetaLocation.textContent = activeSession.location ? `📍 ${activeSession.location}` : '';
    if (elMetaCount) elMetaCount.textContent = `🖼️ ${photos.length} fotografías en alta resolución`;

    if (!photoGrid) return;
    photoGrid.innerHTML = '';

    photos.forEach((photo, idx) => {
      const card = document.createElement('article');
      card.className = 'photo-card';

      const fullResolved = resolveAssetPath(photo.fullUrl || photo.full);
      const thumbResolved = resolveAssetPath(photo.thumbUrl || photo.thumb || photo.fullUrl || photo.full);
      const filename = fullResolved ? fullResolved.split('/').pop().split('?')[0] : `foto-${idx + 1}.jpg`;
      const safeThumb = escapeHtml(thumbResolved);
      const safeCaption = escapeHtml(photo.caption || photo.title || `Foto ${idx + 1}`);
      const safeId = escapeHtml(photo.id || `AR-${idx + 1}`);
      const safeFull = escapeHtml(fullResolved);
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
        triggerDownload(fullResolved, filename);
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
    if (!activeSession) return;
    const photos = Array.isArray(activeSession.photos) ? activeSession.photos : [];
    if (activeSession.zipDownloadUrl) {
      window.open(activeSession.zipDownloadUrl, '_blank', 'noopener');
      return;
    }

    if (confirm(`¿Deseas descargar las ${photos.length} fotografías de esta sesión a tu dispositivo?`)) {
      photos.forEach((photo, idx) => {
        setTimeout(() => {
          const fullResolved = resolveAssetPath(photo.fullUrl || photo.full);
          const filename = fullResolved ? fullResolved.split('/').pop().split('?')[0] : `foto-${idx + 1}.jpg`;
          triggerDownload(fullResolved, filename);
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
      if (lightboxImg) lightboxImg.removeAttribute('src');
      document.body.style.overflow = '';
    }
  }

  function updateLightboxContent() {
    if (!activeSession || !Array.isArray(activeSession.photos)) return;
    const photo = activeSession.photos[currentPhotoIndex];
    if (!photo || !lightboxImg) return;

    const fullResolved = resolveAssetPath(photo.fullUrl || photo.full || photo.thumbUrl || photo.thumb);
    lightboxImg.src = fullResolved;
    if (lightboxCaption) {
      lightboxCaption.textContent =
        photo.caption || photo.title || `Foto ${currentPhotoIndex + 1} de ${activeSession.photos.length}`;
    }

    if (lightboxBtnDownload) {
      lightboxBtnDownload.onclick = () => {
        const filename = fullResolved ? fullResolved.split('/').pop().split('?')[0] : `foto-${currentPhotoIndex + 1}.jpg`;
        triggerDownload(fullResolved, filename);
      };
    }
  }

  function showPrevPhoto() {
    if (!activeSession || !activeSession.photos || !activeSession.photos.length) return;
    currentPhotoIndex = (currentPhotoIndex - 1 + activeSession.photos.length) % activeSession.photos.length;
    updateLightboxContent();
  }

  function showNextPhoto() {
    if (!activeSession || !activeSession.photos || !activeSession.photos.length) return;
    currentPhotoIndex = (currentPhotoIndex + 1) % activeSession.photos.length;
    updateLightboxContent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
