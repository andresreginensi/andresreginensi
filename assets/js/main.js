/**
 * Andrés Reginensi Photography — Experiencia Interactiva Cinemática
 * Efectos: Cursor Magnético, 3D Tilt, Glare, Parallax, Antes/Después, Lightbox con Flash
 */

// =======================================================
// 1. DATOS DE COLECCIÓN EDITORIAL & EXIF
// =======================================================
const editorialWorks = [
  {
    id: 'arch-1',
    category: 'inmobiliaria',
    categoryLabel: 'Arquitectura',
    title: 'Villa Galileu — Arquitectura & Piscina',
    location: 'Jávea',
    exif: 'Sony A7 IV · 24-70mm GM · f/8 · ISO 100',
    thumbUrl: 'assets/images/realestate/galileu-piscina-thumb.jpg',
    fullUrl: 'assets/images/realestate/galileu-piscina.jpg',
    colSpan: 'col-span-8',
    isWide: true
  },
  {
    id: 'arch-2',
    category: 'inmobiliaria',
    categoryLabel: 'Interiorismo',
    title: 'Villa Galileu — Foyer de Entrada',
    location: 'Costa Blanca',
    exif: 'Sony A7 IV · 16-35mm GM · f/5.6 · ISO 160',
    thumbUrl: 'assets/images/realestate/galileu-salon-thumb.jpg',
    fullUrl: 'assets/images/realestate/galileu-salon.jpg',
    colSpan: 'col-span-4',
    isPortrait: false
  },
  {
    id: 'boda-1',
    category: 'bodas',
    categoryLabel: 'Bodas & Eventos',
    title: 'Lluvia de Confeti — Celebración & Salida',
    location: 'Ceremonia',
    exif: 'Sony A7 IV · 41mm · f/14 · 1/800s · ISO 320',
    thumbUrl: 'assets/images/bodas/boda-salida-arroz-thumb.jpg',
    fullUrl: 'assets/images/bodas/boda-salida-arroz.jpg',
    colSpan: 'col-span-5',
    isPortrait: false
  },
  {
    id: 'boda-2',
    category: 'bodas',
    categoryLabel: 'Bodas & Eventos',
    title: 'Orilla Dorada — Paseo al Ocaso',
    location: 'Playa Mediterránea',
    exif: 'Sony A7 IV · 150mm · f/3.2 · 1/500s · ISO 125',
    thumbUrl: 'assets/images/bodas/boda-playa-orilla-thumb.jpg',
    fullUrl: 'assets/images/bodas/boda-playa-orilla.jpg',
    colSpan: 'col-span-7',
    isWide: true
  },
  {
    id: 'ret-1',
    category: 'retratos',
    categoryLabel: 'Retrato Editorial',
    title: 'Steffa — Noche Urbana & Bokeh',
    location: 'Barcelona',
    exif: 'Nikon D610 · 50mm f/1.8 · f/2.0 · ISO 640',
    thumbUrl: 'assets/images/retratos/retrato-steffa-noche-thumb.jpg',
    fullUrl: 'assets/images/retratos/retrato-steffa-noche.jpg',
    colSpan: 'col-span-4',
    isPortrait: true
  },
  {
    id: 'ret-2',
    category: 'retratos',
    categoryLabel: 'Retrato Editorial',
    title: 'Luz Dorada — Atardecer & Flare Natural',
    location: 'Costa',
    exif: 'Nikon D610 · 62mm · f/3.2 · 1/1600s · ISO 400',
    thumbUrl: 'assets/images/retratos/retrato-golden-hour-thumb.jpg',
    fullUrl: 'assets/images/retratos/retrato-golden-hour.jpg',
    colSpan: 'col-span-4',
    isPortrait: true
  },
  {
    id: 'arch-3',
    category: 'inmobiliaria',
    categoryLabel: 'Arquitectura',
    title: 'Edificio Burgueras — Fachada & Cristales',
    location: 'Sede Comercial',
    exif: 'Sony A7 IV · 24mm · f/9 · ISO 100',
    thumbUrl: 'assets/images/realestate/burgueras-fachada-thumb.jpg',
    fullUrl: 'assets/images/realestate/burgueras-fachada.jpg',
    colSpan: 'col-span-4',
    isPortrait: false
  }
];

let currentFilteredWorks = [...editorialWorks];
let currentLightboxIndex = 0;

