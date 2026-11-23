/**
 * Andrés Reginensi Photography — Gestor de Datos Seguro (Cloudflare Pages Functions + Portafolio Público)
 *
 * Arquitectura de seguridad:
 * - CERO contraseñas, hashes de administrador, tokens de GitHub ni listados de galerías privadas en el cliente.
 * - La autenticación de admin y el acceso a galerías privadas se validan en servidor (/api/*) mediante
 *   cookies firmadas HttpOnly; Secure; SameSite=Strict.
 * - La publicación en GitHub se ejecuta en servidor (/api/github/*) usando env.GITHUB_TOKEN en Cloudflare Pages.
 * - Al iniciar, purga cualquier token legado que pudiera haber quedado en localStorage.
 */

(function (window) {
  'use strict';

  const DB_NAME = 'AndresPhotographyDB';
  const DB_VERSION = 3;
  const DEFAULT_HERO = 'assets/images/portada.webp';
  const SITE_DATA_PUBLIC_PATH = 'assets/data/site-data.json';
  const BASE_INITIAL_TIMESTAMP = 1700000000099;
  const PREVIEW_STORAGE_KEY = 'andres_instant_previews';

  // Purgar inmediatamente credenciales legadas que no deben vivir en el navegador
  (function purgeLegacyClientSecrets() {
    try {
      localStorage.removeItem('andres_github_config');
      localStorage.removeItem('andres_admin_auth');
      localStorage.removeItem('andres_sessions');
      sessionStorage.removeItem('andres_admin_auth');
    } catch (e) {}
  })();

  // Portafolio público de respaldo (solo material público del portafolio)
  const DEFAULT_PORTFOLIO = [
    {
      id: 'port-real-1',
      category: 'realestate',
      categoryLabel: 'Inmobiliaria & Real Estate',
      title: 'Villa Galileu',
      tag: 'Arquitectura Exterior & Piscina',
      caption: 'Villa Galileu — Arquitectura Contemporánea & Piscina',
      aspect: 'landscape',
      thumbUrl: 'assets/images/realestate/galileu-piscina-thumb.webp',
      fullUrl: 'assets/images/realestate/galileu-piscina.webp',
      createdAt: 1700000000001
    },
    {
      id: 'port-real-2',
      category: 'realestate',
      categoryLabel: 'Inmobiliaria & Real Estate',
      title: 'Villa Galileu — Foyer',
      tag: 'Interiorismo de Lujo',
      caption: 'Villa Galileu — Foyer de Entrada & Diseño Interior',
      aspect: 'landscape',
      thumbUrl: 'assets/images/realestate/galileu-salon-thumb.webp',
      fullUrl: 'assets/images/realestate/galileu-salon.webp',
      createdAt: 1700000000002
    },
    {
      id: 'port-real-3',
      category: 'realestate',
      categoryLabel: 'Inmobiliaria & Real Estate',
      title: 'Villa Galileu — Cocina',
      tag: 'Espacios Residenciales',
      caption: 'Villa Galileu — Cocina de Autor & Isla de Mármol',
      aspect: 'landscape',
      thumbUrl: 'assets/images/realestate/galileu-cocina-thumb.webp',
      fullUrl: 'assets/images/realestate/galileu-cocina.webp',
      createdAt: 1700000000003
    },
    {
      id: 'port-boda-1',
      category: 'bodas',
      categoryLabel: 'Bodas & Eventos',
      title: 'La Salida',
      tag: 'Ceremonia B&N',
      caption: 'La Salida — Ceremonia B&N',
      aspect: 'portrait',
      thumbUrl: 'assets/images/uploads/bodas-la-salida-thumb-1793484078424-w7qb.webp',
      fullUrl: 'assets/images/uploads/bodas-la-salida-full-1793484078424-114u.webp',
      createdAt: 1700000000020
    },
    {
      id: 'port-boda-3',
      category: 'bodas',
      categoryLabel: 'Bodas & Eventos',
      title: 'Orilla Dorada',
      tag: 'Atardecer & Pareja',
      caption: 'Orilla Dorada — Atardecer & Pareja',
      aspect: 'portrait',
      thumbUrl: 'assets/images/uploads/bodas-orilla-dorada-thumb-1793484078424-kg3p.webp',
      fullUrl: 'assets/images/uploads/bodas-orilla-dorada-full-1793484078424-j38e.webp',
      createdAt: 1700000000019
    },
    {
      id: 'port-boda-2',
      category: 'bodas',
      categoryLabel: 'Bodas & Eventos',
      title: 'Paseo Urbano',
      tag: 'Documental Editorial',
      caption: 'Paseo Urbano — Retrato Editorial de Novios',
      aspect: 'landscape',
      thumbUrl: 'assets/images/bodas/boda-editorial-calle-thumb.webp',
      fullUrl: 'assets/images/bodas/boda-editorial-calle.webp',
      createdAt: 1700000000005
    },
    {
      id: 'port-ret-1',
      category: 'retratos',
      categoryLabel: 'Retratos & Editorial',
      title: 'Steffa',
      tag: 'Editorial Nocturno',
      caption: 'Steffa — Noche Urbana, Rascacielos & Bokeh',
      aspect: 'portrait',
      thumbUrl: 'assets/images/retratos/retrato-steffa-noche-thumb.webp',
      fullUrl: 'assets/images/retratos/retrato-steffa-noche.webp',
      createdAt: 1700000000007
    },
    {
      id: 'port-ret-2',
      category: 'retratos',
      categoryLabel: 'Retratos & Editorial',
      title: 'Luz Dorada',
      tag: 'Luz Natural en Exterior',
      caption: 'Luz Dorada — Atardecer & Flare Natural',
      aspect: 'portrait',
      thumbUrl: 'assets/images/retratos/retrato-golden-hour-thumb.webp',
      fullUrl: 'assets/images/retratos/retrato-golden-hour.webp',
      createdAt: 1700000000008
    },
    {
      id: 'port-ret-3',
      category: 'retratos',
      categoryLabel: 'Retratos & Editorial',
      title: 'Brisa Marina',
      tag: 'Luz Suave & Atmósfera',
      caption: 'Serenidad Marina — Retrato en la Playa',
      aspect: 'portrait',
      thumbUrl: 'assets/images/retratos/retrato-playa-sombrero-thumb.webp',
      fullUrl: 'assets/images/retratos/retrato-playa-sombrero.webp',
      createdAt: 1700000000009
    },
    {
      id: 'port-corp-1',
      category: 'empresarial',
      categoryLabel: 'Empresarial & Corporativo',
      title: 'Presencia de Marca',
      tag: 'Headshot Profesional',
      caption: 'Identidad Corporativa — Retrato Profesional en Estudio',
      aspect: 'landscape',
      thumbUrl: 'assets/images/retratos/retrato-corporativo-estudio-thumb.webp',
      fullUrl: 'assets/images/retratos/retrato-corporativo-estudio.webp',
      createdAt: 1700000000010
    },
    {
      id: 'port-corp-2',
      category: 'empresarial',
      categoryLabel: 'Empresarial & Corporativo',
      title: 'Liderazgo',
      tag: 'Perfil Ejecutivo',
      caption: 'Liderazgo Corporativo — Retrato de Negocios',
      aspect: 'landscape',
      thumbUrl: 'assets/images/retratos/retrato-ejecutivo-profesional-thumb.webp',
      fullUrl: 'assets/images/retratos/retrato-ejecutivo-profesional.webp',
      createdAt: 1700000000011
    },
    {
      id: 'port-corp-3',
      category: 'empresarial',
      categoryLabel: 'Empresarial & Corporativo',
      title: '25 años MEDIAMARKT',
      tag: 'Empresariales',
      caption: '25 años MEDIAMARKT — Empresariales',
      aspect: 'landscape',
      thumbUrl: 'assets/images/uploads/empresarial-25-anos-mediamarkt-thumb-1794269820352-we5q.webp',
      fullUrl: 'assets/images/uploads/empresarial-25-anos-mediamarkt-full-1794269820352-s4ka.webp',
      createdAt: 1700000000012
    }
  ];

  const DEFAULT_PORTFOLIO_MAP = new Map(DEFAULT_PORTFOLIO.map((p) => [p.id, p]));
  const memoryPreviewMap = {};
  let useLocalStorageFallback = false;
  let publicSiteDataPromise = null;
  let publicSiteDataTime = 0;
  let cachedServerStatus = null;

  const cmsChannel =
    typeof window.BroadcastChannel !== 'undefined'
      ? new window.BroadcastChannel('andres_cms_channel')
      : null;

  function notifyPortfolioChanged() {
    const ts = Date.now();
    setLS('portfolio_broadcast_ts', ts);
    if (cmsChannel) {
      try {
        cmsChannel.postMessage({ type: 'portfolio_updated', ts });
      } catch (e) {}
    }
  }

  function getLS(key, fallbackValue) {
    try {
      const data = localStorage.getItem('andres_' + key);
      return data ? JSON.parse(data) : fallbackValue;
    } catch (e) {
      return fallbackValue;
    }
  }

  function setLS(key, value) {
    try {
      localStorage.setItem('andres_' + key, JSON.stringify(value));
    } catch (e) {}
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      if (useLocalStorageFallback || !window.indexedDB) {
        return reject(new Error('IndexedDB no disponible'));
      }
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('portfolio')) {
            db.createObjectStore('portfolio', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
          // Eliminar almacén legado de sesiones privadas en el navegador
          if (db.objectStoreNames.contains('sessions')) {
            db.deleteObjectStore('sessions');
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          useLocalStorageFallback = true;
          reject(req.error);
        };
      } catch (err) {
        useLocalStorageFallback = true;
        reject(err);
      }
    });
  }

  async function initStorage() {
    try {
      const db = await openDB();
      // Borrar cualquier credencial antigua que hubiera quedado en IndexedDB
      try {
        const cleanTx = db.transaction('settings', 'readwrite');
        cleanTx.objectStore('settings').delete('admin_auth');
      } catch (e) {}

      const existingPhotos = await new Promise((res) => {
        const tx = db.transaction('portfolio', 'readonly');
        const r = tx.objectStore('portfolio').getAll();
        r.onsuccess = () => res(r.result || []);
        r.onerror = () => res([]);
      });

      if (existingPhotos.length === 0) {
        const tx = db.transaction('portfolio', 'readwrite');
        const store = tx.objectStore('portfolio');
        DEFAULT_PORTFOLIO.forEach((p) => store.put(p));
      }
    } catch (err) {
      useLocalStorageFallback = true;
      if (!getLS('portfolio', null)) {
        setLS('portfolio', DEFAULT_PORTFOLIO);
      }
    }
  }

  // =======================================================
  // CLIENTE HTTP DE CLOUDFLARE PAGES FUNCTIONS (/api/*)
  // =======================================================
  async function apiRequest(path, options = {}) {
    const fetchOpts = Object.assign(
      {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {}
      },
      options
    );
    if (fetchOpts.body && typeof fetchOpts.body !== 'string') {
      fetchOpts.body = JSON.stringify(fetchOpts.body);
      fetchOpts.headers['Content-Type'] = 'application/json';
    }
    fetchOpts.headers['Accept'] = 'application/json';

    const res = await fetch(path, fetchOpts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `Error del servidor (HTTP ${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // Autenticación de administrador (100 % en servidor con cookie HttpOnly)
  async function getAdminSession() {
    try {
      const info = await apiRequest('/api/admin/session');
      cachedServerStatus = info;
      return info;
    } catch (err) {
      return { authenticated: false, configured: false, offline: true };
    }
  }

  async function loginAdmin(username, password) {
    const res = await apiRequest('/api/admin/login', {
      method: 'POST',
      body: { username, password }
    });
    cachedServerStatus = null;
    return res;
  }

  async function logoutAdmin() {
    cachedServerStatus = null;
    return apiRequest('/api/admin/logout', { method: 'POST' }).catch(() => ({ ok: true }));
  }

  async function changeAdminPassword(currentPassword, username, newPassword) {
    const res = await apiRequest('/api/admin/change-password', {
      method: 'POST',
      body: { currentPassword, username, newPassword }
    });
    cachedServerStatus = null;
    return res;
  }

  // Generador offline de hash PBKDF2-SHA256 para facilitar la rotación de ADMIN_PASSWORD_HASH en Cloudflare
  async function generatePbkdf2Hash(plainSecret, iterations = 100000) {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      throw new Error('Web Crypto API requiere un contexto seguro (HTTPS).');
    }
    const salt = new Uint8Array(16);
    window.crypto.getRandomValues(salt);
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(String(plainSecret || '')),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derived = new Uint8Array(
      await window.crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
        keyMaterial,
        256
      )
    );
    const toHex = (arr) =>
      Array.from(arr)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    return `pbkdf2_sha256$${iterations}$${toHex(salt)}$${toHex(derived)}`;
  }

  // Estado del proxy GitHub en Cloudflare Pages (sin tokens en el navegador)
  async function getGitHubServerStatus() {
    try {
      const st = await apiRequest('/api/github/status');
      cachedServerStatus = Object.assign({}, cachedServerStatus || {}, {
        githubConfigured: Boolean(st.configured),
        githubInfo: st
      });
      return st;
    } catch (err) {
      return { configured: false, owner: 'andresreginensi', repo: 'andresreginensi', branch: 'main' };
    }
  }

  function isCloudEnabled() {
    return Boolean(cachedServerStatus && cachedServerStatus.githubConfigured);
  }

  async function fetchServerGitHubSiteData() {
    return apiRequest('/api/github/site-data');
  }

  async function commitToServerGitHub(filesToUpload, newSiteData, commitMessage) {
    return apiRequest('/api/github/commit', {
      method: 'POST',
      body: {
        files: filesToUpload,
        siteData: {
          version: 1,
          updatedAt: Date.now(),
          heroImage: newSiteData.heroImage || DEFAULT_HERO,
          portfolio: Array.isArray(newSiteData.portfolio) ? newSiteData.portfolio : []
        },
        commitMessage
      }
    });
  }

  // =======================================================
  // CACHÉ DE VISTAS PREVIAS INMEDIATAS (mientras Cloudflare despliega)
  // =======================================================
  function loadStoredPreviews() {
    try {
      const raw = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const now = Date.now();
      Object.keys(parsed).forEach((k) => {
        if (parsed[k] && now - parsed[k].ts < 600000) {
          memoryPreviewMap[k] = parsed[k];
        }
      });
    } catch (e) {}
  }
  loadStoredPreviews();

  function saveInstantPreview(repoPath, dataUrl) {
    if (!repoPath || !dataUrl) return;
    memoryPreviewMap[repoPath] = { dataUrl, ts: Date.now() };
    try {
      sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(memoryPreviewMap));
    } catch (e) {}
  }

  function resolvePreviewUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (!memoryPreviewMap[url]) loadStoredPreviews();
    const entry = memoryPreviewMap[url];
    if (entry && Date.now() - entry.ts < 600000) {
      return entry.dataUrl;
    }
    return url;
  }

  function applyPreviewUrlsToPhoto(p) {
    if (!p) return p;
    return Object.assign({}, p, {
      thumbUrl: resolvePreviewUrl(p.thumbUrl || p.fullUrl),
      fullUrl: resolvePreviewUrl(p.fullUrl)
    });
  }

  function prepareImageForUpload(urlOrData, folderPrefix, filesToUpload) {
    if (!urlOrData || typeof urlOrData !== 'string' || !urlOrData.startsWith('data:')) {
      return urlOrData;
    }
    const commaIdx = urlOrData.indexOf(',');
    if (commaIdx === -1) return urlOrData;

    const header = urlOrData.substring(0, commaIdx);
    const base64Data = urlOrData.substring(commaIdx + 1);
    const ext = header.includes('webp') ? 'webp' : header.includes('png') ? 'png' : 'jpg';
    const safePrefix = (folderPrefix || 'foto').replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-');
    const rand = Math.random().toString(36).substring(2, 6);
    const repoPath = `assets/images/uploads/${safePrefix}-${Date.now()}-${rand}.${ext}`;

    filesToUpload.push({ path: repoPath, base64: base64Data });
    saveInstantPreview(repoPath, urlOrData);
    return repoPath;
  }

  // =======================================================
  // PORTAFOLIO PÚBLICO (lectura desde site-data.json + publicación vía proxy)
  // =======================================================
  async function fetchPublicDeployedSiteData() {
    if (publicSiteDataPromise && Date.now() - publicSiteDataTime < 2500) {
      return publicSiteDataPromise;
    }
    publicSiteDataTime = Date.now();
    publicSiteDataPromise = fetch(`${SITE_DATA_PUBLIC_PATH}?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
    return publicSiteDataPromise;
  }

  async function getLocalHeroImage() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const req = db.transaction('settings', 'readonly').objectStore('settings').get('hero_image');
        req.onsuccess = () => resolve(req.result ? req.result.value : DEFAULT_HERO);
        req.onerror = () => resolve(DEFAULT_HERO);
      });
    } catch (e) {
      return getLS('hero_image', DEFAULT_HERO);
    }
  }

  async function saveLocalHeroImage(url) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const req = db.transaction('settings', 'readwrite').objectStore('settings').put({ key: 'hero_image', value: url });
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      setLS('hero_image', url);
      return true;
    }
  }

  async function getHeroImage() {
    const pubData = await fetchPublicDeployedSiteData();
    if (pubData && pubData.updatedAt > BASE_INITIAL_TIMESTAMP && pubData.heroImage) {
      return resolvePreviewUrl(pubData.heroImage);
    }
    return getLocalHeroImage();
  }

  async function saveHeroImage(url) {
    let finalUrl = url;
    const st = await getGitHubServerStatus();
    if (st.configured) {
      const ghData = (await fetchServerGitHubSiteData().catch(() => null)) || {
        version: 1,
        heroImage: DEFAULT_HERO,
        portfolio: await getLocalPortfolioPhotos()
      };
      const filesToUpload = [];
      finalUrl = prepareImageForUpload(url, 'hero-portada', filesToUpload);
      ghData.heroImage = finalUrl;
      await commitToServerGitHub(filesToUpload, ghData, 'Admin: Actualizar fotografía de portada');
    }

    await saveLocalHeroImage(finalUrl);
    notifyPortfolioChanged();
    return resolvePreviewUrl(finalUrl);
  }

  async function getLocalPortfolioPhotos() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const req = db.transaction('portfolio', 'readonly').objectStore('portfolio').getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          list.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
          resolve(list.length > 0 ? list : DEFAULT_PORTFOLIO);
        };
        req.onerror = () => resolve(getLS('portfolio', DEFAULT_PORTFOLIO));
      });
    } catch (e) {
      return getLS('portfolio', DEFAULT_PORTFOLIO);
    }
  }

  async function replaceAllLocalPortfolioPhotos(photos) {
    try {
      const db = await openDB();
      await new Promise((resolve) => {
        const tx = db.transaction('portfolio', 'readwrite');
        const st = tx.objectStore('portfolio');
        st.clear();
        photos.forEach((p) => st.put(p));
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      setLS('portfolio', photos);
    }
  }

  async function getAllPortfolioPhotos() {
    const pubData = await fetchPublicDeployedSiteData();
    if (
      pubData &&
      Number(pubData.updatedAt) > BASE_INITIAL_TIMESTAMP &&
      Array.isArray(pubData.portfolio) &&
      pubData.portfolio.length > 0
    ) {
      return pubData.portfolio.map(applyPreviewUrlsToPhoto);
    }
    const localList = await getLocalPortfolioPhotos();
    return localList.map(applyPreviewUrlsToPhoto);
  }

  async function savePortfolioPhoto(photo) {
    const currentList = await getAllPortfolioPhotos().catch(() => [...DEFAULT_PORTFOLIO]);
    const existingItem = photo.id ? currentList.find((p) => p.id === photo.id) : null;
    const now = Date.now();

    if (!photo.id) {
      photo.id = 'photo-' + now + '-' + Math.random().toString(36).slice(2, 7);
    }
    if (!photo.createdAt) {
      photo.createdAt = existingItem?.createdAt || now;
    }
    photo.updatedAt = now;

    const rawFullData = photo.fullUrl;
    const rawThumbData = photo.thumbUrl || photo.fullUrl;

    const updatedList = currentList.length > 0 ? [...currentList] : [...DEFAULT_PORTFOLIO];
    const localIdx = updatedList.findIndex((p) => p.id === photo.id);
    if (localIdx >= 0) updatedList[localIdx] = Object.assign({}, photo);
    else updatedList.unshift(Object.assign({}, photo));

    await replaceAllLocalPortfolioPhotos(updatedList);
    notifyPortfolioChanged();

    const st = await getGitHubServerStatus();
    if (st.configured) {
      const ghData = (await fetchServerGitHubSiteData().catch(() => null)) || {
        version: 1,
        heroImage: await getLocalHeroImage(),
        portfolio: [...updatedList]
      };
      if (!Array.isArray(ghData.portfolio) || ghData.portfolio.length === 0) {
        ghData.portfolio = [...updatedList];
      }

      const filesToUpload = [];
      const safeSlug = slugify(photo.title || photo.category || 'foto');
      photo.fullUrl = prepareImageForUpload(rawFullData, `${photo.category || 'port'}-${safeSlug}-full`, filesToUpload);
      photo.thumbUrl = prepareImageForUpload(rawThumbData, `${photo.category || 'port'}-${safeSlug}-thumb`, filesToUpload);

      const idx = ghData.portfolio.findIndex((p) => p.id === photo.id);
      if (idx >= 0) ghData.portfolio[idx] = Object.assign({}, photo);
      else ghData.portfolio.unshift(Object.assign({}, photo));

      const actionLabel = existingItem ? `Editar foto "${photo.title}"` : `Publicar foto "${photo.title}"`;
      await commitToServerGitHub(filesToUpload, ghData, `Admin: ${actionLabel}`);

      const syncedIdx = updatedList.findIndex((p) => p.id === photo.id);
      if (syncedIdx >= 0) updatedList[syncedIdx] = Object.assign({}, photo);
      await replaceAllLocalPortfolioPhotos(updatedList);
      notifyPortfolioChanged();
    }

    return applyPreviewUrlsToPhoto(photo);
  }

  async function deletePortfolioPhoto(id) {
    const currentList = await getAllPortfolioPhotos().catch(() => [...DEFAULT_PORTFOLIO]);
    const updatedList = currentList.filter((p) => p.id !== id);
    await replaceAllLocalPortfolioPhotos(updatedList);
    notifyPortfolioChanged();

    const st = await getGitHubServerStatus();
    if (st.configured) {
      const ghData = await fetchServerGitHubSiteData();
      if (ghData && Array.isArray(ghData.portfolio)) {
        const target = ghData.portfolio.find((p) => p.id === id);
        ghData.portfolio = ghData.portfolio.filter((p) => p.id !== id);
        await commitToServerGitHub([], ghData, `Admin: Eliminar foto "${target ? target.title : id}"`);
        notifyPortfolioChanged();
      }
    }
    return true;
  }

  async function syncLocalDataToGitHub() {
    const st = await getGitHubServerStatus();
    if (!st.configured) {
      throw new Error('Configura GITHUB_TOKEN en Cloudflare Pages > Settings > Environment variables.');
    }

    const filesToUpload = [];
    const localPhotos = await getLocalPortfolioPhotos();
    const cleanPhotos = localPhotos.map((p) => {
      const copy = Object.assign({}, p);
      const safeSlug = slugify(copy.title || copy.id || 'foto');
      copy.fullUrl = prepareImageForUpload(copy.fullUrl, `${copy.category || 'port'}-${safeSlug}-full`, filesToUpload);
      copy.thumbUrl = prepareImageForUpload(copy.thumbUrl || copy.fullUrl, `${copy.category || 'port'}-${safeSlug}-thumb`, filesToUpload);
      return copy;
    });

    let localHero = await getLocalHeroImage();
    if (localHero && localHero.startsWith('data:')) {
      localHero = prepareImageForUpload(localHero, 'hero-portada', filesToUpload);
    }

    const res = await commitToServerGitHub(
      filesToUpload,
      {
        version: 1,
        heroImage: localHero || DEFAULT_HERO,
        portfolio: cleanPhotos
      },
      'Admin: Sincronización de portafolio público y portada'
    );

    await saveLocalHeroImage(localHero || DEFAULT_HERO);
    await replaceAllLocalPortfolioPhotos(cleanPhotos);
    notifyPortfolioChanged();

    return {
      syncedPhotos: cleanPhotos.length,
      uploadedFiles: filesToUpload.length,
      commitSha: res.commitSha
    };
  }

  async function resetToDefaultData() {
    const st = await getGitHubServerStatus();
    if (st.configured) {
      await commitToServerGitHub(
        [],
        {
          version: 1,
          heroImage: DEFAULT_HERO,
          portfolio: [...DEFAULT_PORTFOLIO]
        },
        'Admin: Restablecer portafolio a valores iniciales'
      );
    }
    await replaceAllLocalPortfolioPhotos([...DEFAULT_PORTFOLIO]);
    await saveLocalHeroImage(DEFAULT_HERO);
    notifyPortfolioChanged();
    return true;
  }

  // =======================================================
  // GALERÍAS PRIVADAS DE CLIENTES (100 % SERVIDOR — /api/galleries/*)
  // =======================================================
  async function getAllClientSessions() {
    const res = await apiRequest('/api/galleries/admin');
    return Array.isArray(res.sessions) ? res.sessions : [];
  }

  async function saveClientSession(session) {
    const res = await apiRequest('/api/galleries/admin', {
      method: 'POST',
      body: session
    });
    return res.session;
  }

  async function deleteClientSession(id) {
    await apiRequest(`/api/galleries/admin?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return true;
  }

  async function unlockClientGallery(sessionId, pin) {
    const res = await apiRequest('/api/galleries/unlock', {
      method: 'POST',
      body: { sessionId, pin }
    });
    return res.session;
  }

  async function getActiveClientGallery(sessionId = '') {
    const qs = sessionId ? `?session=${encodeURIComponent(sessionId)}` : '';
    const res = await apiRequest(`/api/galleries/session${qs}`);
    return res.authenticated ? res.session : null;
  }

  async function logoutClientGallery() {
    return apiRequest('/api/galleries/logout', { method: 'POST' }).catch(() => ({ ok: true }));
  }

  // =======================================================
  // PROCESAMIENTO DE IMÁGENES EN CLIENTE (compresión antes de subir)
  // =======================================================
  function processImageFile(file) {
    return new Promise((resolve, reject) => {
      if (file.type && !file.type.startsWith('image/')) {
        return reject(new Error('El archivo seleccionado no es una imagen válida.'));
      }

      const handleLoadedImage = (img, cleanupUrl) => {
        try {
          const fullUrl = resizeImage(img, 1920, 0.85);
          const thumbUrl = resizeImage(img, 750, 0.82);
          if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);
          resolve({ fullUrl, thumbUrl, originalName: file.name });
        } catch (err) {
          if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);
          reject(new Error('No se pudo procesar la imagen seleccionada.'));
        }
      };

      if (window.URL && window.URL.createObjectURL) {
        const objUrl = window.URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => handleLoadedImage(img, objUrl);
        img.onerror = () => {
          window.URL.revokeObjectURL(objUrl);
          fallbackFileReader(file, handleLoadedImage, reject);
        };
        img.src = objUrl;
      } else {
        fallbackFileReader(file, handleLoadedImage, reject);
      }
    });
  }

  function fallbackFileReader(file, handleLoadedImage, reject) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => handleLoadedImage(img, null);
      img.onerror = () => reject(new Error('No se pudo abrir la imagen. Usa formato JPG, PNG o WebP.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Error de lectura del archivo.'));
    reader.readAsDataURL(file);
  }

  function resizeImage(img, maxDim, quality) {
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;
    if (width > height) {
      if (width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      }
    } else if (height > maxDim) {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    const webpData = canvas.toDataURL('image/webp', quality);
    if (webpData && webpData.startsWith('data:image/webp')) {
      return webpData;
    }
    return canvas.toDataURL('image/jpeg', quality);
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  }

  function getSupabaseConfig() {
    try {
      const localCfg = JSON.parse(localStorage.getItem('andres_supabase_config') || 'null');
      if (localCfg && localCfg.url && localCfg.key) {
        return { url: localCfg.url.trim().replace(/\/$/, ''), key: localCfg.key.trim() };
      }
    } catch (e) {}
    return null;
  }

  window.AndresDB = {
    DEFAULT_PORTFOLIO,
    initStorage,
    // Auth servidor
    getAdminSession,
    loginAdmin,
    logoutAdmin,
    changeAdminPassword,
    generatePbkdf2Hash,
    // GitHub proxy servidor
    getGitHubServerStatus,
    isCloudEnabled,
    syncLocalDataToGitHub,
    getSupabaseConfig,
    // Portafolio público
    getAllPortfolioPhotos,
    savePortfolioPhoto,
    deletePortfolioPhoto,
    getHeroImage,
    saveHeroImage,
    resetToDefaultData,
    // Galerías privadas (100 % servidor)
    getAllClientSessions,
    saveClientSession,
    deleteClientSession,
    unlockClientGallery,
    getActiveClientGallery,
    logoutClientGallery,
    // Utilidades
    processImageFile,
    DEFAULT_PORTFOLIO_MAP
  };
})(window);
