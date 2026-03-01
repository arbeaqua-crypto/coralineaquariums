// ============================================
// SISTEMA DE LOGGING CENTRALIZADO - FRONTEND
// Coraline Acuarios - Trazabilidad completa
// ============================================

/**
 * Sistema de logging que captura:
 * - Visitas a páginas
 * - Errores de JavaScript
 * - Comportamiento de usuarios (clics, navegación)
 * - Eventos del cotizador
 * - Tiempos de carga
 * - Flujo de navegación
 */

// Configuración del logger
const LOGGER_CONFIG = {
    // URL del backend para enviar logs
    backendURL: 'https://script.google.com/macros/s/AKfycbxAak1iknG-WeltAhbWbU9wCx9wYGEVgTLSPR9IlVYGQ-r2F5f6vAHIZHQnBheNNVAA/exec',
    
    // Enviar logs cada X eventos o cada Y segundos
    batchSize: 5,           // Enviar después de 5 eventos
    batchTimeout: 30000,    // O enviar después de 30 segundos
    
    // Activar/desactivar tipos de logs
    logPageViews: true,
    logClicks: true,
    logErrors: true,
    logNavigation: true,
    logPerformance: true,
    logForms: true,
    
    // Debug mode
    debug: true
};

// Cola de eventos pendientes de enviar
let eventQueue = [];
let batchTimer = null;
let sessionId = null;
let userId = null;

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Inicializa el sistema de logging
 */
function initLogger() {
    // Generar ID de sesión único
    sessionId = generateSessionId();
    
    // Obtener o generar ID de usuario (cookie persistente)
    userId = getUserId();
    
    // Registrar visita a la página
    if (LOGGER_CONFIG.logPageViews) {
        logPageView();
    }
    
    // Capturar errores de JavaScript
    if (LOGGER_CONFIG.logErrors) {
        setupErrorHandlers();
    }
    
    // Capturar clics en enlaces
    if (LOGGER_CONFIG.logClicks) {
        setupClickTracking();
    }
    
    // Capturar navegación
    if (LOGGER_CONFIG.logNavigation) {
        setupNavigationTracking();
    }
    
    // Capturar métricas de rendimiento
    if (LOGGER_CONFIG.logPerformance) {
        logPerformance();
    }
    
    // Enviar logs pendientes antes de cerrar la página
    window.addEventListener('beforeunload', flushLogs);
    
    // Debug
    if (LOGGER_CONFIG.debug) {
        console.log('🔍 Logger inicializado - Sesión:', sessionId);
    }
}

// ============================================
// FUNCIONES DE CAPTURA DE EVENTOS
// ============================================

/**
 * Registra visita a una página
 */
function logPageView() {
    const pageData = {
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer || 'directo',
        title: document.title,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        language: navigator.language,
        userAgent: navigator.userAgent
    };
    
    addLog('visita', pageData);
}

/**
 * Registra métricas de rendimiento
 */
function logPerformance() {
    // Esperar a que se cargue completamente
    window.addEventListener('load', function() {
        setTimeout(function() {
            const perfData = window.performance.timing;
            const loadTime = perfData.loadEventEnd - perfData.navigationStart;
            const domReady = perfData.domContentLoadedEventEnd - perfData.navigationStart;
            
            addLog('rendimiento', {
                url: window.location.href,
                tiempoCargaTotal: loadTime,
                tiempoDomReady: domReady,
                tiempoDNS: perfData.domainLookupEnd - perfData.domainLookupStart,
                tiempoConexion: perfData.connectEnd - perfData.connectStart,
                tiempoRespuesta: perfData.responseEnd - perfData.requestStart
            });
        }, 0);
    });
}

/**
 * Captura errores de JavaScript
 */
function setupErrorHandlers() {
    // Errores globales
    window.addEventListener('error', function(event) {
        addLog('error_js', {
            mensaje: event.message,
            archivo: event.filename,
            linea: event.lineno,
            columna: event.colno,
            error: event.error ? event.error.stack : null,
            url: window.location.href
        });
    });
    
    // Errores de promesas no capturadas
    window.addEventListener('unhandledrejection', function(event) {
        addLog('error_promesa', {
            mensaje: event.reason,
            url: window.location.href
        });
    });
}

/**
 * Captura clics en enlaces y botones
 */
function setupClickTracking() {
    document.addEventListener('click', function(event) {
        const element = event.target;
        
        // Capturar clics en enlaces
        if (element.tagName === 'A' || element.closest('a')) {
            const link = element.tagName === 'A' ? element : element.closest('a');
            addLog('clic_enlace', {
                texto: link.textContent.trim(),
                href: link.href,
                target: link.target,
                claseCSS: link.className,
                paginaActual: window.location.href
            });
        }
        
        // Capturar clics en botones
        if (element.tagName === 'BUTTON' || element.closest('button')) {
            const button = element.tagName === 'BUTTON' ? element : element.closest('button');
            addLog('clic_boton', {
                texto: button.textContent.trim(),
                id: button.id,
                claseCSS: button.className,
                paginaActual: window.location.href
            });
        }
    });
}