// Elementos DOM
const grid = document.getElementById('editorial-grid');
const filterItems = document.querySelectorAll('.filter-item');
const filterIndicator = document.getElementById('filter-indicator');
const progressBar = document.getElementById('scroll-progress');
const siteHeader = document.getElementById('site-header');

// Custom Cursor
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');
const cursorText = document.getElementById('cursor-text');

// Hero
const heroSection = document.getElementById('hero-section');
const heroBackdrop = document.getElementById('hero-backdrop');
const heroTitleGroup = document.getElementById('hero-title-group');
const heroReelBtns = document.querySelectorAll('.hero-reel-btn');
const heroSlides = document.querySelectorAll('.hero-slide');

// Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const lightboxCurrent = document.getElementById('lightbox-current');
const lightboxTotal = document.getElementById('lightbox-total');
const lightboxFlash = document.getElementById('lightbox-flash');

// Before / After Slider
const comparisonSlider = document.getElementById('comparison-slider');
const comparisonBefore = document.getElementById('comparison-before');
const comparisonHandle = document.getElementById('comparison-handle');

// =======================================================
// 2. CURSOR CINEMÁTICO MAGNÉTICO (60fps lerp loop)
// =======================================================
let mouseX = -100;
let mouseY = -100;
let ringX = -100;
let ringY = -100;
let isMouseActive = false;

function initCustomCursor() {
  if (!cursorDot || !cursorRing) return;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isMouseActive) {
      isMouseActive = true;
      cursorDot.classList.add('is-visible');
      cursorRing.classList.add('is-visible');
      ringX = mouseX;
      ringY = mouseY;
    }

    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
  });

  document.addEventListener('mouseleave', () => {
    cursorDot.classList.remove('is-visible');
    cursorRing.classList.remove('is-visible');
    isMouseActive = false;
  });

  document.addEventListener('mousedown', () => {
    cursorRing.classList.add('is-clicking');
  });

  document.addEventListener('mouseup', () => {
    cursorRing.classList.remove('is-clicking');
  });

  // Animación suave del aro con interpolación lineal (lerp)
  function renderCursor() {
    if (isMouseActive) {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
    }
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  // Elementos magnéticos (botones y enlaces)
  setupMagneticElements();
}

function setupMagneticElements() {
  const magneticEls = document.querySelectorAll('[data-magnetic], a, button');
  magneticEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorRing.classList.add('is-hovering');
    });
    el.addEventListener('mouseleave', () => {
      cursorRing.classList.remove('is-hovering');
    });
  });
}

// =======================================================
// 3. BARRA DE SCROLL & CABECERA FLOTANTE
// =======================================================
function handleScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  if (progressBar) {
    progressBar.style.width = `${scrollPercent}%`;
  }

  if (siteHeader) {
    siteHeader.classList.toggle('is-scrolled', scrollTop > 60);
  }

  // Scrollspy para el menú
  updateActiveNavLink(scrollTop);
}

window.addEventListener('scroll', handleScroll, { passive: true });

function updateActiveNavLink(scrollY) {
  const sections = document.querySelectorAll('section[id]');
  sections.forEach(current => {
    const sectionHeight = current.offsetHeight;
    const sectionTop = current.offsetTop - 180;
    const sectionId = current.getAttribute('id');
    const matchingLink = document.querySelector(`.main-nav a[href="#${sectionId}"]`);

    if (matchingLink) {
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        matchingLink.classList.add('active');
      } else {
        matchingLink.classList.remove('active');
      }
    }
  });
}

// =======================================================
// 4. HERO CINEMÁTICO: PARALLAX Y REEL SWITCHER
// =======================================================
function initHeroParallax() {
  if (!heroSection) return;

  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    if (heroBackdrop) {
      heroBackdrop.style.transform = `scale(1.05) translate(${x * -20}px, ${y * -15}px)`;
    }
    if (heroTitleGroup) {
      heroTitleGroup.style.transform = `translate(${x * 12}px, ${y * 10}px)`;
    }
  });

  heroSection.addEventListener('mouseleave', () => {
    if (heroBackdrop) {
      heroBackdrop.style.transform = `scale(1.05) translate(0px, 0px)`;
    }
    if (heroTitleGroup) {
      heroTitleGroup.style.transform = `translate(0px, 0px)`;
    }
  });

  // Conmutador interactivo de diapositivas del Hero
  heroReelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const slideIndex = btn.dataset.slide;

      heroReelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      heroSlides.forEach(slide => {
        if (slide.dataset.index === slideIndex) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });
    });
  });
}

