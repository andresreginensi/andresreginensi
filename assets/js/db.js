/**
 * Andrés Reginensi Photography — Gestor de Base de Datos Local
 * Compatible al 100% tanto abriendo el archivo directamente con doble clic (file://)
 * como alojado en un servidor web (http:// / https://).
 * Utiliza IndexedDB con fallback automático a localStorage.
 */

(function (window) {
  'use strict';

  const DB_NAME = 'AndresPhotographyDB';
  const DB_VERSION = 1;

  // Fotos iniciales por defecto para el portafolio
  const DEFAULT_PORTFOLIO = [
    {
      id: 'port-real-1',
      category: 'realestate',
      categoryLabel: 'Inmobiliaria & Real Estate',
      title: 'Villa Pedralbes',
      tag: 'Arquitectura Exterior',
      caption: 'Villa Pedralbes — Geometría en Concreto & Luz Natural',
      aspect: 'landscape',
      thumbUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
      fullUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=95',
      createdAt: 1700000000001
    },
    {
      id: 'port-real-2',
      category: 'realestate',
      categoryLabel: 'Inmobiliaria & Real Estate',
      title: 'Ático Diagonal',
      tag: 'Interiorismo',
      caption: 'Ático Contemporáneo — Interiorismo & Iluminación Cenital',
      aspect: 'landscape',
      thumbUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85',
      fullUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=95',
      createdAt: 1700000000002
    },
    {
      id: 'port-real-3',
      category: 'realestate',
      categoryLabel: 'Inmobiliaria & Real Estate',
      title: 'Pabellón de Cristal',
      tag: 'Residencial',
      caption: 'Pabellón de Cristal — Transparencia y Concreto',
      aspect: 'landscape',
      thumbUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=85',
      fullUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1800&q=95',
      createdAt: 1700000000003
    },
    {
      id: 'port-boda-1',
      category: 'bodas',
      categoryLabel: 'Bodas & Eventos',
      title: 'Finca Bellver',
      tag: 'Sofía & Mateo',
      caption: 'Finca Bellver — Sofía & Mateo',
      aspect: 'portrait',
      thumbUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=85',
      fullUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=95',
      createdAt: 1700000000004
    },
    {
      id: 'port-boda-2',
      category: 'bodas',
      categoryLabel: 'Bodas & Eventos',
      title: 'Votos al Ocaso',
      tag: 'Ceremonia',
      caption: 'Votos al Atardecer — Mallorca',
      aspect: 'portrait',
      thumbUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=85',
      fullUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2000&q=95',
      createdAt: 1700000000005
    },
    {
      id: 'port-boda-3',
      category: 'bodas',
      categoryLabel: 'Bodas & Eventos',
      title: 'El Brindis',
      tag: 'Celebración',
      caption: 'Recepción & Celebración — Ambiente Nocturno',
      aspect: 'portrait',
      thumbUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=85',
      fullUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=2000&q=95',
      createdAt: 1700000000006
    },
    {
      id: 'port-ret-1',
      category: 'retratos',
      categoryLabel: 'Retratos & Editorial',
      title: 'Elena',
      tag: 'Estudio B&N',
      caption: 'Elena — Estudio Monocromo',
      aspect: 'portrait',
      thumbUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85',
      fullUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1800&q=95',
      createdAt: 1700000000007
    },
    {
      id: 'port-ret-2',
      category: 'retratos',
      categoryLabel: 'Retratos & Editorial',
      title: 'Perfil Natural',
      tag: 'Luz Continua',
      caption: 'Perfil Editorial — Luz Natural en Estudio',
      aspect: 'portrait',
      thumbUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85',
      fullUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1800&q=95',
      createdAt: 1700000000008
    },
    {
      id: 'port-ret-3',
      category: 'retratos',
      categoryLabel: 'Retratos & Editorial',
      title: 'Serie Miradas',
      tag: 'Editorial',
      caption: 'Mirada — Enfoque Editorial Minimalista',
      aspect: 'portrait',
      thumbUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85',
      fullUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1800&q=95',
      createdAt: 1700000000009
    },
    {
      id: 'port-corp-1',
      category: 'empresarial',
      categoryLabel: 'Empresarial & Corporativo',
      title: 'Equipo Directivo',
      tag: 'Headshots Ejecutivos',
      caption: 'Retrato Ejecutivo — Liderazgo y Presencia de Marca',
      aspect: 'portrait',
      thumbUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=85',
      fullUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1800&q=95',
      createdAt: 1700000000010
    },
    {
      id: 'port-corp-2',
      category: 'empresarial',
      categoryLabel: 'Empresarial & Corporativo',
      title: 'Identidad Profesional',
      tag: 'Perfil de Empresa',
      caption: 'Retrato Profesional — Consultoría & Finanzas',
      aspect: 'portrait',
      thumbUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=85',
      fullUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1800&q=95',
      createdAt: 1700000000011
    },
    {
      id: 'port-corp-3',
      category: 'empresarial',
      categoryLabel: 'Empresarial & Corporativo',
      title: 'Sede Central',
      tag: 'Instalaciones & Cultura',
      caption: 'Sede Corporativa — Arquitectura de Oficinas y Entornos de Trabajo',
      aspect: 'landscape',
      thumbUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85',
      fullUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2200&q=95',
      createdAt: 1700000000012
    }
  ];

  // Sesiones de clientes iniciales
  const DEFAULT_SESSIONS = [
    {
      id: 'boda-laura-carlos',
      pin: '2026',
      title: 'Boda Laura & Carlos',
      date: '18 de Octubre, 2026',
      location: 'Finca Bellver, Mallorca',
      clientName: 'Laura Gómez & Carlos Martínez',
      maxSelectable: 50,
      photos: [
        { id: 'AR_LC_001', thumbUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80', fullUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=90' },
        { id: 'AR_LC_002', thumbUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=700&q=80', fullUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1800&q=90' },
        { id: 'AR_LC_003', thumbUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=700&q=80', fullUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1800&q=90' },
        { id: 'AR_LC_004', thumbUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=700&q=80', fullUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1800&q=90' },
        { id: 'AR_LC_005', thumbUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=700&q=80', fullUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1800&q=90' },
        { id: 'AR_LC_006', thumbUrl: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=700&q=80', fullUrl: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1800&q=90' }
      ],
      createdAt: 1700000000001
    },
    {
      id: 'inmobiliaria-villa-mediterranea',
      pin: '1234',
      title: 'Villa Mediterránea - Reportaje Inmobiliario',
      date: '20 de Octubre, 2026',
      location: 'Jávea, Alicante',
      clientName: 'Habitat Luxury Real Estate',
      maxSelectable: 25,
      photos: [
        { id: 'AR_VM_001', thumbUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80', fullUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=90' },
        { id: 'AR_VM_002', thumbUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=80', fullUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=90' },
        { id: 'AR_VM_003', thumbUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=700&q=80', fullUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1800&q=90' }
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

  // Inicialización
  async function initStorage() {
    try {
      const db = await openDB();

      const count = await new Promise((res) => {
        const tx = db.transaction('portfolio', 'readonly');
        const st = tx.objectStore('portfolio');
        const r = st.count();
        r.onsuccess = () => res(r.result);
        r.onerror = () => res(0);
      });

      if (count === 0) {
        const tx = db.transaction(['portfolio', 'sessions', 'settings'], 'readwrite');
        const pStore = tx.objectStore('portfolio');
        const sStore = tx.objectStore('sessions');
        const setStore = tx.objectStore('settings');

        DEFAULT_PORTFOLIO.forEach((p) => pStore.put(p));
        DEFAULT_SESSIONS.forEach((s) => sStore.put(s));
        setStore.put({ key: 'admin_auth', value: DEFAULT_AUTH });
      }
    } catch (err) {
      useLocalStorageFallback = true;
      if (!getLS('portfolio', null)) {
        setLS('portfolio', DEFAULT_PORTFOLIO);
      }
      if (!getLS('sessions', null)) {
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

  // Gestión de Foto de Portada (Hero)
  const DEFAULT_HERO = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=90';

  async function getHeroImage() {
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

  async function saveHeroImage(url) {
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

  // Portafolio
  async function getAllPortfolioPhotos() {
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

  async function savePortfolioPhoto(photo) {
    if (!photo.id) {
      photo.id = 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }
    if (!photo.createdAt) {
      photo.createdAt = Date.now();
    }

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

  async function deletePortfolioPhoto(id) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
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
      return true;
    }
  }

  // Sesiones de Clientes (Proofing)
  async function getAllClientSessions() {
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

  async function getClientSessionById(id) {
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
    try {
      const db = await openDB();
      const tx = db.transaction(['portfolio', 'sessions'], 'readwrite');
      tx.objectStore('portfolio').clear();
      tx.objectStore('sessions').clear();
      DEFAULT_PORTFOLIO.forEach((p) => tx.objectStore('portfolio').put(p));
      DEFAULT_SESSIONS.forEach((s) => tx.objectStore('sessions').put(s));
    } catch (e) {}

    setLS('portfolio', DEFAULT_PORTFOLIO);
    setLS('sessions', DEFAULT_SESSIONS);
    return true;
  }

  // Procesador y compresor de fotos
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
            const thumbUrl = resizeImage(img, 700, 0.80);
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
