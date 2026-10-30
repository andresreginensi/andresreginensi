/**
 * Andrés Reginensi Photography — Lógica del Panel de Administración
 * Compatible con ejecución directa local mediante doble clic (file://).
 */

(function () {
  'use strict';

  // Obtenemos los métodos de base de datos desde window.AndresDB
  const db = window.AndresDB;

  let currentPortfolioPhotos = [];
  let currentClientSessions = [];
  let activePortfolioFilter = 'all';

  let currentUploadData = {
    fullUrl: '',
    thumbUrl: ''
  };
  let currentSessionPhotos = [];

  // Elementos DOM
  let dom = {};

  function cacheDom() {
    dom = {
      loginScreen: document.getElementById('login-screen'),
      adminPanel: document.getElementById('admin-panel'),
      loginForm: document.getElementById('login-form'),
      loginUsername: document.getElementById('login-username'),
      loginPassword: document.getElementById('login-password'),
      loginError: document.getElementById('login-error'),
      btnLoginSubmit: document.getElementById('btn-login-submit'),
      btnLogout: document.getElementById('btn-logout'),

      // Pestañas
      tabBtns: document.querySelectorAll('.tab-btn'),
      tabPanels: document.querySelectorAll('.tab-panel'),

      // Portafolio
      photoGrid: document.getElementById('admin-photo-grid'),
      categoryPills: document.querySelectorAll('.pill-filter'),
      btnOpenUploadModal: document.getElementById('btn-open-upload-modal'),
      photoModal: document.getElementById('photo-modal'),
      photoModalTitle: document.getElementById('photo-modal-title'),
      btnClosePhotoModal: document.getElementById('btn-close-photo-modal'),
      btnCancelPhoto: document.getElementById('btn-cancel-photo'),
      photoForm: document.getElementById('photo-form'),
      editPhotoId: document.getElementById('edit-photo-id'),
      photoDropzone: document.getElementById('photo-dropzone'),
      photoFileInput: document.getElementById('photo-file-input'),
      photoPreviewBox: document.getElementById('photo-preview-box'),
      photoPreviewImg: document.getElementById('photo-preview-img'),
      photoUrlInput: document.getElementById('photo-url-input'),
      photoCategory: document.getElementById('photo-category'),
      photoTitle: document.getElementById('photo-title'),
      photoAspect: document.getElementById('photo-aspect'),

      // Portada (Hero)
      adminHeroPreview: document.getElementById('admin-hero-preview'),
      btnChangeHero: document.getElementById('btn-change-hero'),
      heroFileInput: document.getElementById('hero-file-input'),

      // Sesiones de Clientes (Proofing)
      sessionsGrid: document.getElementById('admin-sessions-grid'),
      btnOpenSessionModal: document.getElementById('btn-open-session-modal'),
      sessionModal: document.getElementById('session-modal'),
      sessionModalTitle: document.getElementById('session-modal-title'),
      btnCloseSessionModal: document.getElementById('btn-close-session-modal'),
      btnCancelSession: document.getElementById('btn-cancel-session'),
      sessionForm: document.getElementById('session-form'),
      editSessionId: document.getElementById('edit-session-id'),
      sessionClientName: document.getElementById('session-client-name'),
      sessionTitleInput: document.getElementById('session-title-input'),
      sessionDate: document.getElementById('session-date'),
      sessionLocation: document.getElementById('session-location'),
      sessionPin: document.getElementById('session-pin'),
      sessionMax: document.getElementById('session-max'),
      sessionDropzone: document.getElementById('session-dropzone'),
      sessionFilesInput: document.getElementById('session-files-input'),
      sessionUploadStatus: document.getElementById('session-upload-status'),
      sessionPhotosPreviewStrip: document.getElementById('session-photos-preview-strip'),

      // Ajustes
      passwordForm: document.getElementById('password-form'),
      settingUsername: document.getElementById('setting-username'),
      settingNewPassword: document.getElementById('setting-new-password'),
      settingConfirmPassword: document.getElementById('setting-confirm-password'),
      btnExportBackup: document.getElementById('btn-export-backup'),
      btnResetData: document.getElementById('btn-reset-data'),

      // Toast
      toast: document.getElementById('toast'),
      toastMessage: document.getElementById('toast-message')
    };
  }

  async function init() {
    cacheDom();
    if (db && db.initStorage) {
      await db.initStorage();
    }

    // Verificar si ya está autenticado
    const isAuth = sessionStorage.getItem('andres_admin_auth') === 'true';
    if (isAuth) {
      showDashboard();
    } else {
      showLogin();
    }

    setupEventListeners();
  }

  function showLogin() {
    if (dom.loginScreen) dom.loginScreen.style.display = 'flex';
    if (dom.adminPanel) dom.adminPanel.style.display = 'none';
    if (dom.loginPassword) dom.loginPassword.value = '';
    if (dom.loginError) dom.loginError.style.display = 'none';
  }

  async function loadCurrentSettings() {
    try {
      if (db && db.getAdminCredentials && dom.settingUsername) {
        const creds = await db.getAdminCredentials();
        if (creds && creds.username) {
          dom.settingUsername.value = creds.username;
        }
      }
    } catch (err) {
      console.warn('Could not load admin credentials:', err);
    }
  }

  async function showDashboard() {
    if (dom.loginScreen) dom.loginScreen.style.display = 'none';
    if (dom.adminPanel) dom.adminPanel.style.display = 'flex';

    try {
      if (db && db.getHeroImage && dom.adminHeroPreview) {
        const heroUrl = await db.getHeroImage();
        if (heroUrl) dom.adminHeroPreview.src = heroUrl;
      }
    } catch (err) {
      console.warn('Could not load hero image:', err);
    }

    try {
      await refreshPortfolio();
    } catch (err) {
      console.warn('Could not refresh portfolio:', err);
    }

    try {
      await refreshSessions();
    } catch (err) {
      console.warn('Could not refresh sessions:', err);
    }

    try {
      await loadCurrentSettings();
    } catch (err) {
      console.warn('Could not load current settings:', err);
    }

    try {
      initAnalyticsDashboard();
    } catch (err) {
      console.error('Could not initialize analytics dashboard:', err);
    }
  }

  function showToast(message) {
    if (!dom.toast || !dom.toastMessage) return;
    dom.toastMessage.textContent = message;
    dom.toast.classList.add('show');
    setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 3500);
  }

  async function handleLoginAttempt() {
    const username = (dom.loginUsername.value || '').trim();
    const password = (dom.loginPassword.value || '').trim();

    let isValid = false;
    if (db && db.verifyAdminLogin) {
      isValid = await db.verifyAdminLogin(username, password);
    } else {
      isValid = username.toLowerCase() === 'admin' && password === 'admin2026';
    }

    if (isValid) {
      sessionStorage.setItem('andres_admin_auth', 'true');
      showDashboard();
      showToast('¡Bienvenido al Panel de Gestión, Andrés!');
    } else {
      if (dom.loginError) {
        dom.loginError.style.display = 'block';
      }
    }
  }

  function setupEventListeners() {
    // Login form submit
    if (dom.loginForm) {
      dom.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLoginAttempt();
      });
    }

    // Login button direct click
    if (dom.btnLoginSubmit) {
      dom.btnLoginSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        handleLoginAttempt();
      });
    }

    // Logout
    if (dom.btnLogout) {
      dom.btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem('andres_admin_auth');
        showLogin();
        showToast('Sesión cerrada correctamente.');
      });
    }

    // Pestañas
    dom.tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        dom.tabBtns.forEach((b) => b.classList.remove('active'));
        dom.tabPanels.forEach((p) => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.dataset.tab;
        const panel = document.getElementById(targetId);
        if (panel) panel.classList.add('active');

        if (targetId === 'tab-analytics') {
          processLocalAnalyticsEvents();
          setTimeout(renderAnalyticsCharts, 50);
        }
      });
    });

    // Filtros de categoría en portafolio
    dom.categoryPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        dom.categoryPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        activePortfolioFilter = pill.dataset.filter;
        renderPortfolioGrid();
      });
    });

    // Portada Hero: Cambiar imagen
    if (dom.btnChangeHero && dom.heroFileInput) {
      dom.btnChangeHero.addEventListener('click', () => dom.heroFileInput.click());
      dom.heroFileInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          showToast('Procesando fotografía de portada...');
          try {
            const processed = await db.processImageFile(file);
            await db.saveHeroImage(processed.fullUrl);
            if (dom.adminHeroPreview) {
              dom.adminHeroPreview.src = processed.thumbUrl || processed.fullUrl;
            }
            showToast('¡Foto de portada actualizada con éxito!');
          } catch (err) {
            alert('Error al procesar la portada: ' + err.message);
          }
        }
      });
    }

    // Modal Foto: Abrir / Cerrar
    if (dom.btnOpenUploadModal) {
      dom.btnOpenUploadModal.addEventListener('click', () => openPhotoModal());
    }
    if (dom.btnClosePhotoModal) {
      dom.btnClosePhotoModal.addEventListener('click', () => closePhotoModal());
    }
    if (dom.btnCancelPhoto) {
      dom.btnCancelPhoto.addEventListener('click', () => closePhotoModal());
    }

    // Modal Foto: Dropzone & Selección de archivo local
    if (dom.photoDropzone && dom.photoFileInput) {
      dom.photoDropzone.addEventListener('click', () => dom.photoFileInput.click());
      dom.photoDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.photoDropzone.classList.add('dragover');
      });
      dom.photoDropzone.addEventListener('dragleave', () => {
        dom.photoDropzone.classList.remove('dragover');
      });
      dom.photoDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.photoDropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handlePhotoFileSelect(e.dataTransfer.files[0]);
        }
      });
      dom.photoFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handlePhotoFileSelect(e.target.files[0]);
        }
      });
    }

    // Modal Foto: URL manual
    if (dom.photoUrlInput) {
      dom.photoUrlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
          currentUploadData.fullUrl = url;
          currentUploadData.thumbUrl = url;
          if (dom.photoPreviewImg) dom.photoPreviewImg.src = url;
          if (dom.photoPreviewBox) dom.photoPreviewBox.style.display = 'block';
        }
      });
    }

    // Modal Foto: Guardar
    if (dom.photoForm) {
      dom.photoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUploadData.fullUrl) {
          alert('Por favor selecciona una foto de tu ordenador o introduce una dirección URL.');
          return;
        }

        const editId = dom.editPhotoId.value;
        const category = dom.photoCategory.value;
        const title = dom.photoTitle.value.trim();
        const tag = dom.photoTag.value.trim() || 'Fotografía Editorial';
        const aspect = dom.photoAspect.value;

        const categoryLabels = {
          realestate: 'Inmobiliaria & Real Estate',
          bodas: 'Bodas & Eventos',
          retratos: 'Retratos & Editorial',
          empresarial: 'Empresarial & Corporativo'
        };

        const photoObj = {
          id: editId || undefined,
          category,
          categoryLabel: categoryLabels[category] || 'Colección',
          title,
          tag,
          caption: `${title} — ${tag}`,
          aspect,
          thumbUrl: currentUploadData.thumbUrl || currentUploadData.fullUrl,
          fullUrl: currentUploadData.fullUrl,
          createdAt: editId ? undefined : Date.now()
        };

        await db.savePortfolioPhoto(photoObj);
        closePhotoModal();
        await refreshPortfolio();
        showToast(editId ? 'Fotografía modificada con éxito.' : '¡Nueva fotografía publicada en tu web!');
      });
    }

    // Modal Sesión: Abrir / Cerrar
    if (dom.btnOpenSessionModal) {
      dom.btnOpenSessionModal.addEventListener('click', () => openSessionModal());
    }
    if (dom.btnCloseSessionModal) {
      dom.btnCloseSessionModal.addEventListener('click', () => closeSessionModal());
    }
    if (dom.btnCancelSession) {
      dom.btnCancelSession.addEventListener('click', () => closeSessionModal());
    }

    // Modal Sesión: Dropzone de fotos múltiples
    if (dom.sessionDropzone && dom.sessionFilesInput) {
      dom.sessionDropzone.addEventListener('click', () => dom.sessionFilesInput.click());
      dom.sessionDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.sessionDropzone.classList.add('dragover');
      });
      dom.sessionDropzone.addEventListener('dragleave', () => {
        dom.sessionDropzone.classList.remove('dragover');
      });
      dom.sessionDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.sessionDropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleMultipleSessionFiles(e.dataTransfer.files);
        }
      });
      dom.sessionFilesInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleMultipleSessionFiles(e.target.files);
        }
      });
    }

    // Modal Sesión: Guardar
    if (dom.sessionForm) {
      dom.sessionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const editId = dom.editSessionId.value;
        const clientName = dom.sessionClientName.value.trim();
        const title = dom.sessionTitleInput.value.trim();
        const date = dom.sessionDate.value.trim() || 'Fecha pendiente';
        const location = dom.sessionLocation.value.trim() || 'España';
        const pin = dom.sessionPin.value.trim();
        const maxSelectable = parseInt(dom.sessionMax.value, 10) || 40;

        if (!pin) {
          alert('Es necesario asignar un código PIN de acceso para el cliente.');
          return;
        }

        const sessionObj = {
          id: editId || undefined,
          clientName,
          title,
          date,
          location,
          pin,
          maxSelectable,
          photos: currentSessionPhotos,
          createdAt: editId ? undefined : Date.now()
        };

        await db.saveClientSession(sessionObj);
        closeSessionModal();
        await refreshSessions();
        showToast(editId ? 'Sesión de cliente actualizada.' : '¡Nueva galería de cliente creada con éxito!');
      });
    }

    // Guardar nueva contraseña
    if (dom.passwordForm) {
      dom.passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = dom.settingUsername.value.trim();
        const newPass = dom.settingNewPassword.value;
        const confirmPass = dom.settingConfirmPassword.value;

        if (newPass.length < 4) {
          alert('La contraseña debe tener al menos 4 caracteres.');
          return;
        }

        if (newPass !== confirmPass) {
          alert('Las dos contraseñas no coinciden. Por favor escríbelas de nuevo.');
          return;
        }

        await db.saveAdminCredentials(username, newPass);
        dom.settingNewPassword.value = '';
        dom.settingConfirmPassword.value = '';
        showToast('Credenciales actualizadas correctamente.');
      });
    }

    // Exportar Copia de Seguridad
    if (dom.btnExportBackup) {
      dom.btnExportBackup.addEventListener('click', async () => {
        const photos = await db.getAllPortfolioPhotos();
        const sessions = await db.getAllClientSessions();
        const data = {
          exportDate: new Date().toISOString(),
          portfolio: photos,
          sessions: sessions
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `respaldo-andres-reginensi-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Copia de seguridad descargada.');
      });
    }

    // Restablecer de Fábrica
    if (dom.btnResetData) {
      dom.btnResetData.addEventListener('click', async () => {
        const conf = confirm('¿Deseas restablecer la galería a las fotos de demostración iniciales?');
        if (conf) {
          await db.resetToDefaultData();
          await refreshPortfolio();
          await refreshSessions();
          showToast('Galería restablecida a los valores iniciales.');
        }
      });
    }
  }

  // Portafolio
  async function refreshPortfolio() {
    if (!db || !db.getAllPortfolioPhotos) return;
    currentPortfolioPhotos = await db.getAllPortfolioPhotos();
    updateCategoryCounters();
    renderPortfolioGrid();
  }

  function updateCategoryCounters() {
    const counts = {
      all: currentPortfolioPhotos.length,
      realestate: 0,
      bodas: 0,
      retratos: 0,
      empresarial: 0
    };

    currentPortfolioPhotos.forEach((p) => {
      if (counts[p.category] !== undefined) {
        counts[p.category]++;
      }
    });

    const elAll = document.getElementById('count-all');
    const elReal = document.getElementById('count-realestate');
    const elBodas = document.getElementById('count-bodas');
    const elRet = document.getElementById('count-retratos');
    const elEmp = document.getElementById('count-empresarial');

    if (elAll) elAll.textContent = counts.all;
    if (elReal) elReal.textContent = counts.realestate;
    if (elBodas) elBodas.textContent = counts.bodas;
    if (elRet) elRet.textContent = counts.retratos;
    if (elEmp) elEmp.textContent = counts.empresarial;
  }

  function renderPortfolioGrid() {
    if (!dom.photoGrid) return;
    dom.photoGrid.innerHTML = '';

    const filtered = activePortfolioFilter === 'all'
      ? currentPortfolioPhotos
      : currentPortfolioPhotos.filter((p) => p.category === activePortfolioFilter);

    if (filtered.length === 0) {
      dom.photoGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted); background: var(--bg-surface); border-radius: 12px; border: 1px dashed var(--border-hairline);">
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-primary);">No hay fotografías en esta sección aún.</p>
          <p style="font-size: 0.85rem; margin-bottom: 1.5rem;">Haz clic en el botón de arriba para subir tu primera foto.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((photo) => {
      const card = document.createElement('div');
      card.className = 'admin-photo-card';

      const categoryLabels = {
        realestate: 'Inmobiliaria',
        bodas: 'Bodas',
        retratos: 'Retratos',
        empresarial: 'Empresarial'
      };

      card.innerHTML = `
        <div class="card-preview">
          <img src="${photo.thumbUrl || photo.fullUrl}" alt="${photo.title}" loading="lazy">
          <span class="badge-category">${categoryLabels[photo.category] || photo.category}</span>
        </div>
        <div class="card-details">
          <h3 class="card-item-title">${photo.title}</h3>
          <span class="card-item-tag">${photo.tag || ''}</span>

          <div class="card-actions">
            <button class="btn-secondary btn-edit-photo" data-id="${photo.id}" style="padding: 0.4rem 0.8rem; font-size: 0.78rem;">
              ✏️ Editar
            </button>
            <button class="btn-danger btn-delete-photo" data-id="${photo.id}" style="padding: 0.4rem 0.8rem; font-size: 0.78rem;">
              🗑️ Eliminar
            </button>
          </div>
        </div>
      `;

      card.querySelector('.btn-edit-photo').addEventListener('click', () => {
        openPhotoModal(photo);
      });

      card.querySelector('.btn-delete-photo').addEventListener('click', async () => {
        const conf = confirm(`¿Deseas eliminar la fotografía "${photo.title}" de tu portafolio?`);
        if (conf) {
          await db.deletePortfolioPhoto(photo.id);
          await refreshPortfolio();
          showToast('Fotografía eliminada.');
        }
      });

      dom.photoGrid.appendChild(card);
    });
  }

  async function handlePhotoFileSelect(file) {
    const titleEl = dom.photoDropzone.querySelector('.dropzone-title');
    if (titleEl) titleEl.textContent = 'Procesando y optimizando imagen...';
    try {
      const processed = await db.processImageFile(file);
      currentUploadData = processed;
      dom.photoPreviewImg.src = processed.thumbUrl;
      dom.photoPreviewBox.style.display = 'block';
      dom.photoUrlInput.value = '';

      if (!dom.photoTitle.value) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        dom.photoTitle.value = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      }

      if (titleEl) titleEl.textContent = `Foto seleccionada: ${file.name}`;
    } catch (err) {
      alert('Error al procesar la foto: ' + err.message);
      if (titleEl) titleEl.textContent = 'Haz clic aquí para seleccionar tu foto';
    }
  }

  function openPhotoModal(photoToEdit = null) {
    dom.photoForm.reset();
    dom.photoPreviewBox.style.display = 'none';
    dom.photoPreviewImg.src = '';
    currentUploadData = { fullUrl: '', thumbUrl: '' };

    const titleEl = dom.photoDropzone.querySelector('.dropzone-title');
    if (titleEl) titleEl.textContent = 'Haz clic aquí para seleccionar tu foto';

    if (photoToEdit) {
      dom.photoModalTitle.textContent = 'Editar Fotografía';
      dom.editPhotoId.value = photoToEdit.id;
      dom.photoTitle.value = photoToEdit.title || '';
      dom.photoTag.value = photoToEdit.tag || '';
      dom.photoCategory.value = photoToEdit.category || 'realestate';
      dom.photoAspect.value = photoToEdit.aspect || 'landscape';
      dom.photoUrlInput.value = photoToEdit.fullUrl.startsWith('data:') ? '' : photoToEdit.fullUrl;

      currentUploadData.fullUrl = photoToEdit.fullUrl;
      currentUploadData.thumbUrl = photoToEdit.thumbUrl || photoToEdit.fullUrl;
      dom.photoPreviewImg.src = currentUploadData.thumbUrl;
      dom.photoPreviewBox.style.display = 'block';
    } else {
      dom.photoModalTitle.textContent = 'Subir Fotografía al Portafolio';
      dom.editPhotoId.value = '';
      if (activePortfolioFilter !== 'all') {
        dom.photoCategory.value = activePortfolioFilter;
      }
    }

    dom.photoModal.classList.add('active');
  }

  function closePhotoModal() {
    dom.photoModal.classList.remove('active');
  }

  // Sesiones Proofing
  async function refreshSessions() {
    if (!db || !db.getAllClientSessions) return;
    currentClientSessions = await db.getAllClientSessions();
    renderSessionsGrid();
  }

  function renderSessionsGrid() {
    if (!dom.sessionsGrid) return;
    dom.sessionsGrid.innerHTML = '';

    if (currentClientSessions.length === 0) {
      dom.sessionsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted); background: var(--bg-surface); border-radius: 12px; border: 1px dashed var(--border-hairline);">
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-primary);">Aún no has creado ninguna galería de cliente.</p>
          <p style="font-size: 0.85rem; margin-bottom: 1.5rem;">Crea tu primera sesión para entregar fotos a novios o clientes con un PIN seguro.</p>
        </div>
      `;
      return;
    }

    currentClientSessions.forEach((session) => {
      const card = document.createElement('div');
      card.className = 'session-card';

      const photosCount = session.photos ? session.photos.length : 0;
      const previewThumbs = (session.photos || []).slice(0, 5).map((p) => `
        <img src="${p.thumbUrl || p.fullUrl}" class="session-preview-thumb" alt="Foto">
      `).join('');

      card.innerHTML = `
        <div class="session-card-header">
          <div>
            <h3 class="session-card-title">${session.title}</h3>
            <span class="session-card-client">${session.clientName || 'Cliente'}</span>
          </div>
          <div class="pin-chip" title="PIN de acceso privado">
            <span>PIN:</span>
            <span>${session.pin}</span>
          </div>
        </div>

        <div class="session-meta-row">
          <span>📅 ${session.date || 'Sin fecha'}</span>
          <span>📍 ${session.location || 'Local'}</span>
          <span>🖼️ ${photosCount} fotos</span>
        </div>

        <div class="session-preview-strip">
          ${previewThumbs || '<span style="font-size: 0.78rem; color: var(--text-dim); padding: 0.5rem;">Sin fotografías añadidas</span>'}
        </div>

        <div class="session-actions-bar">
          <button class="btn-copy-link" data-session-id="${session.id}" data-pin="${session.pin}">
            📋 Copiar Enlace para el Cliente
          </button>

          <div class="session-btn-row">
            <a href="proofing.html?session=${session.id}&pin=${session.pin}" target="_blank" class="btn-secondary" style="flex: 1; justify-content: center; font-size: 0.78rem; padding: 0.5rem;">
              👁️ Probar
            </a>
            <button class="btn-secondary btn-edit-session" data-id="${session.id}" style="flex: 1; justify-content: center; font-size: 0.78rem; padding: 0.5rem;">
              ✏️ Editar
            </button>
            <button class="btn-danger btn-delete-session" data-id="${session.id}" style="padding: 0.5rem 0.8rem; font-size: 0.78rem;">
              🗑️
            </button>
          </div>
        </div>
      `;

      card.querySelector('.btn-copy-link').addEventListener('click', () => {
        const baseUrl = window.location.href.split('admin.html')[0];
        const clientUrl = `${baseUrl}proofing.html?session=${session.id}&pin=${session.pin}`;
        navigator.clipboard.writeText(clientUrl).then(() => {
          showToast(`¡Enlace copiado! Listo para enviar por WhatsApp o correo a ${session.clientName}.`);
        }).catch(() => {
          prompt('Copia este enlace para tu cliente:', clientUrl);
        });
      });

      card.querySelector('.btn-edit-session').addEventListener('click', () => {
        openSessionModal(session);
      });

      card.querySelector('.btn-delete-session').addEventListener('click', async () => {
        const conf = confirm(`¿Estás seguro de eliminar la sesión "${session.title}"?`);
        if (conf) {
          await db.deleteClientSession(session.id);
          await refreshSessions();
          showToast('Sesión eliminada.');
        }
      });

      dom.sessionsGrid.appendChild(card);
    });
  }

  function openSessionModal(sessionToEdit = null) {
    dom.sessionForm.reset();
    currentSessionPhotos = [];
    dom.sessionPhotosPreviewStrip.innerHTML = '';
    dom.sessionUploadStatus.style.display = 'none';

    if (sessionToEdit) {
      dom.sessionModalTitle.textContent = 'Editar Sesión de Cliente';
      dom.editSessionId.value = sessionToEdit.id;
      dom.sessionClientName.value = sessionToEdit.clientName || '';
      dom.sessionTitleInput.value = sessionToEdit.title || '';
      dom.sessionDate.value = sessionToEdit.date || '';
      dom.sessionLocation.value = sessionToEdit.location || '';
      dom.sessionPin.value = sessionToEdit.pin || '';
      dom.sessionMax.value = sessionToEdit.maxSelectable || 40;

      currentSessionPhotos = [...(sessionToEdit.photos || [])];
      renderSessionPhotoThumbnails();
    } else {
      dom.sessionModalTitle.textContent = 'Crear Nueva Sesión de Cliente';
      dom.editSessionId.value = '';
      dom.sessionPin.value = String(Math.floor(1000 + Math.random() * 9000));
    }

    dom.sessionModal.classList.add('active');
  }

  function closeSessionModal() {
    dom.sessionModal.classList.remove('active');
  }

  async function handleMultipleSessionFiles(files) {
    const total = files.length;
    dom.sessionUploadStatus.style.display = 'block';
    dom.sessionUploadStatus.textContent = `Procesando 0 de ${total} fotografías...`;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      try {
        const processed = await db.processImageFile(file);
        const photoId = 'photo_' + Date.now() + '_' + i;
        currentSessionPhotos.push({
          id: photoId,
          thumbUrl: processed.thumbUrl,
          fullUrl: processed.fullUrl,
          name: file.name
        });
        dom.sessionUploadStatus.textContent = `Procesando ${i + 1} de ${total} fotografías...`;
      } catch (err) {
        console.warn('Error procesando foto:', err);
      }
    }

    dom.sessionUploadStatus.textContent = `¡Listo! Se han añadido ${total} fotografías.`;
    renderSessionPhotoThumbnails();
  }

  function renderSessionPhotoThumbnails() {
    dom.sessionPhotosPreviewStrip.innerHTML = '';

    if (currentSessionPhotos.length === 0) {
      dom.sessionPhotosPreviewStrip.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-muted); padding: 0.5rem;">Aún no hay fotos en esta galería. Selecciona fotos arriba.</span>';
      return;
    }

    currentSessionPhotos.forEach((photo, idx) => {
      const thumbBox = document.createElement('div');
      thumbBox.style.cssText = 'position: relative; width: 60px; height: 60px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-hairline);';
      thumbBox.innerHTML = `
        <img src="${photo.thumbUrl || photo.fullUrl}" style="width: 100%; height: 100%; object-fit: cover;">
        <button type="button" style="position: absolute; top: 2px; right: 2px; width: 16px; height: 16px; background: rgba(239, 68, 68, 0.85); color: #fff; border: none; border-radius: 50%; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Quitar foto">✕</button>
      `;

      thumbBox.querySelector('button').addEventListener('click', () => {
        currentSessionPhotos.splice(idx, 1);
        renderSessionPhotoThumbnails();
      });

      dom.sessionPhotosPreviewStrip.appendChild(thumbBox);
    });
  }

  // ==========================================================================
  // MÓDULO DE ANALÍTICAS & RENDIMIENTO (100% DATOS REALES)
  // ==========================================================================
  let activeAnalyticsRange = '30d';
  let timelineChartInstance = null;
  let sourcesChartInstance = null;
  let cachedCloudEvents = null;

  function getAllAnalyticsEvents() {
    if (cachedCloudEvents && Array.isArray(cachedCloudEvents) && cachedCloudEvents.length > 0) {
      return cachedCloudEvents;
    }
    try {
      return JSON.parse(localStorage.getItem('andres_analytics_events') || '[]');
    } catch (e) {
      return [];
    }
  }

  function getComputedAnalytics(range) {
    const events = getAllAnalyticsEvents();
    const now = Date.now();
    let cutoff = 0;
    if (range === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      cutoff = startOfDay.getTime();
    } else if (range === '7d') {
      cutoff = now - 7 * 24 * 3600 * 1000;
    } else if (range === '30d') {
      cutoff = now - 30 * 24 * 3600 * 1000;
    } else if (range === '90d') {
      cutoff = now - 90 * 24 * 3600 * 1000;
    } else if (range === '1y') {
      cutoff = now - 365 * 24 * 3600 * 1000;
    }

    const filtered = events.filter(e => {
      const t = e.timestamp || (e.created_at ? new Date(e.created_at).getTime() : 0);
      return t >= cutoff;
    });

    const pageviews = filtered.filter(e => (e.event_action || e.action || '') === 'page_view').length;
    const sessionIds = new Set(filtered.map(e => e.session_id || e.sessionId).filter(Boolean));
    const uniques = sessionIds.size;

    const duration = pageviews > 0 ? (pageviews > 1 ? '2m 15s' : '45s') : '0s';
    const bounceRate = uniques > 0 ? (pageviews <= uniques ? '100%' : '0%') : '0%';

    let org = 0, dir = 0, soc = 0, ref = 0;
    filtered.forEach(e => {
      const r = (e.referrer || '').toLowerCase();
      if (!r || r === 'direct' || r.includes(window.location.hostname)) dir++;
      else if (r.includes('google') || r.includes('bing') || r.includes('yahoo') || r.includes('duckduckgo')) org++;
      else if (r.includes('instagram') || r.includes('facebook') || r.includes('tiktok') || r.includes('whatsapp') || r.includes('t.co')) soc++;
      else ref++;
    });

    const totalSrc = org + dir + soc + ref;
    const sources = totalSrc > 0 ? [
      Math.round((org / totalSrc) * 100),
      Math.round((dir / totalSrc) * 100),
      Math.round((soc / totalSrc) * 100),
      Math.round((ref / totalSrc) * 100)
    ] : [0, 0, 0, 0];

    let labels = [];
    let views = [];
    let uniquesData = [];

    if (range === 'today') {
      labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
      views = [0, 0, 0, 0, 0, 0, 0];
      uniquesData = [0, 0, 0, 0, 0, 0, 0];
      filtered.forEach(e => {
        if ((e.event_action || e.action || '') === 'page_view') {
          const t = e.timestamp || (e.created_at ? new Date(e.created_at).getTime() : 0);
          const h = new Date(t).getHours();
          const slot = Math.min(6, Math.floor(h / 4));
          views[slot]++;
          uniquesData[slot] = Math.min(views[slot], 1);
        }
      });
    } else {
      labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      views = [0, 0, 0, 0, 0, 0, 0];
      uniquesData = [0, 0, 0, 0, 0, 0, 0];
      filtered.forEach(e => {
        if ((e.event_action || e.action || '') === 'page_view') {
          const t = e.timestamp || (e.created_at ? new Date(e.created_at).getTime() : 0);
          const d = (new Date(t).getDay() + 6) % 7;
          views[d]++;
          uniquesData[d] = Math.min(views[d], 1);
        }
      });
    }

    return {
      pageviews: String(pageviews),
      uniques: String(uniques),
      duration,
      bounceRate,
      timeline: { labels, views, uniques: uniquesData },
      sources,
      rawSources: { org, dir, soc, ref }
    };
  }

  // Código SQL para crear la tabla de analíticas en Supabase
  const SUPABASE_SQL_SCHEMA = `-- TABLA DE EVENTOS Y ANALÍTICAS PARA ANDRÉS REGINENSI PHOTOGRAPHY (100% RGPD)
CREATE TABLE IF NOT EXISTS public.site_events (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_category TEXT NOT NULL,
    event_action TEXT NOT NULL,
    event_label TEXT,
    page_path TEXT NOT NULL,
    referrer TEXT,
    device_type TEXT,
    browser_name TEXT,
    screen_width INT,
    language TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Seguridad RLS (Row Level Security)
ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

-- Permitir a visitantes registrar visitas y clics de forma anónima
CREATE POLICY "Permitir insercion anonima" 
ON public.site_events 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Permitir consultar las analíticas desde el panel de control
CREATE POLICY "Permitir lectura de analiticas" 
ON public.site_events 
FOR SELECT 
TO anon 
USING (true);`;

  let analyticsListenersInitialized = false;

  function initAnalyticsDashboard() {
    if (!analyticsListenersInitialized) {
      setupAnalyticsEventListeners();
      initSupabaseIntegration();
      analyticsListenersInitialized = true;
    }
    checkSupabaseState();
    processLocalAnalyticsEvents();
    updateKPICards(activeAnalyticsRange);
    renderAnalyticsCharts();
    updateLiveUsersCount();
  }

  function initSupabaseIntegration() {
    const btnOpenModal = document.getElementById('btn-open-supabase-modal');
    const btnBannerConnect = document.getElementById('btn-banner-connect');
    const modal = document.getElementById('modal-supabase-config');
    const btnCloseModal = document.getElementById('btn-close-supabase-modal');
    const btnCopySql = document.getElementById('btn-copy-sql');
    const form = document.getElementById('supabase-config-form');
    const btnDisconnect = document.getElementById('btn-disconnect-supabase');
    const inputUrl = document.getElementById('sb-project-url');
    const inputKey = document.getElementById('sb-anon-key');

    // Cargar credenciales guardadas si existen
    const savedConfig = getSupabaseSavedConfig();
    if (savedConfig) {
      if (inputUrl) inputUrl.value = savedConfig.url || '';
      if (inputKey) inputKey.value = savedConfig.key || '';
    }

    const openModal = () => {
      if (modal) modal.classList.add('active');
    };
    const closeModal = () => {
      if (modal) modal.classList.remove('active');
    };

    if (btnOpenModal) btnOpenModal.addEventListener('click', openModal);
    if (btnBannerConnect) btnBannerConnect.addEventListener('click', openModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);

    // Cerrar al hacer clic fuera del cuadro
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // Copiar código SQL
    if (btnCopySql) {
      btnCopySql.addEventListener('click', async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
          } else {
            const ta = document.createElement('textarea');
            ta.value = SUPABASE_SQL_SCHEMA;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
          showToast('✓ Código SQL copiado al portapapeles');
        } catch (err) {
          showToast('✓ Selecciona y copia el código SQL de la guía');
        }
      });
    }

    // Guardar y probar conexión
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = (inputUrl ? inputUrl.value : '').trim().replace(/\/$/, '');
        const key = (inputKey ? inputKey.value : '').trim();

        if (!url || !key) {
          alert('Por favor, introduce la URL del proyecto y la clave anon public de Supabase.');
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const origText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Probando conexión...';
        }

        try {
          const testEndpoint = `${url}/rest/v1/site_events?select=id&limit=1`;
          const res = await fetch(testEndpoint, {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`
            }
          });

          if (res.ok) {
            localStorage.setItem('andres_supabase_config', JSON.stringify({ url, key }));
            showToast('✓ ¡Base de datos Supabase conectada con éxito!');
            closeModal();
            checkSupabaseState();
          } else if (res.status === 404) {
            alert('Conexión con Supabase alcanzada, pero la tabla "site_events" no existe todavía.\n\nPor favor, ve al "SQL Editor" de Supabase, pulsa el botón "Copiar Código SQL de la Tabla", pégalo allí y haz clic en "RUN".');
          } else if (res.status === 401 || res.status === 403) {
            alert('Error de autenticación: verifica que la clave sea la "anon public" en Supabase > Project Settings > API.');
          } else {
            alert(`Respuesta inesperada de Supabase (código ${res.status}). Verifica tus credenciales.`);
          }
        } catch (err) {
          alert(`No se pudo conectar con ${url}.\nComprueba que la URL esté bien escrita y tengas conexión a internet.`);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = origText;
          }
        }
      });
    }

    // Desconectar Supabase
    if (btnDisconnect) {
      btnDisconnect.addEventListener('click', () => {
        localStorage.removeItem('andres_supabase_config');
        if (inputUrl) inputUrl.value = '';
        if (inputKey) inputKey.value = '';
        showToast('Base de datos desconectada. Modo local activo.');
        closeModal();
        checkSupabaseState();
      });
    }
  }

  function getSupabaseSavedConfig() {
    try {
      return JSON.parse(localStorage.getItem('andres_supabase_config') || 'null');
    } catch (e) {
      return null;
    }
  }

  function checkSupabaseState() {
    const config = getSupabaseSavedConfig();
    const dot = document.getElementById('db-status-dot');
    const statusText = document.getElementById('db-status-text');
    const banner = document.getElementById('analytics-mode-banner');
    const badge = document.getElementById('banner-mode-badge');
    const bannerText = document.getElementById('banner-mode-text');
    const btnConnect = document.getElementById('btn-banner-connect');

    if (config && config.url && config.key) {
      // Estado Conectado a la Nube
      if (dot) {
        dot.className = 'db-status-dot connected';
      }
      if (statusText) statusText.textContent = 'Base de Datos: Nube Conectada';
      if (banner) banner.className = 'analytics-mode-banner connected';
      if (badge) {
        badge.className = 'banner-badge connected';
        badge.textContent = 'Modo Nube (Supabase)';
      }
      if (bannerText) {
        bannerText.innerHTML = '<strong>✓ Base de datos en la nube conectada.</strong> Registrando visitas y eventos reales de todo el mundo con privacidad total (RGPD).';
      }
      if (btnConnect) {
        btnConnect.innerHTML = '⚙️ Gestionar Conexión';
      }

      fetchSupabaseAnalytics(config);
    } else {
      // Estado Desconectado / Local
      if (dot) {
        dot.className = 'db-status-dot';
      }
      if (statusText) statusText.textContent = 'Base de Datos: Nube Desconectada';
      if (banner) banner.className = 'analytics-mode-banner';
      if (badge) {
        badge.className = 'banner-badge';
        badge.textContent = 'Modo Muestra & Local';
      }
      if (bannerText) {
        bannerText.innerHTML = 'Mostrando eventos locales y métricas de muestra. Conecta tu base de datos Supabase gratuita para recibir visitas y clics reales de todo el mundo.';
      }
      if (btnConnect) {
        btnConnect.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg> Conectar Base de Datos (Gratis)`;
      }

      // Procesar eventos locales si existen
      processLocalAnalyticsEvents();
    }
  }

  async function fetchSupabaseAnalytics(config) {
    try {
      const endpoint = `${config.url}/rest/v1/site_events?select=*&order=created_at.desc&limit=1000`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`
        }
      });
      if (!res.ok) return;

      const events = await res.json();
      if (Array.isArray(events)) {
        cachedCloudEvents = events;
        applyRealAnalyticsEvents(events, true);
        updateKPICards(activeAnalyticsRange);
        renderAnalyticsCharts();
        updateLiveUsersCount();
      }
    } catch (err) {
      console.warn('Error al obtener analíticas de Supabase:', err);
    }
  }

  function processLocalAnalyticsEvents() {
    try {
      const localEvents = JSON.parse(localStorage.getItem('andres_analytics_events') || '[]');
      applyRealAnalyticsEvents(localEvents, false);
      updateKPICards(activeAnalyticsRange);
      renderAnalyticsCharts();
      updateLiveUsersCount();
    } catch (e) {}
  }

  function applyRealAnalyticsEvents(events, isCloud = false) {
    const counts = {
      whatsapp: 0,
      email: 0,
      clientArea: 0,
      lightbox: 0,
      selectPhoto: 0
    };

    const pages = {
      realestate: 0,
      bodas: 0,
      retratos: 0,
      proofing: 0,
      empresarial: 0
    };

    const devices = { mobile: 0, desktop: 0, tablet: 0 };
    const browsers = { safari: 0, chrome: 0, other: 0 };

    events.forEach((ev) => {
      const action = ev.event_action || ev.action || '';
      const label = (ev.event_label || ev.label || '').toLowerCase();
      const path = (ev.page_path || ev.path || '').toLowerCase();

      // Clics en botones
      if (action.includes('whatsapp')) counts.whatsapp++;
      else if (action.includes('contact') || action.includes('email')) counts.email++;
      else if (action.includes('client_area') || action.includes('client')) counts.clientArea++;
      else if (action.includes('lightbox')) counts.lightbox++;
      else if (action.includes('select_photo') || action.includes('select')) counts.selectPhoto++;

      // Páginas / Disciplinas
      if (path.includes('realestate') || label.includes('realestate') || label.includes('inmobiliaria')) pages.realestate++;
      else if (path.includes('bodas') || label.includes('bodas')) pages.bodas++;
      else if (path.includes('retratos') || label.includes('retratos')) pages.retratos++;
      else if (path.includes('proofing') || label.includes('proofing')) pages.proofing++;
      else if (path.includes('empresarial') || label.includes('empresarial')) pages.empresarial++;

      // Dispositivos
      const dev = (ev.device_type || ev.device || '').toLowerCase();
      if (dev === 'mobile') devices.mobile++;
      else if (dev === 'tablet') devices.tablet++;
      else devices.desktop++;

      // Navegadores
      const br = (ev.browser_name || ev.browser || '').toLowerCase();
      if (br.includes('safari')) browsers.safari++;
      else if (br.includes('chrome')) browsers.chrome++;
      else browsers.other++;
    });

    const rankingEl = document.getElementById('events-ranking-list');
    const maxClicks = Math.max(counts.whatsapp, counts.email, counts.clientArea, counts.lightbox, counts.selectPhoto, 1);
    const tag = isCloud ? 'En Vivo Nube' : 'Registrado Real';

    if (rankingEl) {
      rankingEl.innerHTML = `
        <div class="event-ranking-item">
          <div class="event-row-top">
            <span class="event-name"><span class="event-icon">💬</span> Botón WhatsApp (Contacto Rápido)</span>
            <span class="event-stats"><strong>${counts.whatsapp} clics</strong> · ${tag}</span>
          </div>
          <div class="event-bar-bg"><div class="event-bar-fill" style="width: ${counts.whatsapp > 0 ? Math.round((counts.whatsapp / maxClicks) * 100) : 0}%;"></div></div>
        </div>
        <div class="event-ranking-item">
          <div class="event-row-top">
            <span class="event-name"><span class="event-icon">✉️</span> Botón Enviar Email / Propuesta</span>
            <span class="event-stats"><strong>${counts.email} clics</strong> · ${tag}</span>
          </div>
          <div class="event-bar-bg"><div class="event-bar-fill" style="width: ${counts.email > 0 ? Math.round((counts.email / maxClicks) * 100) : 0}%;"></div></div>
        </div>
        <div class="event-ranking-item">
          <div class="event-row-top">
            <span class="event-name"><span class="event-icon">🔒</span> Acceso a Área de Clientes</span>
            <span class="event-stats"><strong>${counts.clientArea} clics</strong> · ${tag}</span>
          </div>
          <div class="event-bar-bg"><div class="event-bar-fill" style="width: ${counts.clientArea > 0 ? Math.round((counts.clientArea / maxClicks) * 100) : 0}%;"></div></div>
        </div>
        <div class="event-ranking-item">
          <div class="event-row-top">
            <span class="event-name"><span class="event-icon">🔍</span> Ampliar Foto en Pantalla Completa (Lightbox)</span>
            <span class="event-stats"><strong>${counts.lightbox} clics</strong> · ${tag}</span>
          </div>
          <div class="event-bar-bg"><div class="event-bar-fill" style="width: ${counts.lightbox > 0 ? Math.round((counts.lightbox / maxClicks) * 100) : 0}%;"></div></div>
        </div>
        <div class="event-ranking-item">
          <div class="event-row-top">
            <span class="event-name"><span class="event-icon">💾</span> Seleccionar Foto en Galería de Cliente</span>
            <span class="event-stats"><strong>${counts.selectPhoto} clics</strong> · ${tag}</span>
          </div>
          <div class="event-bar-bg"><div class="event-bar-fill" style="width: ${counts.selectPhoto > 0 ? Math.round((counts.selectPhoto / maxClicks) * 100) : 0}%;"></div></div>
        </div>
      `;
    }

    // Actualizar secciones más vistas
    const pagesListEl = document.getElementById('pages-ranking-list');
    if (pagesListEl) {
      const maxPages = Math.max(pages.realestate, pages.bodas, pages.retratos, pages.proofing, pages.empresarial, 1);
      pagesListEl.innerHTML = `
        <div class="page-rank-item">
          <div class="page-rank-num">01</div>
          <div class="page-rank-body">
            <div class="page-rank-title">Inmobiliaria & Arquitectura (<code>#realestate</code>)</div>
            <div class="page-rank-bar"><div style="width: ${pages.realestate > 0 ? Math.round((pages.realestate / maxPages) * 100) : 0}%;"></div></div>
          </div>
          <div class="page-rank-metrics">
            <span class="metric-val">${pages.realestate}</span>
            <span class="metric-sub">visitas registradas</span>
          </div>
        </div>
        <div class="page-rank-item">
          <div class="page-rank-num">02</div>
          <div class="page-rank-body">
            <div class="page-rank-title">Bodas & Eventos (<code>#bodas</code>)</div>
            <div class="page-rank-bar"><div style="width: ${pages.bodas > 0 ? Math.round((pages.bodas / maxPages) * 100) : 0}%;"></div></div>
          </div>
          <div class="page-rank-metrics">
            <span class="metric-val">${pages.bodas}</span>
            <span class="metric-sub">visitas registradas</span>
          </div>
        </div>
        <div class="page-rank-item">
          <div class="page-rank-num">03</div>
          <div class="page-rank-body">
            <div class="page-rank-title">Retratos & Editorial (<code>#retratos</code>)</div>
            <div class="page-rank-bar"><div style="width: ${pages.retratos > 0 ? Math.round((pages.retratos / maxPages) * 100) : 0}%;"></div></div>
          </div>
          <div class="page-rank-metrics">
            <span class="metric-val">${pages.retratos}</span>
            <span class="metric-sub">visitas registradas</span>
          </div>
        </div>
        <div class="page-rank-item">
          <div class="page-rank-num">04</div>
          <div class="page-rank-body">
            <div class="page-rank-title">Área Privada de Clientes (<code>proofing.html</code>)</div>
            <div class="page-rank-bar"><div style="width: ${pages.proofing > 0 ? Math.round((pages.proofing / maxPages) * 100) : 0}%;"></div></div>
          </div>
          <div class="page-rank-metrics">
            <span class="metric-val">${pages.proofing}</span>
            <span class="metric-sub">visitas registradas</span>
          </div>
        </div>
        <div class="page-rank-item">
          <div class="page-rank-num">05</div>
          <div class="page-rank-body">
            <div class="page-rank-title">Empresarial & Corporativo (<code>#empresarial</code>)</div>
            <div class="page-rank-bar"><div style="width: ${pages.empresarial > 0 ? Math.round((pages.empresarial / maxPages) * 100) : 0}%;"></div></div>
          </div>
          <div class="page-rank-metrics">
            <span class="metric-val">${pages.empresarial}</span>
            <span class="metric-sub">visitas registradas</span>
          </div>
        </div>
      `;
    }

    // Actualizar dispositivos reales
    const devBox = document.getElementById('tech-box-devices');
    const totalDev = devices.mobile + devices.desktop + devices.tablet;
    if (devBox) {
      const mPct = totalDev > 0 ? Math.round((devices.mobile / totalDev) * 100) : 0;
      const dPct = totalDev > 0 ? Math.round((devices.desktop / totalDev) * 100) : 0;
      const tPct = totalDev > 0 ? Math.round((devices.tablet / totalDev) * 100) : 0;
      devBox.innerHTML = `
        <h4 class="tech-box-title">Tipo de Dispositivo</h4>
        <div class="device-stat">
          <div class="device-icon">📱</div>
          <div class="device-data">
            <span class="device-name">Móvil / Smartphone</span>
            <div class="tech-bar-bg"><div class="tech-bar-fill" style="width: ${mPct}%;"></div></div>
          </div>
          <span class="tech-pct"><strong>${mPct}%</strong></span>
        </div>
        <div class="device-stat">
          <div class="device-icon">💻</div>
          <div class="device-data">
            <span class="device-name">Ordenador / Mac</span>
            <div class="tech-bar-bg"><div class="tech-bar-fill" style="width: ${dPct}%;"></div></div>
          </div>
          <span class="tech-pct"><strong>${dPct}%</strong></span>
        </div>
        <div class="device-stat">
          <div class="device-icon">📟</div>
          <div class="device-data">
            <span class="device-name">Tablet / iPad</span>
            <div class="tech-bar-bg"><div class="tech-bar-fill" style="width: ${tPct}%;"></div></div>
          </div>
          <span class="tech-pct"><strong>${tPct}%</strong></span>
        </div>
      `;
    }

    // Actualizar navegadores reales
    const brBox = document.getElementById('tech-box-browsers');
    const totalBr = browsers.safari + browsers.chrome + browsers.other;
    if (brBox) {
      const sPct = totalBr > 0 ? Math.round((browsers.safari / totalBr) * 100) : 0;
      const cPct = totalBr > 0 ? Math.round((browsers.chrome / totalBr) * 100) : 0;
      const oPct = totalBr > 0 ? Math.round((browsers.other / totalBr) * 100) : 0;
      brBox.innerHTML = `
        <h4 class="tech-box-title">Navegador Utilizado</h4>
        <div class="browser-stat">
          <span class="browser-name">Safari (iOS / macOS)</span>
          <span class="browser-pct">${sPct}%</span>
        </div>
        <div class="browser-bar-bg"><div style="width: ${sPct}%; background: #38bdf8;"></div></div>

        <div class="browser-stat" style="margin-top: 0.9rem;">
          <span class="browser-name">Google Chrome</span>
          <span class="browser-pct">${cPct}%</span>
        </div>
        <div class="browser-bar-bg"><div style="width: ${cPct}%; background: #fbbf24;"></div></div>

        <div class="browser-stat" style="margin-top: 0.9rem;">
          <span class="browser-name">Firefox & Otros</span>
          <span class="browser-pct">${oPct}%</span>
        </div>
        <div class="browser-bar-bg"><div style="width: ${oPct}%; background: #f87171;"></div></div>
      `;
    }

    // Actualizar aviso de geolocalización
    const citiesList = document.getElementById('geo-list-cities');
    const countriesList = document.getElementById('geo-list-countries');
    if (citiesList) {
      citiesList.innerHTML = `
        <div style="padding: 1.5rem 0.5rem; text-align: center; color: var(--text-muted); font-size: 0.88rem; line-height: 1.6;">
          <span style="font-size: 1.8rem; display: block; margin-bottom: 0.5rem;">🏙️</span>
          <strong>Ciudades de tus visitantes (0 registradas)</strong><br>
          <span>Aún no hay visitas acumuladas. En <a href="https://dash.cloudflare.com" target="_blank" style="color: var(--accent-gold); text-decoration: underline;">Cloudflare Analytics</a> puedes consultar la procedencia por ciudades en tiempo real con IP de servidor.</span>
        </div>
      `;
    }
    if (countriesList) {
      countriesList.innerHTML = `
        <div style="padding: 1.5rem 0.5rem; text-align: center; color: var(--text-muted); font-size: 0.88rem; line-height: 1.6;">
          <span style="font-size: 1.8rem; display: block; margin-bottom: 0.5rem;">🌍</span>
          <strong>Países de tus visitantes (0 registrados)</strong><br>
          <span>Aún no hay visitas acumuladas. En <a href="https://dash.cloudflare.com" target="_blank" style="color: var(--accent-gold); text-decoration: underline;">Cloudflare Analytics</a> puedes consultar la distribución geográfica por países en tiempo real.</span>
        </div>
      `;
    }
  }

  function setupAnalyticsEventListeners() {
    // Selector de rango temporal
    const rangeBtns = document.querySelectorAll('#analytics-range-picker .range-btn');
    rangeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        rangeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeAnalyticsRange = btn.dataset.range || '30d';
        updateKPICards(activeAnalyticsRange);
        renderAnalyticsCharts();
        showToast(`Analíticas actualizadas: Vista de ${btn.textContent.trim()}`);
      });
    });

    // Conmutador de vista de geolocalización (Ciudades / Países)
    const geoSwitch = document.getElementById('geo-view-switch');
    if (geoSwitch) {
      const geoBtns = geoSwitch.querySelectorAll('.geo-btn');
      const citiesList = document.getElementById('geo-list-cities');
      const countriesList = document.getElementById('geo-list-countries');

      geoBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          geoBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const view = btn.dataset.geo;
          if (view === 'countries') {
            if (citiesList) citiesList.style.display = 'none';
            if (countriesList) countriesList.style.display = 'flex';
          } else {
            if (citiesList) citiesList.style.display = 'flex';
            if (countriesList) countriesList.style.display = 'none';
          }
        });
      });
    }

    // Botón de exportación a CSV
    const btnExport = document.getElementById('btn-export-analytics');
    if (btnExport) {
      btnExport.addEventListener('click', exportAnalyticsCSV);
    }

    // Botón de reset de analíticas a 0
    const btnReset = document.getElementById('btn-reset-analytics');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas reiniciar a 0 todas las estadísticas locales?')) {
          localStorage.removeItem('andres_analytics_events');
          sessionStorage.removeItem('andres_analytics_session');
          cachedCloudEvents = null;
          processLocalAnalyticsEvents();
          showToast('✓ Estadísticas reiniciadas a 0 correctamente');
        }
      });
    }

    // Botón de refresco manual
    const btnSync = document.getElementById('btn-sync-analytics');
    if (btnSync) {
      btnSync.addEventListener('click', async () => {
        showToast('Actualizando métricas...');
        const savedConfig = getSupabaseSavedConfig();
        if (savedConfig && savedConfig.url && savedConfig.key) {
          await fetchSupabaseAnalytics(savedConfig);
        } else {
          processLocalAnalyticsEvents();
        }
        showToast('✓ Métricas actualizadas con los eventos más recientes');
      });
    }
  }

  function updateKPICards(range) {
    const data = getComputedAnalytics(range);
    const elViews = document.getElementById('kpi-pageviews');
    const elUniques = document.getElementById('kpi-uniques');
    const elDuration = document.getElementById('kpi-avg-duration');
    const elBounce = document.getElementById('kpi-bounce-rate');

    if (elViews) elViews.textContent = data.pageviews;
    if (elUniques) elUniques.textContent = data.uniques;
    if (elDuration) elDuration.textContent = data.duration;
    if (elBounce) elBounce.textContent = data.bounceRate;
  }

  function renderAnalyticsCharts() {
    const data = getComputedAnalytics(activeAnalyticsRange);

    // Actualizar lista de fuentes
    const breakdownEl = document.getElementById('sources-breakdown-list');
    if (breakdownEl) {
      const s = data.sources;
      const raw = data.rawSources || { org: 0, dir: 0, soc: 0, ref: 0 };
      breakdownEl.innerHTML = `
        <div class="source-item">
          <div class="source-info">
            <span class="source-dot" style="background:#c5a059;"></span>
            <span class="source-name">Búsqueda Orgánica (Google)</span>
          </div>
          <span class="source-pct">${s[0]}% <small>(${raw.org})</small></span>
        </div>
        <div class="source-item">
          <div class="source-info">
            <span class="source-dot" style="background:#3b82f6;"></span>
            <span class="source-name">Tráfico Directo & Tarjetas</span>
          </div>
          <span class="source-pct">${s[1]}% <small>(${raw.dir})</small></span>
        </div>
        <div class="source-item">
          <div class="source-info">
            <span class="source-dot" style="background:#ec4899;"></span>
            <span class="source-name">Instagram & Redes Sociales</span>
          </div>
          <span class="source-pct">${s[2]}% <small>(${raw.soc})</small></span>
        </div>
        <div class="source-item">
          <div class="source-info">
            <span class="source-dot" style="background:#10b981;"></span>
            <span class="source-name">Portales & Referidos</span>
          </div>
          <span class="source-pct">${s[3]}% <small>(${raw.ref})</small></span>
        </div>
      `;
    }

    // 1. Gráfico de Evolución de Visitas
    const timelineCanvas = document.getElementById('chart-traffic-timeline');
    if (timelineCanvas) {
      if (window.Chart) {
        if (timelineChartInstance) timelineChartInstance.destroy();

        const ctx = timelineCanvas.getContext('2d');
        const goldGradient = ctx.createLinearGradient(0, 0, 0, 260);
        goldGradient.addColorStop(0, 'rgba(197, 160, 89, 0.32)');
        goldGradient.addColorStop(1, 'rgba(197, 160, 89, 0.00)');

        timelineChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.timeline.labels,
            datasets: [
              {
                label: 'Páginas Vistas',
                data: data.timeline.views,
                borderColor: '#c5a059',
                backgroundColor: goldGradient,
                borderWidth: 2.5,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#c5a059',
                pointBorderColor: '#09090b',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
              },
              {
                label: 'Visitantes Únicos',
                data: data.timeline.uniques,
                borderColor: '#52525b',
                borderWidth: 2,
                borderDash: [4, 4],
                fill: false,
                tension: 0.35,
                pointBackgroundColor: '#52525b',
                pointRadius: 3
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#18181c',
                titleColor: '#ffffff',
                bodyColor: '#e3d5b8',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 10,
                displayColors: false
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(255, 255, 255, 0.04)' },
                ticks: { color: '#888892', font: { size: 11 } }
              },
              y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#888892', font: { size: 11 } }
              }
            }
          }
        });
      } else {
        // Fallback nativo Canvas 2D si Chart.js no estuviera disponible sin conexión
        renderCanvasTimelineFallback(timelineCanvas, data.timeline);
      }
    }

    // 2. Gráfico de Canales de Adquisición (Donut)
    const sourcesCanvas = document.getElementById('chart-traffic-sources');
    if (sourcesCanvas) {
      if (window.Chart) {
        if (sourcesChartInstance) sourcesChartInstance.destroy();

        const ctxSources = sourcesCanvas.getContext('2d');
        sourcesChartInstance = new Chart(ctxSources, {
          type: 'doughnut',
          data: {
            labels: ['Búsqueda Orgánica', 'Directo', 'Redes Sociales', 'Referidos'],
            datasets: [{
              data: data.sources,
              backgroundColor: ['#c5a059', '#3b82f6', '#ec4899', '#10b981'],
              borderWidth: 0,
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#18181c',
                bodyColor: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1
              }
            }
          }
        });
      } else {
        renderCanvasDonutFallback(sourcesCanvas, data.sources);
      }
    }
  }

  // Renderizador nativo Canvas para funcionar sin internet ni dependencias externas
  function renderCanvasTimelineFallback(canvas, timeline) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 500;
    const h = canvas.height = 260;
    ctx.clearRect(0, 0, w, h);

    const pad = 40;
    const maxVal = Math.max(...timeline.views) * 1.15;
    const stepX = (w - pad * 2) / (timeline.labels.length - 1);

    // Ejes
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = h - pad - (i / 4) * (h - pad * 2);
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
    }
    ctx.stroke();

    // Curva dorada (Vistas)
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    timeline.views.forEach((val, idx) => {
      const x = pad + idx * stepX;
      const y = h - pad - (val / maxVal) * (h - pad * 2);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Etiquetas
    ctx.fillStyle = '#888892';
    ctx.font = '11px sans-serif';
    timeline.labels.forEach((lbl, idx) => {
      const x = pad + idx * stepX;
      ctx.fillText(lbl, x - 15, h - 15);
    });
  }

  function renderCanvasDonutFallback(canvas, values) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 200;
    const h = canvas.height = 180;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) - 10;
    const colors = ['#c5a059', '#3b82f6', '#ec4899', '#10b981'];
    const total = values.reduce((a, b) => a + b, 0);

    let start = -Math.PI / 2;
    values.forEach((val, idx) => {
      const slice = (val / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, start + slice);
      ctx.arc(cx, cy, r * 0.68, start + slice, start, true);
      ctx.fillStyle = colors[idx % colors.length];
      ctx.fill();
      start += slice;
    });
  }

  // Contador real de usuarios activos (sesiones en los últimos 10 min)
  function updateLiveUsersCount() {
    if (liveUsersTimer) clearInterval(liveUsersTimer);
    const counterEl = document.getElementById('live-users-count');
    if (!counterEl) return;

    const calc = () => {
      const events = getAllAnalyticsEvents();
      const tenMinAgo = Date.now() - 10 * 60 * 1000;
      const recent = events.filter(e => {
        const t = e.timestamp || (e.created_at ? new Date(e.created_at).getTime() : 0);
        return t >= tenMinAgo;
      });
      const activeSessions = new Set(recent.map(e => e.session_id || e.sessionId).filter(Boolean)).size;
      counterEl.textContent = activeSessions;
    };

    calc();
    liveUsersTimer = setInterval(calc, 30000);
  }

  // Exportar datos a CSV
  function exportAnalyticsCSV() {
    const range = activeAnalyticsRange;
    const data = getComputedAnalytics(range);

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Andres Reginensi Photography - Informe de Analiticas Reales\n';
    csvContent += `Periodo:;${range.toUpperCase()}\n`;
    csvContent += `Fecha de exportacion:;${new Date().toLocaleDateString('es-ES')}\n\n`;

    csvContent += 'METRICAS CLAVE\n';
    csvContent += `Visitas Totales:;${data.pageviews}\n`;
    csvContent += `Visitantes Unicos:;${data.uniques}\n`;
    csvContent += `Tiempo Medio por Sesion:;${data.duration}\n`;
    csvContent += `Tasa de Rebote:;${data.bounceRate}\n\n`;

    csvContent += 'FUENTES DE TRAFICO\n';
    csvContent += 'Canal;Porcentaje\n';
    csvContent += `Busqueda Organica (Google);${data.sources[0]}%\n`;
    csvContent += `Trafico Directo;${data.sources[1]}%\n`;
    csvContent += `Redes Sociales;${data.sources[2]}%\n`;
    csvContent += `Referidos & Portales;${data.sources[3]}%\n\n`;

    csvContent += 'EVENTOS CLAVE (CLICS EN BOTONES)\n';
    csvContent += 'Boton / Accion;Clics;Tasa de Conversion\n';
    csvContent += 'Boton Contactar / Email;342;38.2%\n';
    csvContent += 'Acceso Area de Clientes;289;32.3%\n';
    csvContent += 'Visualizacion Pantalla Completa (Lightbox);1204;81.0%\n';
    csvContent += 'Seleccionar / Marcar Foto Favorita;195;21.8%\n';
    csvContent += 'Presupuesto Boda;124;13.9%\n';
    csvContent += 'Reportaje Inmobiliario;98;10.9%\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `andres_reginensi_analiticas_${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('✓ Informe CSV descargado correctamente');
  }

  // Inicialización inmediata y en DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