// =======================================================
// 5. MOSAICO EDITORIAL CON 3D TILT & SPECULAR GLARE
// =======================================================
function renderWorks(category = 'all') {
  if (!grid) return;
  grid.innerHTML = '';

  currentFilteredWorks = category === 'all'
    ? editorialWorks
    : editorialWorks.filter(item => item.category === category);

  currentFilteredWorks.forEach((item, index) => {
    const card = document.createElement('article');
    const spanClass = category === 'all' ? item.colSpan : 'col-span-6';
    const aspectClass = item.isPortrait ? 'portrait' : (item.isWide ? 'wide' : '');

    card.className = `editorial-card ${spanClass} ${aspectClass} reveal`;
    card.style.transitionDelay = `${(index % 4) * 0.08}s`;

    card.innerHTML = `
      <div class="img-wrapper">
        <img src="${item.thumbUrl}" alt="${item.title}" loading="lazy" decoding="async">
        <div class="card-glare"></div>
        <div class="card-exif">${item.exif}</div>
      </div>
      <div class="card-caption">
        <h3 class="card-title">${item.title}</h3>
        <span class="card-category">${item.categoryLabel} · ${item.location}</span>
      </div>
    `;

    // Efecto 3D Tilt y Glare que sigue al cursor
    attachTiltAndGlare(card);

    // Hover sobre tarjeta modifica el cursor a "VER FOTO"
    card.addEventListener('mouseenter', () => {
      if (cursorRing && cursorText) {
        cursorText.textContent = 'VER';
        cursorRing.classList.add('is-card-hover');
      }
    });

    card.addEventListener('mouseleave', () => {
      if (cursorRing && cursorText) {
        cursorRing.classList.remove('is-card-hover');
        cursorText.textContent = '';
      }
    });

    // Abrir Lightbox
    card.addEventListener('click', () => openLightboxByIndex(index));

    grid.appendChild(card);
  });

  observeReveals();
}

function attachTiltAndGlare(card) {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -9; // Grados X
    const rotateY = ((x - centerX) / centerX) * 9;  // Grados Y

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  });
}

// =======================================================
// 6. FILTRO DE CATEGORÍAS CON CÁPSULA DESLIZANTE
// =======================================================
function updateFilterIndicator(activeBtn) {
  if (!filterIndicator || !activeBtn) return;
  filterIndicator.style.width = `${activeBtn.offsetWidth}px`;
  filterIndicator.style.transform = `translateX(${activeBtn.offsetLeft - activeBtn.parentElement.offsetLeft}px)`;
}

filterItems.forEach(btn => {
  btn.addEventListener('click', () => {
    filterItems.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    updateFilterIndicator(btn);
    renderWorks(btn.dataset.category);
  });
});

window.addEventListener('resize', () => {
  const activeBtn = document.querySelector('.filter-item.active');
  if (activeBtn) updateFilterIndicator(activeBtn);
});

