/**
 * Sistema de Consentimiento de Cookies y Tratamiento de Datos
 * Cumple con RGPD - Incluye consentimiento para cookies y datos de formularios
 */

(function() {
    'use strict';
    
    const CONSENT_KEY = 'coraline_cookie_consent';
    const CONSENT_VERSION = '1.0';
    
    /**
     * Verifica si el usuario ya ha dado su consentimiento
     */
    function hasConsent() {
        try {
            const consent = localStorage.getItem(CONSENT_KEY);
            if (consent) {
                const consentData = JSON.parse(consent);
                return consentData.version === CONSENT_VERSION && consentData.accepted === true;
            }
        } catch (e) {
            console.error('Error al verificar consentimiento:', e);
        }
        return false;
    }
    
    /**
     * Guarda el consentimiento del usuario
     */
    function saveConsent(accepted) {
        try {
            const consentData = {
                accepted: accepted,
                version: CONSENT_VERSION,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
            
            // Disparar evento personalizado para que otros scripts sepan del consentimiento
            window.dispatchEvent(new CustomEvent('cookieConsentChanged', { 
                detail: { accepted: accepted } 
            }));
            
            return true;
        } catch (e) {
            console.error('Error al guardar consentimiento:', e);
            return false;
        }
    }
    
    /**
     * Muestra el banner de consentimiento
     */
    function showBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            // Pequeño delay para que la animación se vea suave
            setTimeout(() => {
                banner.classList.add('show');
            }, 500);
        }
    }
    
    /**
     * Oculta el banner de consentimiento
     */
    function hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.classList.add('hide');
            setTimeout(() => {
                banner.classList.remove('show', 'hide');
            }, 300);
        }
    }
    
    /**
     * Maneja la aceptación de cookies y consentimiento
     */
    function acceptConsent() {
        if (saveConsent(true)) {
            hideBanner();
            // Aquí podrías activar Google Analytics u otras cookies si las tienes
            console.log('Consentimiento aceptado - Cookies y tratamiento de datos autorizado');
        }
    }
    
    /**
     * Maneja el rechazo de cookies
     */
    function rejectConsent() {
        if (saveConsent(false)) {
            hideBanner();
            console.log('Consentimiento rechazado - Solo cookies esenciales');
        }
    }
    
    /**
     * Inicializa el sistema de consentimiento
     */
    function init() {
        // Si ya hay consentimiento, no hacer nada
        if (hasConsent()) {
            console.log('Usuario ya ha dado su consentimiento');
            return;
        }
        
        // Si no hay consentimiento, mostrar el banner
        showBanner();
        
        // Configurar eventos de los botones
        const acceptBtn = document.getElementById('cookie-accept-btn');
        const rejectBtn = document.getElementById('cookie-reject-btn');
        
        if (acceptBtn) {
            acceptBtn.addEventListener('click', acceptConsent);
        }
        
        if (rejectBtn) {
            rejectBtn.addEventListener('click', rejectConsent);
        }
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Exponer funciones públicas si es necesario
    window.CookieConsent = {
        hasConsent: hasConsent,
        accept: acceptConsent,
        reject: rejectConsent
    };
    
})();
