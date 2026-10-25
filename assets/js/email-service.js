/**
 * Servicio de Envío de Pedidos de Selección de Fotos
 * Compatible con ejecución local directa (file://) y servidores web.
 */

(function (window) {
  'use strict';

  const EMAIL_CONFIG = {
    provider: 'emailjs', // 'emailjs' | 'formspree' | 'demo'
    
    // Configuración EmailJS (https://www.emailjs.com)
    emailjs: {
      publicKey: 'TU_PUBLIC_KEY',       // Reemplazar con tu Public Key de EmailJS
      serviceId: 'service_reginensi',    // Tu Service ID
      templateId: 'template_proofing'   // Tu Template ID
    },

    // Configuración Formspree (https://formspree.io)
    formspree: {
      endpoint: 'https://formspree.io/f/TU_FORMSPREE_ID' // Reemplazar si usas Formspree
    }
  };

  /**
   * Inicializa EmailJS si está configurado en el navegador
   */
  function initEmailService() {
    if (
      EMAIL_CONFIG.provider === 'emailjs' &&
      window.emailjs &&
      EMAIL_CONFIG.emailjs.publicKey !== 'TU_PUBLIC_KEY'
    ) {
      window.emailjs.init(EMAIL_CONFIG.emailjs.publicKey);
    }
  }

  /**
   * Envía el pedido de fotos seleccionadas al fotógrafo
   */
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

    // 1. Envío con EmailJS
    if (
      EMAIL_CONFIG.provider === 'emailjs' &&
      window.emailjs &&
      EMAIL_CONFIG.emailjs.publicKey !== 'TU_PUBLIC_KEY'
    ) {
      try {
        const response = await window.emailjs.send(
          EMAIL_CONFIG.emailjs.serviceId,
          EMAIL_CONFIG.emailjs.templateId,
          templateParams
        );
        return { success: true, message: 'Pedido enviado correctamente', response };
      } catch (err) {
        console.error('[EmailService] Error en EmailJS:', err);
        throw new Error('No se pudo enviar el correo mediante EmailJS.');
      }
    }

    // 2. Envío con Formspree
    if (
      EMAIL_CONFIG.provider === 'formspree' &&
      EMAIL_CONFIG.formspree.endpoint !== 'https://formspree.io/f/TU_FORMSPREE_ID'
    ) {
      try {
        const response = await fetch(EMAIL_CONFIG.formspree.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(templateParams)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { success: true, message: 'Pedido enviado correctamente con Formspree' };
      } catch (err) {
        console.error('[EmailService] Error en Formspree:', err);
        throw new Error('No se pudo enviar el pedido mediante Formspree.');
      }
    }

    // 3. MODO DEMOSTRACIÓN (Cuando aún no has puesto tus claves de API)
    console.info('%c[EmailService] Simulación de Pedido Enviado:', 'color: #22c55e; font-weight: bold;');
    console.table({
      Cliente: templateParams.client_name,
      Email: templateParams.client_email,
      Sesion: templateParams.session_title,
      TotalFotos: templateParams.total_selected,
      Fecha: templateParams.sent_at
    });
    console.log('Lista de fotos seleccionadas:\n' + templateParams.photo_list);

    await new Promise((resolve) => setTimeout(resolve, 900));
    return {
      success: true,
      message: 'Modo demo: pedido simulado con éxito.'
    };
  }

  window.EmailService = {
    EMAIL_CONFIG,
    initEmailService,
    sendOrder
  };

})(window);
