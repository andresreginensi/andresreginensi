/**
 * Servicio de Envío de Pedidos de Selección de Fotos
 * Soporta EmailJS, Formspree y canal directo garantizado (WhatsApp / Email / Portapapeles)
 * cuando las claves de envío automático aún no están configuradas.
 */

(function (window) {
  'use strict';

  const EMAIL_CONFIG = {
    provider: 'emailjs', // 'emailjs' | 'formspree' | 'direct'
    studioEmail: 'andresreginensi@gmail.com',
    studioWhatsapp: '34664848096',

    // Configuración EmailJS (https://www.emailjs.com)
    emailjs: {
      publicKey: 'TU_PUBLIC_KEY',       // Reemplazar con tu Public Key de EmailJS
      serviceId: 'service_reginensi',   // Tu Service ID
      templateId: 'template_proofing'   // Tu Template ID
    },

    // Configuración Formspree (https://formspree.io)
    formspree: {
      endpoint: 'https://formspree.io/f/TU_FORMSPREE_ID' // Reemplazar si usas Formspree
    }
  };

  function isEmailJsConfigured() {
    return Boolean(
      EMAIL_CONFIG.provider === 'emailjs' &&
      window.emailjs &&
      EMAIL_CONFIG.emailjs.publicKey &&
      EMAIL_CONFIG.emailjs.publicKey !== 'TU_PUBLIC_KEY'
    );
  }

  function isFormspreeConfigured() {
    return Boolean(
      EMAIL_CONFIG.provider === 'formspree' &&
      EMAIL_CONFIG.formspree.endpoint &&
      !EMAIL_CONFIG.formspree.endpoint.includes('TU_FORMSPREE_ID')
    );
  }

  function initEmailService() {
    if (isEmailJsConfigured()) {
      window.emailjs.init(EMAIL_CONFIG.emailjs.publicKey);
    }
  }

  function buildOrderChannels(templateParams) {
    const summaryText = [
      `SELECCIÓN DE FOTOS — ${templateParams.session_title}`,
      `Cliente: ${templateParams.client_name} (${templateParams.client_email})`,
      `Total seleccionadas: ${templateParams.total_selected}`,
      `Fecha: ${templateParams.sent_at}`,
      `Notas: ${templateParams.notes}`,
      '',
      'Fotografías elegidas:',
      templateParams.photo_list
    ].join('\n');

    const subject = `Selección de Fotos (${templateParams.total_selected}) — ${templateParams.session_title}`;
    const mailtoUrl = `mailto:${EMAIL_CONFIG.studioEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summaryText)}`;
    const whatsappUrl = `https://wa.me/${EMAIL_CONFIG.studioWhatsapp}?text=${encodeURIComponent('Hola Andrés, te envío mi selección final de fotografías:\n\n' + summaryText)}`;

    return { summaryText, mailtoUrl, whatsappUrl };
  }

  async function sendOrder(orderData) {
    const formattedPhotoList = orderData.selectedPhotos
      .map((id, index) => `${index + 1}. [${id}]`)
      .join('\n');

    const templateParams = {
      client_name: orderData.clientName,
      client_email: orderData.clientEmail,
      session_title: orderData.sessionTitle,
      session_id: orderData.sessionId,
      total_selected: orderData.selectedPhotos.length,
      notes: orderData.notes || 'Sin comentarios adicionales',
      photo_list: formattedPhotoList,
      sent_at: new Date().toLocaleString('es-ES')
    };

    const channels = buildOrderChannels(templateParams);

    // 1. Envío automático con EmailJS (si hay claves reales configuradas)
    if (isEmailJsConfigured()) {
      try {
        const response = await window.emailjs.send(
          EMAIL_CONFIG.emailjs.serviceId,
          EMAIL_CONFIG.emailjs.templateId,
          templateParams
        );
        return {
          success: true,
          mode: 'emailjs',
          message: 'Tu selección se ha enviado automáticamente al correo del estudio.',
          response,
          ...channels
        };
      } catch (err) {
        console.error('[EmailService] Error en EmailJS:', err);
        return {
          success: false,
          mode: 'direct_channel',
          message: 'El envío automático no estuvo disponible. Usa uno de los botones directos para remitir tu selección sin perder ningún dato.',
          ...channels
        };
      }
    }

    // 2. Envío automático con Formspree (si hay endpoint real configurado)
    if (isFormspreeConfigured()) {
      try {
        const response = await fetch(EMAIL_CONFIG.formspree.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(templateParams)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return {
          success: true,
          mode: 'formspree',
          message: 'Tu selección se ha registrado correctamente.',
          ...channels
        };
      } catch (err) {
        console.error('[EmailService] Error en Formspree:', err);
        return {
          success: false,
          mode: 'direct_channel',
          message: 'El envío automático no estuvo disponible. Usa uno de los botones directos para remitir tu selección.',
          ...channels
        };
      }
    }

    // 3. Canal directo garantizado (evita perder pedidos cuando EmailJS/Formspree aún no tiene API key)
    return {
      success: false,
      mode: 'direct_channel',
      message: 'Tu lista está lista. Pulsa WhatsApp o Correo directo para enviarla a Andrés Reginensi al instante.',
      ...channels
    };
  }

  window.EmailService = {
    EMAIL_CONFIG,
    initEmailService,
    isAutomatedConfigured: () => isEmailJsConfigured() || isFormspreeConfigured(),
    sendOrder
  };

})(window);