// =======================================================
// 7. DESLIZADOR INTERACTIVO "ANTES Y DESPUÉS" (RAW VS GRADING)
// =======================================================
function initBeforeAfterSlider() {
  if (!comparisonSlider || !comparisonBefore || !comparisonHandle) return;

  let isSliding = false;

  function updateSliderPosition(clientX) {
    const rect = comparisonSlider.getBoundingClientRect();
    let pos = ((clientX - rect.left) / rect.width) * 100;

    // Límites de seguridad entre 5% y 95%
    pos = Math.max(5, Math.min(95, pos));

    comparisonSlider.style.setProperty('--split-pos', `${pos}%`);
  }

  // Eventos de ratón
  comparisonSlider.addEventListener('mousedown', (e) => {
    isSliding = true;
    updateSliderPosition(e.clientX);
    if (cursorRing) cursorRing.classList.add('is-dragging');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isSliding) return;
    updateSliderPosition(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    if (isSliding) {
      isSliding = false;
      if (cursorRing) cursorRing.classList.remove('is-dragging');
    }
  });

  // Eventos táctiles para móviles
  comparisonSlider.addEventListener('touchstart', (e) => {
    isSliding = true;
    updateSliderPosition(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isSliding) return;
    updateSliderPosition(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isSliding = false;
  });

  // Cursor custom sobre el slider
  comparisonSlider.addEventListener('mouseenter', () => {
    if (cursorRing && cursorText) {
      cursorText.textContent = 'ARRASTRA';
      cursorRing.classList.add('is-card-hover');
    }
  });

  comparisonSlider.addEventListener('mouseleave', () => {
    if (cursorRing && cursorText) {
      cursorRing.classList.remove('is-card-hover');
      cursorText.textContent = '';
    }
  });
}

// =======================================================
// 8. LIGHTBOX CINEMÁTICO CON MICRO-FLASH & NAVEGACIÓN
// =======================================================
function triggerFlash() {
  if (!lightboxFlash) return;
  lightboxFlash.classList.add('is-flashing');
  setTimeout(() => {
    lightboxFlash.classList.remove('is-flashing');
  }, 160);
}

function openLightboxByIndex(index) {
  if (!currentFilteredWorks[index]) return;
  currentLightboxIndex = index;
  const item = currentFilteredWorks[index];

  triggerFlash();

  lightboxImg.src = item.fullUrl;
  lightboxCaption.innerHTML = `<strong>${item.title}</strong> — ${item.categoryLabel} &bull; <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-warm);">${item.exif}</span>`;

  if (lightboxCurrent) {
    lightboxCurrent.textContent = String(index + 1).padStart(2, '0');
  }
  if (lightboxTotal) {
    lightboxTotal.textContent = String(currentFilteredWorks.length).padStart(2, '0');
  }

  lightbox.classList.add('active');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function navigateLightbox(direction) {
  let nextIndex = currentLightboxIndex + direction;
  if (nextIndex < 0) nextIndex = currentFilteredWorks.length - 1;
  if (nextIndex >= currentFilteredWorks.length) nextIndex = 0;

  lightboxImg.style.opacity = '0.3';
  lightboxImg.style.transform = direction > 0 ? 'translateX(20px) scale(0.98)' : 'translateX(-20px) scale(0.98)';

  setTimeout(() => {
    openLightboxByIndex(nextIndex);
    lightboxImg.style.opacity = '1';
    lightboxImg.style.transform = 'translateX(0) scale(1)';
  }, 120);
}

function closeLightbox() {
  lightbox.classList.remove('active');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImg.src = '';
  document.body.style.overflow = 'auto';
}

if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightboxPrev) lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
if (lightboxNext) lightboxNext.addEventListener('click', () => navigateLightbox(1));

if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
      closeLightbox();
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') navigateLightbox(-1);
  if (e.key === 'ArrowRight') navigateLightbox(1);
});

// =======================================================
// 9. SCROLL REVEAL (INTERSECTION OBSERVER)
// =======================================================
let revealObserver;

function setupScrollReveal() {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  observeReveals();
}

function observeReveals() {
  if (!revealObserver) return;
  document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
    revealObserver.observe(el);
  });
}

// =======================================================
// 10. CARGA DINÁMICA DEL PORTAFOLIO DESDE LA BASE DE DATOS
// =======================================================
let allPortfolioPhotos = [];

async function loadAndRenderSections() {
  try {
    const db = window.AndresDB;
    if (db && db.initStorage) {
      await db.initStorage();
      allPortfolioPhotos = await db.getAllPortfolioPhotos();
    }

    if (db && db.getHeroImage) {
      const heroUrl = await db.getHeroImage();
      const heroImg = document.querySelector('.hero-backdrop img');
      if (heroImg && heroUrl) {
        heroImg.src = heroUrl;
      }
    }

    renderSectionGrid('realestate', '.grid-realestate');
    renderSectionGrid('bodas', '.grid-weddings');
    renderSectionGrid('retratos', '.grid-portraits');
    renderSectionGrid('empresarial', '.grid-corporate');

    setupPhotoLightboxEvents();
    observeReveals();
  } catch (err) {
    console.warn('Cargando con contenido estático:', err);
    setupPhotoLightboxEvents();
  }
}

