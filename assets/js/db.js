/**
 * Andrés Reginensi Photography — Gestor de Datos Híbrido (GitHub Direct CMS + Local)
 * Publica directamente desde admin.html hacia el repositorio GitHub (andresreginensi/andresreginensi)
 * mediante commits atómicos (imágenes optimizadas en WebP + assets/data/site-data.json),
 * desplegando automáticamente en Cloudflare Pages para todos los móviles y dispositivos del mundo.
 */

(function (window) {
  'use strict';

  const DB_NAME = 'AndresPhotographyDB';
  const DB_VERSION = 2;

  // Fotos iniciales por defecto para el portafolio (Fotos auténticas de Andrés Reginensi)
  const DEFAULT_PORTFOLIO = [
    {
      id: 'port-real-1',
      category: 'realestate',
      categoryLabel: 'Inmobiliaria & Real Estate',
      title: 'Villa Galileu',
      tag: 'Arquitectura Exterior & Piscina',
      caption: 'Villa Galileu — Arquitectura Contemporánea & Piscina',
      aspect: 'landscape',
      thumbUrl: 'assets/images/realestate/galileu-piscina-thumb.jpg',
      fullUrl: 'assets/images/realestate/galileu-piscina.jpg',
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
      thumbUrl: 'assets/images/realestate/galileu-salon-thumb.jpg',
      fullUrl: 'assets/images/realestate/galileu-salon.jpg',
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
      thumbUrl: 'assets/images/realestate/galileu-cocina-thumb.jpg',
      fullUrl: 'assets/images/realestate/galileu-cocina.jpg',
      createdAt: 1700000000003
    },
    {
      id: 'port-boda-1',
      category: 'bodas',
      categoryLabel: 'Bodas & Eventos',
      title: 'La Salida',
      tag: 'Ceremonia B&N',
      caption: 'La Salida — Ceremonia B&N',
      aspect: 'landscape',
      thumbUrl: 'assets/images/uploads/bodas-la-salida-thumb-1793484078424-w7qb.jpg',
      fullUrl: 'assets/images/uploads/bodas-la-salida-full-1793484078424-114u.jpg',
      createdAt: 1793406876568
    },
    {
      id: 'port-boda-3',
      category: 'bodas',
      categoryLabel: 'Bodas & Eventos',
      title: 'Orilla Dorada',
      tag: 'Atardecer & Pareja',
      caption: 'Orilla Dorada — Atardecer & Pareja',
      aspect: 'landscape',
      thumbUrl: 'assets/images/uploads/bodas-orilla-dorada-thumb-1793484078424-kg3p.jpg',
      fullUrl: 'assets/images/uploads/bodas-orilla-dorada-full-1793484078424-j38e.jpg',
      createdAt: 1793406675069
    },
    {
      id: 'port-boda-2',
      category: 'bodas',
      categoryLabel: 'Bodas & Eventos',
      title: 'Paseo Urbano',
      tag: 'Documental Editorial',
      caption: 'Paseo Urbano — Retrato Editorial de Novios',
      aspect: 'landscape',
      thumbUrl: 'assets/images/bodas/boda-editorial-calle-thumb.jpg',
      fullUrl: 'assets/images/bodas/boda-editorial-calle.jpg',
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
      thumbUrl: 'assets/images/retratos/retrato-steffa-noche-thumb.jpg',
      fullUrl: 'assets/images/retratos/retrato-steffa-noche.jpg',
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
      thumbUrl: 'assets/images/retratos/retrato-golden-hour-thumb.jpg',
      fullUrl: 'assets/images/retratos/retrato-golden-hour.jpg',
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
      thumbUrl: 'assets/images/retratos/retrato-playa-sombrero-thumb.jpg',
      fullUrl: 'assets/images/retratos/retrato-playa-sombrero.jpg',
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
      thumbUrl: 'assets/images/retratos/retrato-corporativo-estudio-thumb.jpg',
      fullUrl: 'assets/images/retratos/retrato-corporativo-estudio.jpg',
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
      thumbUrl: 'assets/images/retratos/retrato-ejecutivo-profesional-thumb.jpg',
      fullUrl: 'assets/images/retratos/retrato-ejecutivo-profesional.jpg',
      createdAt: 1700000000011
    },
    {
      id: 'port-corp-3',
      category: 'empresarial',
      categoryLabel: 'Empresarial & Corporativo',
      title: 'Edificio Burgueras',
      tag: 'Sede & Arquitectura Comercial',
      caption: 'Edificio Burgueras — Geometría, Cristales & Fachada Moderna',
      aspect: 'landscape',
      thumbUrl: 'assets/images/realestate/burgueras-fachada-thumb.jpg',
      fullUrl: 'assets/images/realestate/burgueras-fachada.jpg',
      createdAt: 1700000000012
    }
  ];

  // Sesiones de clientes iniciales con fotos auténticas (PIN almacenado como SHA-256)
  const DEFAULT_SESSIONS = [
    {
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
      ],
      createdAt: 1700000000001
    },
    {
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
      ],
      createdAt: 1700000000002
    }
  ];

  const DEFAULT_AUTH = {
    username: 'admin',
    passwordHash: '01563515ba1e225d4db45b7081342d0e421a936050fd608c654430408c816b23'
  };

  // Fallback SHA-256 puro en JS para entornos file:// donde window.crypto.subtle no está disponible
  function sha256FallbackAscii(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = 'length';
    let i, j;
    let result = '';
    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;
    let hash = [];
    const k = [];
    let primeCounter = 0;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }
    words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
    words[words[lengthProperty]] = asciiBitLength;
    for (j = 0; j < words[lengthProperty]; ) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash.slice(0);
      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const temp1 =
          hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) +
          k[i] +
          (w[i] =
            i < 16
              ? w[i]
              : (w[i - 16] +
                  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                  w[i - 7] +
                  (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
                0);
        const temp2 =
          (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
        hash.pop();
      }
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? 0 : '') + b.toString(16);
      }
    }
    return result;
  }

  async function sha256Hex(value) {
    const str = String(value || '');
    try {
      if (window.crypto && window.crypto.subtle && window.TextEncoder) {
        const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }
    } catch (e) {}
    return sha256FallbackAscii(unescape(encodeURIComponent(str)));
  }

  const DEFAULT_HERO = 'assets/images/portada.jpg';
  const BASE_INITIAL_TIMESTAMP = 1700000000099;

  let useLocalStorageFallback = false;

  // Apertura de base de datos local (IndexedDB)
  function openDB() {
    return new Promise((resolve, reject) => {
      if (useLocalStorageFallback || !window.indexedDB) {
        return reject(new Error('Usando fallback'));
      }

      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('portfolio')) {
            db.createObjectStore('portfolio', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('sessions')) {
            db.createObjectStore('sessions', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
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
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  async function initStorage() {
    try {
      const db = await openDB();

      const existingPhotos = await new Promise((res) => {
        const tx = db.transaction('portfolio', 'readonly');
        const st = tx.objectStore('portfolio');
        const r = st.getAll();
        r.onsuccess = () => res(r.result || []);
        r.onerror = () => res([]);
      });

      const hasOldPlaceholders = existingPhotos.some((p) => p.thumbUrl && p.thumbUrl.includes('unsplash.com'));

      if (existingPhotos.length === 0 || hasOldPlaceholders) {
        const tx = db.transaction(['portfolio', 'sessions', 'settings'], 'readwrite');
        const pStore = tx.objectStore('portfolio');
        const sStore = tx.objectStore('sessions');
        const setStore = tx.objectStore('settings');

        if (hasOldPlaceholders) {
          pStore.clear();
          sStore.clear();
        }

        DEFAULT_PORTFOLIO.forEach((p) => pStore.put(p));
        DEFAULT_SESSIONS.forEach((s) => sStore.put(s));
        setStore.put({ key: 'admin_auth', value: DEFAULT_AUTH });
      }
    } catch (err) {
      useLocalStorageFallback = true;
      const lsPort = getLS('portfolio', null);
      const hasLsPlaceholders = Array.isArray(lsPort) && lsPort.some((p) => p.thumbUrl && p.thumbUrl.includes('unsplash.com'));

      if (!lsPort || hasLsPlaceholders) {
        setLS('portfolio', DEFAULT_PORTFOLIO);
      }
      const lsSessions = getLS('sessions', null);
      const hasLsSessionPlaceholders = Array.isArray(lsSessions) && lsSessions.some((s) => s.photos && s.photos.some((p) => p.thumbUrl && p.thumbUrl.includes('unsplash.com')));
      if (!lsSessions || hasLsSessionPlaceholders) {
        setLS('sessions', DEFAULT_SESSIONS);
      }
      if (!getLS('admin_auth', null)) {
        setLS('admin_auth', DEFAULT_AUTH);
      }
    }
  }

  // Credenciales de administrador
  async function getAdminCredentials() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('settings', 'readonly');
        const st = tx.objectStore('settings');
        const req = st.get('admin_auth');
        req.onsuccess = () => resolve(req.result ? req.result.value : DEFAULT_AUTH);
        req.onerror = () => resolve(DEFAULT_AUTH);
      });
    } catch (e) {
      return getLS('admin_auth', DEFAULT_AUTH);
    }
  }

  async function saveAdminCredentials(username, password) {
    const passwordHash = await sha256Hex(password);
    const creds = { username: username.trim(), passwordHash };
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('settings', 'readwrite');
        const st = tx.objectStore('settings');
        const req = st.put({ key: 'admin_auth', value: creds });
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      setLS('admin_auth', creds);
      return true;
    }
  }

  async function verifyAdminLogin(username, password) {
    let auth = await getAdminCredentials();
    if (!auth) auth = DEFAULT_AUTH;
    const expectedUser = (auth.username || DEFAULT_AUTH.username || 'admin').trim().toLowerCase();
    const uMatch = expectedUser === (username || '').trim().toLowerCase();
    const inputHash = await sha256Hex((password || '').trim());

    // 1. Verificar contra la credencial maestra actual (DEFAULT_AUTH) y actualizar caché local si tenía el hash inicial antiguo
    if (uMatch && inputHash && inputHash === DEFAULT_AUTH.passwordHash) {
      if (auth.passwordHash !== DEFAULT_AUTH.passwordHash) {
        await saveAdminCredentials(DEFAULT_AUTH.username, (password || '').trim());
      }
      return true;
    }

    // 2. Verificar contra credencial personalizada guardada en este navegador
    if (auth.passwordHash && inputHash) {
      return uMatch && auth.passwordHash === inputHash;
    }

    // 3. Migración transparente si existía credencial local antigua sin hash
    if (auth.password) {
      const legacyMatch = uMatch && String(auth.password) === String(password);
      if (legacyMatch && inputHash) {
        await saveAdminCredentials(auth.username || 'admin', password);
      }
      return legacyMatch;
    }
    return false;
  }

  // =======================================================
  // CONECTOR DIRECTO GITHUB CMS + CLOUDFLARE PAGES CDN
  // =======================================================
  const GITHUB_LS_KEY = 'andres_github_config';
  const SUPABASE_LS_KEY = 'andres_supabase_config';
  const SITE_DATA_REPO_PATH = 'assets/data/site-data.json';

  // Caché temporal de vistas previas (para que durante los ~20s que Cloudflare construye,
  // las imágenes recién subidas se vean al instante sin esperar al despliegue)
  const memoryPreviewMap = {};
  let cachedGitHubSiteData = null;
  let cachedGitHubSiteDataTime = 0;
  let publicSiteDataPromise = null;
  let publicSiteDataTime = 0;

  function saveInstantPreview(repoPath, dataUrl) {
    if (!repoPath || !dataUrl) return;
    memoryPreviewMap[repoPath] = { dataUrl, ts: Date.now() };
  }

  function resolvePreviewUrl(url) {
    if (!url || typeof url !== 'string') return url;
    const entry = memoryPreviewMap[url];
    if (entry && Date.now() - entry.ts < 180000) {
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

  function getGitHubConfig() {
    try {
      const cfg = JSON.parse(localStorage.getItem(GITHUB_LS_KEY) || 'null');
      if (cfg && cfg.token) {
        return {
          owner: (cfg.owner || 'andresreginensi').trim(),
          repo: (cfg.repo || 'andresreginensi').trim(),
          branch: (cfg.branch || 'main').trim(),
          token: cfg.token.trim()
        };
      }
    } catch (e) {}
    return null;
  }

  function setGitHubConfig(cfg) {
    const clean = {
      owner: (cfg.owner || 'andresreginensi').trim(),
      repo: (cfg.repo || 'andresreginensi').trim(),
      branch: (cfg.branch || 'main').trim(),
      token: (cfg.token || '').trim()
    };
    localStorage.setItem(GITHUB_LS_KEY, JSON.stringify(clean));
    cachedGitHubSiteData = null;
    return clean;
  }

  function clearGitHubConfig() {
    localStorage.removeItem(GITHUB_LS_KEY);
    cachedGitHubSiteData = null;
  }

  function isGitHubEnabled() {
    return Boolean(getGitHubConfig());
  }

  function getSupabaseConfig() {
    try {
      const localCfg = JSON.parse(localStorage.getItem(SUPABASE_LS_KEY) || 'null');
      if (localCfg && localCfg.url && localCfg.key) {
        return { url: localCfg.url.trim().replace(/\/$/, ''), key: localCfg.key.trim() };
      }
    } catch (e) {}
    return null;
  }

  function isCloudEnabled() {
    return isGitHubEnabled();
  }

  function decodeBase64Utf8(b64) {
    const clean = b64.replace(/\s/g, '');
    const binStr = window.atob(clean);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(bytes);
    }
    return decodeURIComponent(escape(binStr));
  }

  async function githubApi(cfg, endpointPath, options = {}) {
    const url = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}${endpointPath}`;
    const headers = Object.assign({
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${cfg.token}`
    }, options.headers || {});

    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, Object.assign({}, options, {
      headers,
      cache: 'no-store'
    }));

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson.message || `HTTP ${res.status}`;
      const err = new Error(`GitHub (${res.status}): ${msg}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  async function verifyGitHubToken(customCfg) {
    const cfg = customCfg || getGitHubConfig();
    if (!cfg || !cfg.token) {
      throw new Error('Introduce un Personal Access Token de GitHub.');
    }
    const repoInfo = await githubApi(cfg, '');
    if (repoInfo.permissions && repoInfo.permissions.push === false) {
      throw new Error('El token tiene acceso de solo lectura. Marca el permiso "repo" (o "Contents: Read and write") al generarlo en GitHub.');
    }
    return {
      ok: true,
      fullName: repoInfo.full_name,
      isPrivate: Boolean(repoInfo.private),
      defaultBranch: repoInfo.default_branch || 'main'
    };
  }

  // Convierte una imagen data:image/... en un archivo real dentro del repositorio (assets/images/uploads/...)
  function prepareImageForGitHubCommit(urlOrData, folderPrefix, filesToUpload) {
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

    filesToUpload.push({
      path: repoPath,
      base64: base64Data
    });

    saveInstantPreview(repoPath, urlOrData);
    return repoPath;
  }

  // Lee site-data.json en tiempo real desde la API de GitHub (usado en el Admin autenticado)
  async function fetchGitHubSiteData(customCfg, bypassCache = false) {
    const cfg = customCfg || getGitHubConfig();
    if (!cfg || !cfg.token) return null;

    if (!bypassCache && cachedGitHubSiteData && Date.now() - cachedGitHubSiteDataTime < 4000) {
      return JSON.parse(JSON.stringify(cachedGitHubSiteData));
    }

    try {
      const fileObj = await githubApi(
        cfg,
        `/contents/${SITE_DATA_REPO_PATH}?ref=${encodeURIComponent(cfg.branch)}`
      );
      if (fileObj && fileObj.content) {
        const jsonStr = decodeBase64Utf8(fileObj.content);
        const parsed = JSON.parse(jsonStr);
        cachedGitHubSiteData = parsed;
        cachedGitHubSiteDataTime = Date.now();
        return JSON.parse(JSON.stringify(parsed));
      }
    } catch (err) {
      if (err.status === 404) {
        return {
          version: 1,
          updatedAt: 0,
          heroImage: DEFAULT_HERO,
          portfolio: [...DEFAULT_PORTFOLIO],
          sessions: [...DEFAULT_SESSIONS]
        };
      }
      throw err;
    }
    return null;
  }

  // Lee assets/data/site-data.json directamente del sitio público desplegado en Cloudflare Pages
  // Funciona en TODOS los móviles y ordenadores del mundo sin necesidad de tokens ni cuentas externas
  async function fetchPublicDeployedSiteData() {
    if (publicSiteDataPromise && Date.now() - publicSiteDataTime < 2500) {
      return publicSiteDataPromise;
    }
    publicSiteDataTime = Date.now();
    publicSiteDataPromise = fetch(`${SITE_DATA_REPO_PATH}?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
    return publicSiteDataPromise;
  }

  // Crea 1 único commit atómico en GitHub con las imágenes nuevas + site-data.json actualizado
  async function commitToGitHub(filesToUpload, newSiteData, commitMessage, customCfg) {
    const cfg = customCfg || getGitHubConfig();
    if (!cfg || !cfg.token) {
      throw new Error('GitHub no está conectado en este navegador.');
    }

    newSiteData.version = 1;
    newSiteData.updatedAt = Date.now();

    // Garantizar que ningún PIN de galería se publique en texto plano en site-data.json
    if (Array.isArray(newSiteData.sessions)) {
      for (let i = 0; i < newSiteData.sessions.length; i++) {
        const s = Object.assign({}, newSiteData.sessions[i]);
        if (s.pin) {
          const computedHash = await sha256Hex(s.pin);
          if (computedHash) {
            s.pinHash = computedHash;
            delete s.pin;
          }
        }
        newSiteData.sessions[i] = s;
      }
    }

    // 1. Obtener SHA del último commit en la rama (main)
    const refData = await githubApi(cfg, `/git/ref/heads/${encodeURIComponent(cfg.branch)}`);
    const latestCommitSha = refData.object.sha;

    // 2. Obtener SHA del árbol base
    const commitData = await githubApi(cfg, `/git/commits/${latestCommitSha}`);
    const baseTreeSha = commitData.tree.sha;

    // 3. Crear blobs para cada imagen subida + el archivo JSON maestro
    const treeEntries = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const f = filesToUpload[i];
      const blobRes = await githubApi(cfg, '/git/blobs', {
        method: 'POST',
        body: JSON.stringify({
          content: f.base64,
          encoding: 'base64'
        })
      });
      treeEntries.push({
        path: f.path,
        mode: '100644',
        type: 'blob',
        sha: blobRes.sha
      });
    }

    const jsonBlobRes = await githubApi(cfg, '/git/blobs', {
      method: 'POST',
      body: JSON.stringify({
        content: JSON.stringify(newSiteData, null, 2),
        encoding: 'utf-8'
      })
    });

    treeEntries.push({
      path: SITE_DATA_REPO_PATH,
      mode: '100644',
      type: 'blob',
      sha: jsonBlobRes.sha
    });

    // 4. Crear el nuevo árbol Git
    const newTree = await githubApi(cfg, '/git/trees', {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeEntries
      })
    });

    // 5. Crear el commit
    const newCommit = await githubApi(cfg, '/git/commits', {
      method: 'POST',
      body: JSON.stringify({
        message: commitMessage || '📸 Admin: Actualizar portafolio web',
        tree: newTree.sha,
        parents: [latestCommitSha]
      })
    });

    // 6. Actualizar la rama (main) para disparar el despliegue automático en Cloudflare Pages
    await githubApi(cfg, `/git/refs/heads/${encodeURIComponent(cfg.branch)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: newCommit.sha,
        force: false
      })
    });

    cachedGitHubSiteData = JSON.parse(JSON.stringify(newSiteData));
    cachedGitHubSiteDataTime = Date.now();
    setLS('last_cloud_sync_ts', newSiteData.updatedAt);

    return { commitSha: newCommit.sha, updatedAt: newSiteData.updatedAt };
  }

  // Sincroniza todas las fotos locales de este Mac (incluidos cambios ya hechos en el Admin) hacia GitHub
  async function syncLocalDataToGitHub(customCfg) {
    const cfg = customCfg || getGitHubConfig();
    if (!cfg || !cfg.token) {
      throw new Error('Configura primero tu token de GitHub.');
    }

    const filesToUpload = [];
    const localPhotos = await getLocalPortfolioPhotos();
    const cleanPhotos = localPhotos.map((p) => {
      const copy = Object.assign({}, p);
      const safeSlug = slugify(copy.title || copy.id || 'foto');
      copy.fullUrl = prepareImageForGitHubCommit(copy.fullUrl, `${copy.category || 'port'}-${safeSlug}-full`, filesToUpload);
      copy.thumbUrl = prepareImageForGitHubCommit(copy.thumbUrl || copy.fullUrl, `${copy.category || 'port'}-${safeSlug}-thumb`, filesToUpload);
      return copy;
    });

    let localHero = await getLocalHeroImage();
    if (localHero && localHero.startsWith('data:')) {
      localHero = prepareImageForGitHubCommit(localHero, 'hero-portada', filesToUpload);
    }

    const localSessions = await getLocalClientSessions();
    const cleanSessions = localSessions.map((s) => {
      const sCopy = Object.assign({}, s);
      if (Array.isArray(sCopy.photos)) {
        sCopy.photos = sCopy.photos.map((ph, idx) => {
          const pCopy = Object.assign({}, ph);
          pCopy.fullUrl = prepareImageForGitHubCommit(pCopy.fullUrl, `sesion-${sCopy.id}-${idx + 1}-full`, filesToUpload);
          pCopy.thumbUrl = prepareImageForGitHubCommit(pCopy.thumbUrl || pCopy.fullUrl, `sesion-${sCopy.id}-${idx + 1}-thumb`, filesToUpload);
          return pCopy;
        });
      }
      return sCopy;
    });

    const newSiteData = {
      version: 1,
      updatedAt: Date.now(),
      heroImage: localHero || DEFAULT_HERO,
      portfolio: cleanPhotos,
      sessions: cleanSessions
    };

    const res = await commitToGitHub(
      filesToUpload,
      newSiteData,
      '📸 Admin: Sincronización completa de portafolio y portada',
      cfg
    );

    // Actualizar también copia local con las nuevas rutas limpias
    await saveLocalHeroImage(newSiteData.heroImage);
    await replaceAllLocalPortfolioPhotos(cleanPhotos);

    return {
      syncedPhotos: cleanPhotos.length,
      uploadedFiles: filesToUpload.length,
      commitSha: res.commitSha
    };
  }

  // =======================================================
  // OPERACIONES DE PORTADA, PORTAFOLIO Y SESIONES
  // =======================================================
  async function getLocalHeroImage() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('settings', 'readonly');
        const st = tx.objectStore('settings');
        const req = st.get('hero_image');
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
        const tx = db.transaction('settings', 'readwrite');
        const st = tx.objectStore('settings');
        const req = st.put({ key: 'hero_image', value: url });
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      setLS('hero_image', url);
      return true;
    }
  }

  async function getHeroImage() {
    // 1. Si GitHub está conectado en este navegador, leer estado en tiempo real
    if (isGitHubEnabled()) {
      try {
        const ghData = await fetchGitHubSiteData();
        if (ghData && ghData.heroImage) {
          return resolvePreviewUrl(ghData.heroImage);
        }
      } catch (e) {
        console.warn('Fallback Hero local:', e);
      }
    }

    // 2. Para cualquier visitante en móvil u ordenador, leer site-data.json desplegado en Cloudflare Pages
    const pubData = await fetchPublicDeployedSiteData();
    if (pubData && pubData.updatedAt > BASE_INITIAL_TIMESTAMP && pubData.heroImage) {
      return resolvePreviewUrl(pubData.heroImage);
    }

    // 3. Respaldo local (IndexedDB)
    return getLocalHeroImage();
  }

  async function saveHeroImage(url) {
    let finalUrl = url;
    if (isGitHubEnabled()) {
      const ghData = (await fetchGitHubSiteData(null, true)) || {
        version: 1,
        heroImage: DEFAULT_HERO,
        portfolio: await getLocalPortfolioPhotos(),
        sessions: await getLocalClientSessions()
      };
      const filesToUpload = [];
      finalUrl = prepareImageForGitHubCommit(url, 'hero-portada', filesToUpload);
      ghData.heroImage = finalUrl;
      await commitToGitHub(filesToUpload, ghData, '📸 Admin: Actualizar fotografía de portada (Hero)');
    }

    await saveLocalHeroImage(finalUrl);
    return resolvePreviewUrl(finalUrl);
  }

  async function getLocalPortfolioPhotos() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('portfolio', 'readonly');
        const st = tx.objectStore('portfolio');
        const req = st.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
    // 1. Si GitHub está conectado en este navegador, consultar estado real de GitHub
    if (isGitHubEnabled()) {
      try {
        const ghData = await fetchGitHubSiteData();
        if (ghData && Array.isArray(ghData.portfolio) && ghData.portfolio.length > 0) {
          const sorted = [...ghData.portfolio].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          return sorted.map(applyPreviewUrlsToPhoto);
        }
      } catch (err) {
        console.warn('Error leyendo portafolio desde GitHub API, usando respaldo:', err);
      }
    }

    // 2. Para todos los visitantes (móviles, tablets, clientes), leer assets/data/site-data.json de Cloudflare Pages
    const pubData = await fetchPublicDeployedSiteData();
    if (pubData && pubData.updatedAt > BASE_INITIAL_TIMESTAMP && Array.isArray(pubData.portfolio) && pubData.portfolio.length > 0) {
      const sorted = [...pubData.portfolio].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return sorted.map(applyPreviewUrlsToPhoto);
    }

    // 3. Respaldo local (IndexedDB)
    return getLocalPortfolioPhotos();
  }

  async function savePortfolioPhoto(photo) {
    const currentList = await getAllPortfolioPhotos().catch(() => []);
    const existingItem = photo.id ? currentList.find((p) => p.id === photo.id) : null;

    if (!photo.id) {
      photo.id = 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }
    if (!photo.createdAt) {
      photo.createdAt = existingItem && existingItem.createdAt ? existingItem.createdAt : Date.now();
    }

    if (isGitHubEnabled()) {
      const ghData = (await fetchGitHubSiteData(null, true)) || {
        version: 1,
        heroImage: await getLocalHeroImage(),
        portfolio: await getLocalPortfolioPhotos(),
        sessions: await getLocalClientSessions()
      };

      // Si el JSON remoto aún era la plantilla inicial sin sincronizar cambios locales, partimos de la lista actual
      if (!Array.isArray(ghData.portfolio) || ghData.portfolio.length === 0) {
        ghData.portfolio = await getLocalPortfolioPhotos();
      }

      const filesToUpload = [];
      const safeSlug = slugify(photo.title || photo.category || 'foto');
      photo.fullUrl = prepareImageForGitHubCommit(photo.fullUrl, `${photo.category || 'port'}-${safeSlug}-full`, filesToUpload);
      photo.thumbUrl = prepareImageForGitHubCommit(photo.thumbUrl || photo.fullUrl, `${photo.category || 'port'}-${safeSlug}-thumb`, filesToUpload);

      const idx = ghData.portfolio.findIndex((p) => p.id === photo.id);
      if (idx >= 0) {
        ghData.portfolio[idx] = Object.assign({}, photo);
      } else {
        ghData.portfolio.unshift(Object.assign({}, photo));
      }

      const actionLabel = existingItem ? `Editar foto "${photo.title}"` : `Publicar foto "${photo.title}"`;
      await commitToGitHub(filesToUpload, ghData, `📸 Admin: ${actionLabel}`);
    }

    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction('portfolio', 'readwrite');
        const st = tx.objectStore('portfolio');
        const req = st.put(photo);
        req.onsuccess = () => resolve(photo);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      const list = getLS('portfolio', [...DEFAULT_PORTFOLIO]);
      const idx = list.findIndex((p) => p.id === photo.id);
      if (idx >= 0) list[idx] = photo;
      else list.unshift(photo);
      setLS('portfolio', list);
    }

    return applyPreviewUrlsToPhoto(photo);
  }

  async function deletePortfolioPhoto(id) {
    if (isGitHubEnabled()) {
      const ghData = await fetchGitHubSiteData(null, true);
      if (ghData && Array.isArray(ghData.portfolio)) {
        const target = ghData.portfolio.find((p) => p.id === id);
        ghData.portfolio = ghData.portfolio.filter((p) => p.id !== id);
        await commitToGitHub([], ghData, `🗑️ Admin: Eliminar foto "${target ? target.title : id}"`);
      }
    }

    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction('portfolio', 'readwrite');
        const st = tx.objectStore('portfolio');
        const req = st.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      let list = getLS('portfolio', [...DEFAULT_PORTFOLIO]);
      list = list.filter((p) => p.id !== id);
      setLS('portfolio', list);
    }
    return true;
  }

  // Sesiones de Clientes (Proofing Local + GitHub)
  async function getLocalClientSessions() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('sessions', 'readonly');
        const st = tx.objectStore('sessions');
        const req = st.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          resolve(list.length > 0 ? list : DEFAULT_SESSIONS);
        };
        req.onerror = () => resolve(getLS('sessions', DEFAULT_SESSIONS));
      });
    } catch (e) {
      return getLS('sessions', DEFAULT_SESSIONS);
    }
  }

  async function getAllClientSessions() {
    if (isGitHubEnabled()) {
      try {
        const ghData = await fetchGitHubSiteData();
        if (ghData && Array.isArray(ghData.sessions) && ghData.sessions.length > 0) {
          return [...ghData.sessions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
      } catch (err) {}
    }

    const pubData = await fetchPublicDeployedSiteData();
    if (pubData && pubData.updatedAt > BASE_INITIAL_TIMESTAMP && Array.isArray(pubData.sessions) && pubData.sessions.length > 0) {
      return [...pubData.sessions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return getLocalClientSessions();
  }

  async function getClientSessionById(id) {
    const all = await getAllClientSessions();
    return all.find((s) => s.id === id) || null;
  }

  async function saveClientSession(session) {
    if (!session.id) {
      session.id = slugify(session.title || 'sesion-' + Date.now());
    }
    if (!session.createdAt) {
      session.createdAt = Date.now();
    }

    if (isGitHubEnabled()) {
      const ghData = (await fetchGitHubSiteData(null, true)) || {
        version: 1,
        heroImage: await getLocalHeroImage(),
        portfolio: await getLocalPortfolioPhotos(),
        sessions: await getLocalClientSessions()
      };
      if (!Array.isArray(ghData.sessions)) ghData.sessions = [];

      const filesToUpload = [];
      if (Array.isArray(session.photos)) {
        session.photos = session.photos.map((ph, idx) => {
          const pCopy = Object.assign({}, ph);
          pCopy.fullUrl = prepareImageForGitHubCommit(pCopy.fullUrl, `sesion-${session.id}-${idx + 1}-full`, filesToUpload);
          pCopy.thumbUrl = prepareImageForGitHubCommit(pCopy.thumbUrl || pCopy.fullUrl, `sesion-${session.id}-${idx + 1}-thumb`, filesToUpload);
          return pCopy;
        });
      }

      const idx = ghData.sessions.findIndex((s) => s.id === session.id);
      if (idx >= 0) ghData.sessions[idx] = Object.assign({}, session);
      else ghData.sessions.unshift(Object.assign({}, session));

      await commitToGitHub(filesToUpload, ghData, `🔒 Admin: Guardar galería privada "${session.title}"`);
    }

    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('sessions', 'readwrite');
        const st = tx.objectStore('sessions');
        const req = st.put(session);
        req.onsuccess = () => resolve(session);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      const list = getLS('sessions', [...DEFAULT_SESSIONS]);
      const idx = list.findIndex((s) => s.id === session.id);
      if (idx >= 0) list[idx] = session;
      else list.unshift(session);
      setLS('sessions', list);
      return session;
    }
  }

  async function deleteClientSession(id) {
    if (isGitHubEnabled()) {
      const ghData = await fetchGitHubSiteData(null, true);
      if (ghData && Array.isArray(ghData.sessions)) {
        ghData.sessions = ghData.sessions.filter((s) => s.id !== id);
        await commitToGitHub([], ghData, `🗑️ Admin: Eliminar galería privada "${id}"`);
      }
    }

    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('sessions', 'readwrite');
        const st = tx.objectStore('sessions');
        const req = st.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      let list = getLS('sessions', [...DEFAULT_SESSIONS]);
      list = list.filter((s) => s.id !== id);
      setLS('sessions', list);
      return true;
    }
  }

  async function resetToDefaultData() {
    if (isGitHubEnabled()) {
      const resetSiteData = {
        version: 1,
        updatedAt: Date.now(),
        heroImage: DEFAULT_HERO,
        portfolio: [...DEFAULT_PORTFOLIO],
        sessions: [...DEFAULT_SESSIONS]
      };
      await commitToGitHub([], resetSiteData, '🔄 Admin: Restablecer portafolio a valores iniciales');
    }

    try {
      const db = await openDB();
      const tx = db.transaction(['portfolio', 'sessions', 'settings'], 'readwrite');
      tx.objectStore('portfolio').clear();
      tx.objectStore('sessions').clear();
      tx.objectStore('settings').delete('hero_image');
      DEFAULT_PORTFOLIO.forEach((p) => tx.objectStore('portfolio').put(p));
      DEFAULT_SESSIONS.forEach((s) => tx.objectStore('sessions').put(s));
    } catch (e) {}

    setLS('portfolio', DEFAULT_PORTFOLIO);
    setLS('sessions', DEFAULT_SESSIONS);
    setLS('hero_image', DEFAULT_HERO);
    return true;
  }

  // Procesador y compresor de fotos optimizado en WebP (con fallback automático a JPEG)
  function processImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        return reject(new Error('El archivo no es una imagen.'));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const fullUrl = resizeImage(img, 2048, 0.85);
            const thumbUrl = resizeImage(img, 750, 0.82);
            resolve({ fullUrl, thumbUrl, originalName: file.name });
          } catch (err) {
            resolve({ fullUrl: e.target.result, thumbUrl: e.target.result, originalName: file.name });
          }
        };
        img.onerror = () => reject(new Error('No se pudo abrir la imagen.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Error de lectura.'));
      reader.readAsDataURL(file);
    });
  }

  function resizeImage(img, maxDim, quality) {
    let { width, height } = img;
    if (width > height) {
      if (width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      }
    } else {
      if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
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
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  }

  window.AndresDB = {
    DEFAULT_PORTFOLIO,
    DEFAULT_SESSIONS,
    initStorage,
    getGitHubConfig,
    setGitHubConfig,
    clearGitHubConfig,
    isGitHubEnabled,
    isCloudEnabled,
    verifyGitHubToken,
    syncLocalDataToGitHub,
    syncLocalDataToSupabase: syncLocalDataToGitHub,
    getSupabaseConfig,
    getAdminCredentials,
    saveAdminCredentials,
    verifyAdminLogin,
    getAllPortfolioPhotos,
    savePortfolioPhoto,
    deletePortfolioPhoto,
    getAllClientSessions,
    getClientSessionById,
    saveClientSession,
    deleteClientSession,
    resetToDefaultData,
    processImageFile,
    getHeroImage,
    saveHeroImage
  };

})(window);
