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

  async function showDashboard() {
    if (dom.loginScreen) dom.loginScreen.style.display = 'none';
    if (dom.adminPanel) dom.adminPanel.style.display = 'flex';

    if (db && db.getHeroImage && dom.adminHeroPreview) {
      try {
        const heroUrl = await db.getHeroImage();
        if (heroUrl) dom.adminHeroPreview.src = heroUrl;
      } catch (err) {
        console.warn('Could not load hero image:', err);
      }
    }

    await refreshPortfolio();
    await refreshSessions();
    await loadCurrentSettings();
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

  async function loadCurrentSettings() {
    if (!db || !db.getAdminCredentials) return;
    const auth = await db.getAdminCredentials();
    if (auth && dom.settingUsername) {
      dom.settingUsername.value = auth.username || 'admin';
    }
  }

  // Inicialización inmediata y en DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