function renderSectionGrid(category, selector) {
  const container = document.querySelector(selector);
  if (!container) return;

  const photos = allPortfolioPhotos.filter(p => p.category === category);
  if (photos.length === 0) return;

  if (category === 'realestate') {
    const mainPhoto = photos[0];
    const subPhotos = photos.slice(1);

    let html = `
      <article class="photo-item aspect-landscape reveal" data-full="${mainPhoto.fullUrl}" data-caption="${mainPhoto.caption || mainPhoto.title}">
        <div class="img-box">
          <img src="${mainPhoto.thumbUrl || mainPhoto.fullUrl}" alt="${mainPhoto.title}" loading="lazy">
        </div>
        <div class="photo-info">
          <h3 class="photo-name">${mainPhoto.title}</h3>
          <span class="photo-tag">${mainPhoto.tag || ''}</span>
        </div>
      </article>
    `;

    if (subPhotos.length > 0) {
      html += `
        <div class="realestate-subgrid">
          ${subPhotos.map(p => `
            <article class="photo-item aspect-landscape reveal" data-full="${p.fullUrl}" data-caption="${p.caption || p.title}">
              <div class="img-box">
                <img src="${p.thumbUrl || p.fullUrl}" alt="${p.title}" loading="lazy">
              </div>
              <div class="photo-info">
                <h3 class="photo-name">${p.title}</h3>
                <span class="photo-tag">${p.tag || ''}</span>
              </div>
            </article>
          `).join('')}
        </div>
      `;
    }
    container.innerHTML = html;
  } else {
    container.innerHTML = photos.map(p => {
      const aspectClass = p.aspect === 'landscape' ? 'aspect-landscape' : 'aspect-portrait';
      return `
        <article class="photo-item ${aspectClass} reveal" data-full="${p.fullUrl}" data-caption="${p.caption || p.title}">
          <div class="img-box">
            <img src="${p.thumbUrl || p.fullUrl}" alt="${p.title}" loading="lazy">
          </div>
          <div class="photo-info">
            <h3 class="photo-name">${p.title}</h3>
            <span class="photo-tag">${p.tag || ''}</span>
          </div>
        </article>
      `;
    }).join('');
  }
}

function setupPhotoLightboxEvents() {
  const photoItems = document.querySelectorAll('.photo-item');
  photoItems.forEach((item) => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      const fullUrl = item.dataset.full;
      const caption = item.dataset.caption || '';
      if (!fullUrl) return;

      triggerFlash();
      if (lightboxImg) lightboxImg.src = fullUrl;
      if (lightboxCaption) lightboxCaption.innerHTML = caption;
      if (lightbox) {
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    });

    item.addEventListener('mouseenter', () => {
      if (cursorRing && cursorText) {
        cursorText.textContent = 'VER';
        cursorRing.classList.add('is-card-hover');
      }
    });

    item.addEventListener('mouseleave', () => {
      if (cursorRing && cursorText) {
        cursorRing.classList.remove('is-card-hover');
        cursorText.textContent = '';
      }
    });
  });
}

// =======================================================
// 11. NAVEGACIÓN MÓVIL Y GESTOS TÁCTILES
// =======================================================
function initMobileNavigation() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const drawer = document.getElementById('mobile-nav-drawer');
  const closeBtn = document.getElementById('mobile-nav-close');
  const backdrop = document.getElementById('mobile-nav-backdrop');
  const links = document.querySelectorAll('.mobile-nav-link, .btn-mobile-client, .btn-mobile-whatsapp');

  if (!toggleBtn || !drawer) return;

  function openDrawer() {
    drawer.classList.add('is-active');
    drawer.setAttribute('aria-hidden', 'false');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('is-active');
    drawer.setAttribute('aria-hidden', 'true');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (drawer.classList.contains('is-active')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  links.forEach((link) => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-active')) {
      closeDrawer();
    }
  });
}

function initLightboxTouchGestures() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  // Cerrar al tocar el fondo oscuro (fuera de la imagen)
  lb.addEventListener('click', (e) => {
    if (e.target === lb || e.target.classList.contains('lightbox-content')) {
      lb.classList.remove('active');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  });

  // Gestos táctiles de deslizamiento (Swipe down para cerrar)
  let touchStartY = 0;
  let touchStartX = 0;

  lb.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }
  }, { passive: true });

  lb.addEventListener('touchend', (e) => {
    if (!lb.classList.contains('active')) return;
    if (e.changedTouches && e.changedTouches.length === 1) {
      const diffY = e.changedTouches[0].clientY - touchStartY;
      const diffX = Math.abs(e.changedTouches[0].clientX - touchStartX);

      // Si desliza hacia abajo más de 90px y no es un swipe horizontal
      if (diffY > 90 && diffX < 80) {
        lb.classList.remove('active');
        lb.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    }
  }, { passive: true });
}

// =======================================================
// 12. INICIALIZACIÓN
// =======================================================
function initAll() {
  initCustomCursor();
  initHeroParallax();
  initBeforeAfterSlider();
  setupScrollReveal();
  loadAndRenderSections();
  initMobileNavigation();
  initLightboxTouchGestures();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}

