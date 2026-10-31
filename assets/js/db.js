/**
 * Andrés Reginensi Photography — Gestor de Base de Datos Local
 * Compatible al 100% tanto abriendo el archivo directamente con doble clic (file://)
 * como alojado en un servidor web (http:// / https://).
 * Utiliza IndexedDB con fallback automático a localStorage.
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
      caption: 'Celebración & Alegría — Salida de Ceremonia en Confeti',
      aspect: 'landscape',
      thumbUrl: 'assets/images/bodas/boda-salida-arroz-thumb.jpg',
      fullUrl: 'assets/images/bodas/boda-salida-arroz.jpg',
      createdAt: 1700000000004
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
      id: 'port-boda-3',
      category: 'bodas',
      categoryLabel: 'Bodas & Eventos',
      title: 'Orilla Dorada',
      tag: 'Atardecer & Pareja',
      caption: 'Orilla del Mar — Atardecer Mediterráneo',
      aspect: 'landscape',
      thumbUrl: 'assets/images/bodas/boda-playa-orilla-thumb.jpg',
      fullUrl: 'assets/images/bodas/boda-playa-orilla.jpg',
      createdAt: 1700000000006
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

  // Sesiones de clientes iniciales con fotos auténticas
  const DEFAULT_SESSIONS = [
    {
      id: 'boda-laura-carlos',
      pin: '2026',
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
      pin: '1234',
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
    password: 'admin2026'
  };

  let useLocalStorageFallback = false;

  // Apertura de base de datos
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

  // Fallback helpers para localStorage
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

  // Inicialización con migración automática de imágenes antiguas (Unsplash -> Fotos de Andrés)
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

      // Si no hay fotos o contienen URLs antiguas de Unsplash, actualizamos al portafolio de Andrés
      const hasOldPlaceholders = existingPhotos.some(p => p.thumbUrl && p.thumbUrl.includes('unsplash.com'));

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
      const hasLsPlaceholders = Array.isArray(lsPort) && lsPort.some(p => p.thumbUrl && p.thumbUrl.includes('unsplash.com'));

      if (!lsPort || hasLsPlaceholders) {
        setLS('portfolio', DEFAULT_PORTFOLIO);
      }
      const lsSessions = getLS('sessions', null);
      const hasLsSessionPlaceholders = Array.isArray(lsSessions) && lsSessions.some(s => s.photos && s.photos.some(p => p.thumbUrl && p.thumbUrl.includes('unsplash.com')));
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
    const creds = { username: username.trim(), password };
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
    const uMatch = (auth.username || 'admin').trim().toLowerCase() === (username || '').trim().toLowerCase();
    const pMatch = String(auth.password) === String(password);
    return uMatch && pMatch;
  }

  // =======================================================
  // CONECTOR NUBE SUPABASE (REST + STORAGE CDN)
  // =======================================================
  const SUPABASE_LS_KEY = 'andres_supabase_config';

  function getSupabaseConfig() {
    try {
      const localCfg = JSON.parse(localStorage.getItem(SUPABASE_LS_KEY) || 'null');
      if (localCfg && localCfg.url && localCfg.key) {
        return { url: localCfg.url.trim().replace(/\/$/, ''), key: localCfg.key.trim() };
      }
    } catch (e) {}

    if (window.SUPABASE_PUBLIC_CONFIG && window.SUPABASE_PUBLIC_CONFIG.url && window.SUPABASE_PUBLIC_CONFIG.key) {
      return {
        url: window.SUPABASE_PUBLIC_CONFIG.url.trim().replace(/\/$/, ''),
        key: window.SUPABASE_PUBLIC_CONFIG.key.trim()
      };
    }
    return null;
  }

  function isCloudEnabled() {
    const cfg = getSupabaseConfig();
    return Boolean(cfg && cfg.url && cfg.key);
  }

  function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const ext = contentType.includes('webp') ? 'webp' : contentType.includes('png') ? 'png' : 'jpg';
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; i++) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return {
      blob: new Blob([uInt8Array], { type: contentType }),
      ext,
      contentType
    };
  }

  // Sube una imagen base64 al CDN público de Supabase Storage ("portfolio")
  // Si el bucket no existe aún, hace fallback transparente al dataUrl comprimido
  async function uploadImageToCloudStorage(urlOrData, folderPrefix, customCfg) {
    if (!urlOrData || typeof urlOrData !== 'string' || !urlOrData.startsWith('data:')) {
      return urlOrData;
    }
    const cfg = customCfg || getSupabaseConfig();
    if (!cfg || !cfg.url || !cfg.key) return urlOrData;

    try {
      const { blob, ext, contentType } = dataUrlToBlob(urlOrData);
      const rand = Math.random().toString(36).substring(2, 7);
      const safePrefix = (folderPrefix || 'img').replace(/[^a-zA-Z0-9/_-]/g, '-');
      const filePath = `${safePrefix}-${Date.now()}-${rand}.${ext}`;
      const uploadEndpoint = `${cfg.url}/storage/v1/object/portfolio/${filePath}`;

      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'apikey': cfg.key,
          'Authorization': `Bearer ${cfg.key}`,
          'Content-Type': contentType,
          'x-upsert': 'true'
        },
        body: blob
      });

      if (res.ok) {
        return `${cfg.url}/storage/v1/object/public/portfolio/${filePath}`;
      }
      console.warn('Supabase Storage fallback a tabla directa (código ' + res.status + ')');
      return urlOrData;
    } catch (err) {
      console.warn('No se pudo subir a Supabase Storage, usando respaldo directo:', err);
      return urlOrData;
    }
  }

  function mapDbRowToPhoto(row) {
    return {
      id: row.id,
      category: row.category,
      categoryLabel: row.category_label || '',
      title: row.title,
      tag: row.tag || '',
      caption: row.caption || `${row.title} — ${row.tag || ''}`,
      aspect: row.aspect || 'landscape',
      thumbUrl: row.thumb_url || row.full_url,
      fullUrl: row.full_url,
      createdAt: Number(row.created_at) || Date.now()
    };
  }

  function mapPhotoToDbRow(photo) {
    return {
      id: photo.id,
      category: photo.category,
      category_label: photo.categoryLabel || '',
      title: photo.title,
      tag: photo.tag || '',
      caption: photo.caption || `${photo.title} — ${photo.tag || ''}`,
      aspect: photo.aspect || 'landscape',
      thumb_url: photo.thumbUrl || photo.fullUrl,
      full_url: photo.fullUrl,
      created_at: Number(photo.createdAt) || Date.now()
    };
  }

  function mapDbRowToSession(row) {
    return {
      id: row.id,
      pin: row.pin,
      title: row.title,
      clientName: row.client_name || '',
      date: row.session_date || '',
      location: row.location || '',
      maxSelectable: Number(row.max_selectable) || 40,
      photos: Array.isArray(row.photos) ? row.photos : [],
      createdAt: Number(row.created_at) || Date.now()
    };
  }

  function mapSessionToDbRow(session) {
    return {
      id: session.id,
      pin: String(session.pin || ''),
      title: session.title,
      client_name: session.clientName || '',
      session_date: session.date || '',
      location: session.location || '',
      max_selectable: Number(session.maxSelectable) || 40,
      photos: Array.isArray(session.photos) ? session.photos : [],
      created_at: Number(session.createdAt) || Date.now()
    };
  }

  // Gestión de Foto de Portada (Hero)
  const DEFAULT_HERO = 'assets/images/portada.jpg';

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
    const cfg = getSupabaseConfig();
    if (cfg && cfg.url && cfg.key) {
      try {
        const res = await fetch(`${cfg.url}/rest/v1/site_settings?key=eq.hero_image&select=value&limit=1`, {
          headers: {
            'apikey': cfg.key,
            'Authorization': `Bearer ${cfg.key}`
          }
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0 && rows[0].value) {
            const val = rows[0].value;
            const cloudUrl = typeof val === 'string' ? val : val.url;
            if (cloudUrl) return cloudUrl;
          }
        }
      } catch (err) {
        console.warn('Fallback local para Hero image:', err);
      }
    }
    return getLocalHeroImage();
  }

  async function saveHeroImage(url) {
    let finalUrl = url;
    const cfg = getSupabaseConfig();
    if (cfg && cfg.url && cfg.key) {
      finalUrl = await uploadImageToCloudStorage(url, 'hero/portada', cfg);
      const res = await fetch(`${cfg.url}/rest/v1/site_settings?on_conflict=key`, {
        method: 'POST',
        headers: {
          'apikey': cfg.key,
          'Authorization': `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
          key: 'hero_image',
          value: { url: finalUrl },
          updated_at: new Date().toISOString()
        })
      });
      if (!res.ok) {
        const errTxt = await res.text().catch(() => '');
        throw new Error(`Error al guardar portada en Supabase (${res.status}): ${errTxt}`);
      }
    }
    await saveLocalHeroImage(finalUrl);
    return finalUrl;
  }

  // Portafolio Local + Nube
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

  async function saveLocalPortfolioPhoto(photo) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
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
      return photo;
    }
  }

  // Garantiza que la tabla portfolio_photos de Supabase tenga las fotos base antes de editar/borrar 1 sola
  async function ensureCloudPortfolioSeeded(cfg) {
    if (!cfg || !cfg.url || !cfg.key) return;
    try {
      const checkRes = await fetch(`${cfg.url}/rest/v1/portfolio_photos?select=id&limit=1`, {
        headers: {
          'apikey': cfg.key,
          'Authorization': `Bearer ${cfg.key}`
        }
      });
      if (checkRes.ok) {
        const existing = await checkRes.json();
        if (Array.isArray(existing) && existing.length === 0) {
          await syncLocalDataToSupabase(cfg);
        }
      }
    } catch (e) {
      console.warn('No se pudo verificar estado inicial de portfolio_photos:', e);
    }
  }

  async function getAllPortfolioPhotos() {
    const cfg = getSupabaseConfig();
    if (cfg && cfg.url && cfg.key) {
      try {
        const res = await fetch(`${cfg.url}/rest/v1/portfolio_photos?select=*&order=created_at.desc`, {
          headers: {
            'apikey': cfg.key,
            'Authorization': `Bearer ${cfg.key}`
          }
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map(mapDbRowToPhoto);
          }
        }
      } catch (err) {
        console.warn('Fallback local para portafolio:', err);
      }
    }
    return getLocalPortfolioPhotos();
  }

  async function savePortfolioPhoto(photo) {
    const existingList = await getAllPortfolioPhotos().catch(() => []);
    const existingItem = photo.id ? existingList.find((p) => p.id === photo.id) : null;

    if (!photo.id) {
      photo.id = 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }
    if (!photo.createdAt) {
      photo.createdAt = existingItem && existingItem.createdAt ? existingItem.createdAt : Date.now();
    }

    const cfg = getSupabaseConfig();
    if (cfg && cfg.url && cfg.key) {
      await ensureCloudPortfolioSeeded(cfg);

      const safeTitleSlug = slugify(photo.title || photo.category || 'foto');
      photo.fullUrl = await uploadImageToCloudStorage(photo.fullUrl, `${photo.category || 'general'}/${safeTitleSlug}-full`, cfg);
      photo.thumbUrl = await uploadImageToCloudStorage(photo.thumbUrl || photo.fullUrl, `${photo.category || 'general'}/${safeTitleSlug}-thumb`, cfg);

      const dbRow = mapPhotoToDbRow(photo);
      const res = await fetch(`${cfg.url}/rest/v1/portfolio_photos?on_conflict=id`, {
        method: 'POST',
        headers: {
          'apikey': cfg.key,
          'Authorization': `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(dbRow)
      });

      if (!res.ok) {
        const errTxt = await res.text().catch(() => '');
        throw new Error(`Error al guardar foto en Supabase (${res.status}): ${errTxt}`);
      }
    }

    await saveLocalPortfolioPhoto(photo);
    return photo;
  }

  async function deletePortfolioPhoto(id) {
    const cfg = getSupabaseConfig();
    if (cfg && cfg.url && cfg.key) {
      await ensureCloudPortfolioSeeded(cfg);
      const res = await fetch(`${cfg.url}/rest/v1/portfolio_photos?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'apikey': cfg.key,
          'Authorization': `Bearer ${cfg.key}`
        }
      });
      if (!res.ok) {
        const errTxt = await res.text().catch(() => '');
        throw new Error(`Error al eliminar foto en Supabase (${res.status}): ${errTxt}`);
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

  // Sesiones de Clientes (Proofing Local + Nube)
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
    const cfg = getSupabaseConfig();
    if (cfg && cfg.url && cfg.key) {
      try {
        const res = await fetch(`${cfg.url}/rest/v1/client_sessions?select=*&order=created_at.desc`, {
          headers: {
            'apikey': cfg.key,
            'Authorization': `Bearer ${cfg.key}`
          }
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map(mapDbRowToSession);
          }
        }
      } catch (err) {
        console.warn('Fallback local para sesiones de clientes:', err);
      }
    }
    return getLocalClientSessions();
  }

  async function getClientSessionById(id) {
    const cfg = getSupabaseConfig();
    if (cfg && cfg.url && cfg.key) {
      try {
        const res = await fetch(`${cfg.url}/rest/v1/client_sessions?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
          headers: {
            'apikey': cfg.key,
            'Authorization': `Bearer ${cfg.key}`
          }
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return mapDbRowToSession(rows[0]);
          }
        }
      } catch (err) {}
    }

    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('sessions', 'readonly');
        const st = tx.objectStore('sessions');
        const req = st.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      const list = getLS('sessions', DEFAULT_SESSIONS);
      return list.find((s) => s.id === id) || null;
    }
  }

  async function saveClientSession(session) {
    if (!session.id) {
      session.id = slugify(session.title || 'sesion-' + Date.now());
    }
    if (!session.createdAt) {
      session.createdAt = Date.now();
    }

    const cfg = getSupabaseConfig();
    if (cfg && cfg.url && cfg.key) {
      if (Array.isArray(session.photos)) {
        const uploadedPhotos = [];
        for (let i = 0; i < session.photos.length; i++) {
          const p = { ...session.photos[i] };
          p.fullUrl = await uploadImageToCloudStorage(p.fullUrl, `sessions/${session.id}/foto-${i + 1}-full`, cfg);
          p.thumbUrl = await uploadImageToCloudStorage(p.thumbUrl || p.fullUrl, `sessions/${session.id}/foto-${i + 1}-thumb`, cfg);
          uploadedPhotos.push(p);
        }
        session.photos = uploadedPhotos;
      }

      const dbRow = mapSessionToDbRow(session);
      const res = await fetch(`${cfg.url}/rest/v1/client_sessions?on_conflict=id`, {
        method: 'POST',
        headers: {
          'apikey': cfg.key,
          'Authorization': `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(dbRow)
      });

      if (!res.ok) {
        const errTxt = await res.text().catch(() => '');
        console.warn(`Aviso al guardar sesión en Supabase (${res.status}): ${errTxt}`);
      }
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
    const cfg = getSupabaseConfig();
    if (cfg && cfg.url && cfg.key) {
      try {
        await fetch(`${cfg.url}/rest/v1/client_sessions?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            'apikey': cfg.key,
            'Authorization': `Bearer ${cfg.key}`
          }
        });
      } catch (err) {}
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

  // Sincroniza todas las fotos locales (incluyendo cambios que Andrés ya hizo en su Mac) hacia Supabase
  async function syncLocalDataToSupabase(customCfg) {
    const cfg = customCfg || getSupabaseConfig();
    if (!cfg || !cfg.url || !cfg.key) {
      throw new Error('No hay credenciales de Supabase configuradas.');
    }

    // 1. Sincronizar fotos del portafolio local
    const localPhotos = await getLocalPortfolioPhotos();
    const rowsToUpsert = [];
    for (const p of localPhotos) {
      const copy = { ...p };
      const safeSlug = slugify(copy.title || copy.id || 'foto');
      copy.fullUrl = await uploadImageToCloudStorage(copy.fullUrl, `${copy.category || 'general'}/${safeSlug}-full`, cfg);
      copy.thumbUrl = await uploadImageToCloudStorage(copy.thumbUrl || copy.fullUrl, `${copy.category || 'general'}/${safeSlug}-thumb`, cfg);
      rowsToUpsert.push(mapPhotoToDbRow(copy));
    }

    if (rowsToUpsert.length > 0) {
      const pRes = await fetch(`${cfg.url}/rest/v1/portfolio_photos?on_conflict=id`, {
        method: 'POST',
        headers: {
          'apikey': cfg.key,
          'Authorization': `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(rowsToUpsert)
      });
      if (!pRes.ok) {
        const errTxt = await pRes.text().catch(() => '');
        throw new Error(`No se pudieron sincronizar las fotos (${pRes.status}): ${errTxt}`);
      }
    }

    // 2. Sincronizar portada Hero si fue personalizada localmente
    const localHero = await getLocalHeroImage();
    if (localHero && localHero !== DEFAULT_HERO) {
      const heroCdnUrl = await uploadImageToCloudStorage(localHero, 'hero/portada', cfg);
      await fetch(`${cfg.url}/rest/v1/site_settings?on_conflict=key`, {
        method: 'POST',
        headers: {
          'apikey': cfg.key,
          'Authorization': `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          key: 'hero_image',
          value: { url: heroCdnUrl },
          updated_at: new Date().toISOString()
        })
      }).catch(() => {});
    }

    // 3. Sincronizar sesiones de clientes
    const localSessions = await getLocalClientSessions();
    if (Array.isArray(localSessions) && localSessions.length > 0) {
      const sRows = localSessions.map(mapSessionToDbRow);
      await fetch(`${cfg.url}/rest/v1/client_sessions?on_conflict=id`, {
        method: 'POST',
        headers: {
          'apikey': cfg.key,
          'Authorization': `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(sRows)
      }).catch(() => {});
    }

    return { syncedPhotos: rowsToUpsert.length };
  }

  async function resetToDefaultData() {
    const cfg = getSupabaseConfig();
    if (cfg && cfg.url && cfg.key) {
      try {
        await fetch(`${cfg.url}/rest/v1/portfolio_photos?id=neq.__none__`, {
          method: 'DELETE',
          headers: { 'apikey': cfg.key, 'Authorization': `Bearer ${cfg.key}` }
        });
        const defaultRows = DEFAULT_PORTFOLIO.map(mapPhotoToDbRow);
        await fetch(`${cfg.url}/rest/v1/portfolio_photos?on_conflict=id`, {
          method: 'POST',
          headers: {
            'apikey': cfg.key,
            'Authorization': `Bearer ${cfg.key}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(defaultRows)
        });
        await fetch(`${cfg.url}/rest/v1/site_settings?key=eq.hero_image`, {
          method: 'DELETE',
          headers: { 'apikey': cfg.key, 'Authorization': `Bearer ${cfg.key}` }
        });
      } catch (err) {
        console.warn('Error al restablecer datos en Supabase:', err);
      }
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

    // Preferir formato WebP por velocidad SEO (< 3s en móvil), con fallback a JPEG
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

  // Exportar al objeto global window para que funcione siempre sin módulos
  window.AndresDB = {
    DEFAULT_PORTFOLIO,
    DEFAULT_SESSIONS,
    initStorage,
    getSupabaseConfig,
    isCloudEnabled,
    syncLocalDataToSupabase,
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
