# Andrés Reginensi Photography — Web & Client Proofing (JAMstack)

Página web profesional y sistema de selección privada de fotos (*Client Proofing*) para **Andrés Reginensi Photography**, diseñada bajo arquitectura JAMstack para alojarse 100% gratis en **GitHub Pages**.

---

## 🚀 Características Principales

1. **Panel de Administración Visual (`admin.html`):**
   - **Acceso protegido con Usuario y Contraseña** (inicial: `admin` / `admin2026`, modificable desde Ajustes).
   - **Gestión del Portafolio sin tocar código:**
     - Sube fotos arrastrándolas directamente desde tu Mac o pegando un enlace URL.
     - Compresión y optimización automática para que carguen al instante sin ralentizar la web.
     - Edita títulos, subtítulos o categorías (Inmobiliaria, Bodas, Retratos, Empresarial).
     - Elimina fotos con 1 clic.
   - **Gestión de Galerías Privadas (Proofing):**
     - Crea nuevas sesiones para novios o empresas en segundos con su propio PIN secreto.
     - Sube múltiples fotos a la vez para cada cliente.
     - Botón "Copiar Enlace para el Cliente" listo para enviar por WhatsApp o email (`proofing.html?session=...&pin=...`).
   - **Copia de seguridad en 1 clic** para descargar todo tu catálogo fotográfico.

2. **Portafolio Público (`index.html`):**
   - Estética minimalista *Dark Editorial* inspirada en galerías de arte contemporáneo.
   - Navegación filtrable instantánea en las disciplinas:
     - *Inmobiliaria & Real Estate*
     - *Bodas & Parejas*
     - *Retratos & Editorial*
     - *Empresarial & Corporativo*
   - Lightbox a pantalla completa para visualización inmersiva.
   - Carga dinámica desde la base de datos local gestionada desde el panel de admin.

3. **Área Privada de Clientes / Proofing (`proofing.html`):**
   - **Acceso por enlace directo o PIN:**
     - Enlace directo: `proofing.html?session=boda-laura-carlos&pin=2026`
     - Modal de entrada con contraseña/PIN para mayor privacidad.
   - **Gestión reactiva en memoria:** Selecciona/deselecciona fotos con un clic, con feedback visual.
   - **Herramienta de lupa (Zoom):** El cliente puede ampliar cualquier foto en alta resolución antes de marcarla.
   - **Envío directo:** El cliente remite su selección final de fotos con notas a tu correo.

---

## 📁 Estructura del Proyecto

```text
├── index.html                   # Portafolio público principal
├── proofing.html                # Área privada de selección de clientes
├── assets/
│   ├── css/
│   │   ├── variables.css        # Paleta (Dark/Gold), fuentes y constantes
│   │   ├── main.css             # Estilos del portafolio público
│   │   └── proofing.css         # Estilos del sistema de selección
│   └── js/
│       ├── main.js              # Lógica de filtros y lightbox del portafolio
│       ├── proofing.js          # Motor de selección, estados y eventos
│       └── email-service.js     # Conector para EmailJS / Formspree
└── data/
    └── sessions/
        ├── boda-laura-carlos.json                 # Demo de Boda (PIN: 2026)
        └── inmobiliaria-villa-mediterranea.json   # Demo Inmobiliaria (PIN: 1234)
```

---

## 🛠️ Cómo agregar una nueva sesión de cliente

Para entregar una nueva sesión a un cliente, simplemente crea un archivo JSON en `data/sessions/nombre-cliente.json` con este formato:

```json
{
  "id": "boda-marcos-elena",
  "pin": "5432",
  "title": "Boda de Marcos & Elena",
  "date": "28 de Octubre, 2026",
  "location": "Madrid",
  "clientName": "Elena & Marcos",
  "maxSelectable": 40,
  "photos": [
    {
      "id": "AR_ME_001",
      "thumbUrl": "https://res.cloudinary.com/tu-cuenta/image/upload/w_700,q_auto,f_auto/foto1.jpg",
      "fullUrl": "https://res.cloudinary.com/tu-cuenta/image/upload/w_2000,q_auto/foto1.jpg"
    }
  ]
}
```

Luego regístrala en `assets/js/proofing.js` en el objeto `AVAILABLE_SESSIONS`:
```javascript
const AVAILABLE_SESSIONS = {
  'boda-marcos-elena': 'data/sessions/boda-marcos-elena.json'
};
```

Y envíale a tu cliente el enlace personalizado:
`https://tu-usuario.github.io/proofing.html?session=boda-marcos-elena&pin=5432`

---

## 📧 Configuración de EmailJS (Recepción en tu correo)

El código viene listo en **Modo Simulación** (imprime el pedido en la consola del navegador para que pruebes de inmediato). Para recibir correos reales en tu bandeja de entrada:

1. Crea una cuenta gratuita en [EmailJS](https://www.emailjs.com/) (200 correos gratis/mes).
2. Conecta tu proveedor de correo (Gmail, Outlook, etc.) en **Email Services**.
3. Crea una plantilla en **Email Templates** con estas variables:
   - `{{client_name}}`: Nombre del cliente
   - `{{client_email}}`: Email del cliente
   - `{{session_title}}`: Nombre del reportaje
   - `{{total_selected}}`: Cantidad de fotos elegidas
   - `{{photo_list}}`: Lista de IDs de las fotos (`AR_LC_001`, `AR_LC_002`, etc.)
   - `{{notes}}`: Comentarios o notas de retoque
4. Abre `assets/js/email-service.js` y coloca tus claves:
   ```javascript
   emailjs: {
     publicKey: 'TU_PUBLIC_KEY',
     serviceId: 'TU_SERVICE_ID',
     templateId: 'TU_TEMPLATE_ID'
   }
   ```

---

## 🌐 Cómo desplegar en GitHub Pages

1. Inicializa el repositorio Git y haz commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Andrés Reginensi Photography"
   ```
2. Crea un repositorio en tu cuenta de GitHub (ej. `andresreginensi-photography`).
3. Conéctalo y sube tus archivos:
   ```bash
   git remote add origin https://github.com/tu-usuario/andresreginensi-photography.git
   git branch -M main
   git push -u origin main
   ```
4. En GitHub, ve a **Settings** > **Pages**:
   - En **Source**, selecciona `Deploy from a branch`.
   - Elige la rama `main` y la carpeta `/ (root)`.
   - Haz clic en **Save**. En 1 minuto tendrás tu web activa en `https://tu-usuario.github.io/andresreginensi-photography/`.