/**
 * Captura cambio de idioma
 */
function setupNavigationTracking() {
    // Detectar cambios de idioma
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            addLog('cambio_idioma', {
                idioma: this.dataset.lang,
                paginaActual: window.location.href
            });
        });
    });
}

// ============================================
// FUNCIONES ESPECÍFICAS DE COTIZADOR
// ============================================

/**
 * Registra inicio de cotización
 */
function logCotizacionInicio(datos) {
    addLog('cotizacion_inicio', {
        largo: datos.largo,
        ancho: datos.ancho,
        alto: datos.alto,
        grosor: datos.grosor,
        perimetrales: datos.perimetrales,
        tirantes: datos.tirantes
    });
}

/**
 * Registra resultado de cotización
 */
function logCotizacionResultado(resultado) {
    addLog('cotizacion_resultado', {
        precio: resultado.precio,
        litros: resultado.litros,
        grosor: resultado.medidas?.grosor,
        refuerzos: resultado.refuerzos,
        opticos: resultado.opticos,
        advertencias: resultado.advertencias
    });
}

/**
 * Registra selección de ópticos
 */
function logSeleccionOpticos(opticos) {
    addLog('cotizacion_opticos', {
        frontal: opticos.frontal,
        trasera: opticos.trasera,
        lateralIzq: opticos.lateralIzq,
        lateralDer: opticos.lateralDer,
        precioExtra: opticos.precioExtra
    });
}

/**
 * Registra envío de formulario de presupuesto
 */
function logFormularioPresupuesto(datos) {
    addLog('formulario_presupuesto', {
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono,
        tieneCotizacion: !!datos.cotizacion,
        precio: datos.cotizacion?.precio
    });
}

/**
 * Registra error al enviar email
 */
function logErrorEmail(error, contexto) {
    addLog('error_email', {
        mensaje: error.message || error,
        contexto: contexto,
        url: window.location.href
    });
}

// ============================================
// GESTIÓN DE LA COLA DE EVENTOS
// ============================================

/**
 * Añade un log a la cola
 */
function addLog(tipo, datos) {
    const logEntry = {
        sessionId: sessionId,
        userId: userId,
        timestamp: new Date().toISOString(),
        tipo: tipo,
        datos: datos,
        url: window.location.href,
        userAgent: navigator.userAgent
    };
    
    eventQueue.push(logEntry);
    
    if (LOGGER_CONFIG.debug) {
        console.log('📝 Log capturado:', tipo, datos);
    }
    
    // Programar envío por lote
    scheduleBatchSend();
    
    // Si alcanzamos el tamaño del lote, enviar inmediatamente
    if (eventQueue.length >= LOGGER_CONFIG.batchSize) {
        flushLogs();
    }
}

/**
 * Programa el envío por lotes
 */
function scheduleBatchSend() {
    if (batchTimer) {
        clearTimeout(batchTimer);
    }
    
    batchTimer = setTimeout(flushLogs, LOGGER_CONFIG.batchTimeout);
}

/**
 * Envía todos los logs pendientes al backend
 */
function flushLogs() {
    if (eventQueue.length === 0) {
        return;
    }
    
    const logsToSend = [...eventQueue];
    eventQueue = [];
    
    if (batchTimer) {
        clearTimeout(batchTimer);
        batchTimer = null;
    }
    
    if (LOGGER_CONFIG.debug) {
        console.log('📤 Enviando', logsToSend.length, 'logs al servidor...');
    }
    
    // Enviar usando fetch con keepalive para que funcione en beforeunload
    const payload = {
        accion: 'registrar_logs',
        logs: logsToSend
    };
    
    // Usar sendBeacon si está disponible (más confiable en beforeunload)
    if (navigator.sendBeacon && event && event.type === 'beforeunload') {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(LOGGER_CONFIG.backendURL, blob);
    } else {
        // Usar fetch normal
        fetch(LOGGER_CONFIG.backendURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify(payload),
            keepalive: true
        }).then(response => {
            if (LOGGER_CONFIG.debug) {
                console.log('✅ Logs enviados correctamente');
            }
        }).catch(error => {
            if (LOGGER_CONFIG.debug) {
                console.error('❌ Error al enviar logs:', error);
            }
            // Volver a añadir a la cola si falla
            eventQueue.push(...logsToSend);
        });
    }
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Genera un ID único de sesión
 */
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Obtiene o genera un ID de usuario persistente
 */
function getUserId() {
    let uid = getCookie('coraline_uid');
    
    if (!uid) {
        uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        setCookie('coraline_uid', uid, 365); // Cookie de 1 año
    }
    
    return uid;
}

/**
 * Obtiene una cookie
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

/**
 * Establece una cookie
 */
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// ============================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogger);
} else {
    initLogger();
}

// Exportar funciones públicas
window.Logger = {
    logCotizacionInicio,
    logCotizacionResultado,
    logSeleccionOpticos,
    logFormularioPresupuesto,
    logErrorEmail,
    addLog,
    flushLogs
};
