// ============================================
// CALCULADORA DE ACUARIOS - GOOGLE APPS SCRIPT
// Lee valores calculados directamente de Excel
// Coraline Acuarios
// ============================================

/**
 * CONFIGURACIÓN:
 * - ID de tu hoja de Google Sheets
 * - Los datos están en columna B
 * - La calculadora hace TODOS los cálculos, solo leemos resultados
 */

// ID DE TU GOOGLE SHEETS
const SPREADSHEET_ID = '13pfIOb2zUFC4tevEEzaF2RmHvmTw4T89UNmR-Omm4Ao';

// CONFIGURACIÓN DE EMAIL
const EMAIL_DESTINO = 'info@coralineaquariums.com'; // Email de Coraline Aquariums

// ============== CONFIGURACIÓN DE SEGURIDAD ==============

// TOKEN SECRETO: Cambia este valor por uno generado aleatoriamente
// Genera uno nuevo en: https://www.random.org/strings/?num=1&len=32&digits=on&upperalpha=on&loweralpha=on
// O ejecuta la función 'generarTokenSeguridad()' desde el editor de Apps Script
const TOKEN_AUTORIZACION = 'oIw0QuTPH5EnBq4FPGDnQyZ0rw4LcP3y';

// DOMINIOS PERMITIDOS (solo estos dominios podrán hacer peticiones)
const DOMINIOS_PERMITIDOS = [
  'https://coralineaquariums.com',
  'https://www.coralineaquariums.com',
  'http://localhost:8080', // Para desarrollo local
  'http://127.0.0.1:8080'  // Para desarrollo local
];

// Activar/desactivar validaciones de seguridad
const VALIDAR_ORIGEN = true;  // true = solo permite peticiones desde dominios autorizados
const VALIDAR_TOKEN = true;   // true = requiere token en todas las peticiones

// Mapeo de celdas en columna B (Hoja1)
const CELDAS = {
  // INPUTS (donde escribimos los datos del usuario)
  LARGO: 'B1',
  ANCHO: 'B2',
  ALTO: 'B3',
  GROSOR: 'B4',
  PERIMETRAL: 'B5',
  TIRANTE: 'B6',
  OPTICO_FRONTAL: 'B9',
  OPTICO_TRASERA: 'B10',
  OPTICO_LATERAL_IZQ: 'B11',
  OPTICO_LATERAL_DER: 'B12',
  
  // OUTPUTS (donde leemos los resultados calculados por Excel)
  
  PRECIO_OPTICO_FRONTAL_O_TRASERO:  'B7',
  PRECIO_OPTICO_LATERAL:  'B8',
  RATIO_SEGURIDAD: 'B15',
  DEFLEXION: 'B16',
  PVPR: 'B17',
  LITROS: 'B18',
  CODIGO_PELIGRO: 'B31'
};

// ============== FUNCIÓN PRINCIPAL ==============

/**
 * Procesa solicitudes HTTP GET (para pruebas desde navegador)
 */
function doGet(e) {
  return ContentService.createTextOutput(
    'Sistema de cotización de acuarios activo. Usa POST para calcular.'
  ).setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Procesa solicitudes OPTIONS (preflight CORS)
 * Google Apps Script agrega headers CORS automáticamente si devolvemos una respuesta
 */
function doOptions(e) {
  return ContentService.createTextOutput('');
}

/**
 * Procesa solicitudes HTTP POST (desde el frontend)
 */
function doPost(e) {
  try {
    // ========== VALIDACIONES DE SEGURIDAD ==========
    
    // 1. Validar origen (CORS)
    if (VALIDAR_ORIGEN) {
      const origen = e.parameter.origin || e.parameters.origin;
      if (origen && !esOrigenPermitido(origen)) {
        registrarLog('acceso_denegado', {
          razon: 'Origen no autorizado',
          origen: origen,
          timestamp: new Date().toISOString()
        });
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Acceso denegado: origen no autorizado'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Parsear los datos recibidos
    const datos = JSON.parse(e.postData.contents);
    
    // 2. Validar token de autorización
    if (VALIDAR_TOKEN) {
      if (!datos.token || datos.token !== TOKEN_AUTORIZACION) {
        registrarLog('acceso_denegado', {
          razon: 'Token inválido o ausente',
          timestamp: new Date().toISOString()
        });
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Acceso denegado: token inválido'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Detectar si es solicitud de logs del frontend
    if (datos.accion === 'registrar_logs') {
      return procesarLogsDelFrontend(datos.logs);
    }
    
    // Detectar si es solicitud de contacto o cotización
    if (datos.accion === 'enviar_presupuesto') {
      // Registrar en log que llegó una solicitud de presupuesto
      registrarLog('formulario', {
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono,
        timestamp: new Date().toISOString()
      });
      
      return procesarSolicitudPresupuesto(datos);
    }

    // Notificación interna cuando el usuario descarga el PDF (sin formulario de contacto)
    if (datos.accion === 'notificacion_descarga_pdf') {
      return procesarNotificacionDescargaPDF(datos);
    }
    
    // Si no tiene accion, es una solicitud de cotización (comportamiento por defecto)
    // Validar datos requeridos
    if (!datos.largo || !datos.ancho || !datos.alto || !datos.grosor) {
      throw new Error('Faltan datos obligatorios: largo, ancho, alto, grosor');
    }
    
    // Calcular usando Excel
    const resultado = calcularConExcel(datos);
    
    // Registrar consulta en el log
    registrarLog('consulta', {
      largo: datos.largo,
      ancho: datos.ancho,
      alto: datos.alto,
      grosor: resultado.medidas.grosor,
      litros: resultado.litros,
      precio: resultado.precio,
      refuerzos: resultado.refuerzos,
      opticos: resultado.opticos,
      timestamp: new Date().toISOString()
    });
    
    // Devolver respuesta JSON
    return ContentService
      .createTextOutput(JSON.stringify(resultado))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Registrar error en el log
    registrarLog('error', {
      contexto: 'doPost',
      mensaje: error.toString(),
      timestamp: new Date().toISOString()
    });
    
    // Manejo de errores
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        message: 'Error al procesar la solicitud'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============== FUNCIÓN DE CÁLCULO CON EXCEL ==============

/**
 * Escribe datos en Excel, espera cálculo, lee resultados
 */
function calcularConExcel(datos) {
  try {
    // Abrir la hoja de cálculo
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName('Hoja1');
    
    if (!hoja) {
      throw new Error('No se encontró la hoja "Hoja1"');
    }
    
    // ========== PASO 1: ESCRIBIR INPUTS ==========
    
    // Convertir medidas de cm a valores
    const largo = parseFloat(datos.largo);
    const ancho = parseFloat(datos.ancho);
    const alto = parseFloat(datos.alto);
    const codigoGrosor = parseInt(datos.grosor);
    
    // Escribir dimensiones básicas
    hoja.getRange(CELDAS.LARGO).setValue(largo);
    hoja.getRange(CELDAS.ANCHO).setValue(ancho);
    hoja.getRange(CELDAS.ALTO).setValue(alto);
    hoja.getRange(CELDAS.GROSOR).setValue(codigoGrosor);
    
    // Escribir refuerzos (0 o 1)
    const perimetral = datos.perimetrales ? 1 : 0;
    const tirante = datos.tirantes ? 1 : 0;
    hoja.getRange(CELDAS.PERIMETRAL).setValue(perimetral);
    hoja.getRange(CELDAS.TIRANTE).setValue(tirante);
    
    // Escribir cristales ópticos (0 o 1 cada uno)
    const opticoFrontal = datos.opticoFrontal ? 1 : 0;
    const opticoTrasera = datos.opticoTrasera ? 1 : 0;
    const opticoLateralIzq = datos.opticoLateralIzq ? 1 : 0;
    const opticoLateralDer = datos.opticoLateralDer ? 1 : 0;
    
    hoja.getRange(CELDAS.OPTICO_FRONTAL).setValue(opticoFrontal);
    hoja.getRange(CELDAS.OPTICO_TRASERA).setValue(opticoTrasera);
    hoja.getRange(CELDAS.OPTICO_LATERAL_IZQ).setValue(opticoLateralIzq);
    hoja.getRange(CELDAS.OPTICO_LATERAL_DER).setValue(opticoLateralDer);
    
    // Forzar recalculo de la hoja
    SpreadsheetApp.flush();
    
    // Pequeña pausa para asegurar que Excel termine los cálculos
    Utilities.sleep(500);
    
    // ========== PASO 2: LEER OUTPUTS ==========
    
    // Leer valores calculados por la calculadora
    const ratioSeguridad = parseFloat(hoja.getRange(CELDAS.RATIO_SEGURIDAD).getValue());
    const deflexion = parseFloat(hoja.getRange(CELDAS.DEFLEXION).getValue());
    const litros = parseFloat(hoja.getRange(CELDAS.LITROS).getValue());
    
    // B17 contiene el PRECIO FINAL con TODO incluido (ópticos, refuerzos, etc.)
    const precioFinal = parseFloat(hoja.getRange(CELDAS.PVPR).getValue());
    
    // Leer precios individuales de ópticos (solo para mostrar las opciones)
    const precioOpticoFrontalTrasero = parseFloat(hoja.getRange(CELDAS.PRECIO_OPTICO_FRONTAL_O_TRASERO).getValue());
    const precioOpticoLateral = parseFloat(hoja.getRange(CELDAS.PRECIO_OPTICO_LATERAL).getValue());
    
    // ========== PASO 3: DETERMINAR WARNINGS ==========
    
    const warnings = [];
    
    // Aviso si ratio de seguridad < 4
    if (ratioSeguridad < 4) {
      warnings.push({
        tipo: 'ratio',
        mensaje: '⚠️ RATIO DE SEGURIDAD BAJO',
        detalle: 'La configuración actual da como resultado un ratio de seguridad más bajo de lo recomendado. Para evitar una construcción débil, puedes aumentar el grosor de cristal o añadir refuerzos perimetrales y tirantes.'
      });
    }
    
    // Aviso si deflexión > 10%
    if (deflexion > 10) {
      warnings.push({
        tipo: 'deflexion',
        mensaje: '⚠️ GROSOR INSUFICIENTE PARA LA ALTURA',
        detalle: 'El grosor de las láminas de esta configuración es bajo para la altura y la fuerza del agua, pudiendo ocasionar deformación en el cristal. Recomendamos aumentar el grosor general del acuario o bien bajar la altura de este para evitarlo.'
      });
    }
    
    // ========== PASO 4: MAPEO DE GROSORES ==========
    
    // Mapeo de códigos a grosores reales (solo para mostrar)
    const grosorMap = {
      1: '6mm',
      2: '8mm',
      3: '10mm',
      4: '12mm',
      5: '15mm',
      6: '19mm',
      7: '20mm laminado (10+10)'
    };
    
    // ========== PASO 5: CONSTRUIR RESPUESTA ==========
    
    const respuesta = {
      success: true,
      
      // Datos básicos
      medidas: {
        largo: largo,
        ancho: ancho,
        alto: alto,
        grosor: grosorMap[codigoGrosor]
      },
      
      // Resultados principales
      litros: Math.round(litros),
      ratioSeguridad: parseFloat(ratioSeguridad.toFixed(2)),
      deflexion: parseFloat(deflexion.toFixed(2)),
      
      // PRECIO FINAL de B17 (ya incluye TODO: ópticos, refuerzos, etc.)
      precio: parseFloat(precioFinal.toFixed(2)),
      
      // Precios individuales de ópticos (solo para mostrar opciones al usuario)
      precioOpticoFrontalTrasero: parseFloat(precioOpticoFrontalTrasero.toFixed(2)),
      precioOpticoLateral: parseFloat(precioOpticoLateral.toFixed(2)),
      
      // Refuerzos aplicados (informativo)
      refuerzos: {
        perimetrales: perimetral === 1,
        tirantes: tirante === 1
      },
      
      // Cristales ópticos aplicados (informativo)
      opticos: {
        frontal: opticoFrontal === 1,
        trasera: opticoTrasera === 1,
        lateralIzq: opticoLateralIzq === 1,
        lateralDer: opticoLateralDer === 1
      },
      
      // Warnings de seguridad
      warnings: warnings,
      
      // Flags de seguridad
      esSeguro: warnings.length === 0
    };
    
    return respuesta;
    
  } catch (error) {
    throw new Error('Error en cálculo Excel: ' + error.toString());
  }
}

// ============== FUNCIONES DE UTILIDAD ==============

/**
 * Función de prueba para verificar que todo funciona
 * Ejecuta esto desde el editor de Apps Script para probar
 */
function testCalcular() {
  const datosPrueba = {
    largo: 100,
    ancho: 50,
    alto: 90,
    grosor: 4, // 12mm
    perimetrales: true,
    tirantes: true,
    opticoFrontal: false,
    opticoTrasera: false,
    opticoLateralIzq: false,
    opticoLateralDer: false
  };
  
  const resultado = calcularConExcel(datosPrueba);
  Logger.log('Resultado de prueba:');
  Logger.log(JSON.stringify(resultado, null, 2));
  
  // Verificar que coincide con Excel
  Logger.log('\n=== VERIFICACIÓN ===');
  Logger.log('Ratio seguridad: ' + resultado.ratioSeguridad + ' (debe ser ~3.96)');
  Logger.log('Deflexión: ' + resultado.deflexion + '% (debe ser ~34.17%)');
  Logger.log('PVPR: ' + resultado.precio + '€ (debe ser ~794.08€)');
  Logger.log('Litros: ' + resultado.litros + ' (debe ser 450)');
}

/**
 * Función para configurar el ID de la hoja de cálculo
 * Copia el ID de tu Google Sheets y pégalo en SPREADSHEET_ID arriba
 */
function obtenerIdHoja() {
  Logger.log('URL de esta hoja: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
  Logger.log('ID de esta hoja: ' + SpreadsheetApp.getActiveSpreadsheet().getId());
}

// ============================================
// FUNCIONES DE SEGURIDAD
// ============================================

/**
 * Genera un token de seguridad aleatorio de 32 caracteres
 * EJECUTA ESTA FUNCIÓN una vez para obtener tu token único
 */
function generarTokenSeguridad() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < 32; i++) {
    token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  
  Logger.log('');
  Logger.log('=================================');
  Logger.log('🔐 TOKEN DE SEGURIDAD GENERADO');
  Logger.log('=================================');
  Logger.log('');
  Logger.log('Copia este token y pégalo en:');
  Logger.log('1. Variable TOKEN_AUTORIZACION en este script (línea ~21)');
  Logger.log('2. En tu archivo cotizador.js (donde haces las peticiones)');
  Logger.log('');
  Logger.log('TOKEN:');
  Logger.log(token);
  Logger.log('');
  Logger.log('⚠️ IMPORTANTE: Mantén este token en secreto');
  Logger.log('⚠️ No lo compartas en GitHub ni lo hagas público');
  Logger.log('');
  
  return token;
}

/**
 * Verifica si un origen está en la lista de dominios permitidos
 */
function esOrigenPermitido(origen) {
  // Normalizar origen (quitar barra final si existe)
  const origenNormalizado = origen.replace(/\/$/, '');
  
  // Verificar si está en la lista
  for (let i = 0; i < DOMINIOS_PERMITIDOS.length; i++) {
    if (DOMINIOS_PERMITIDOS[i] === origenNormalizado) {
      return true;
    }
  }
  
  return false;
}

/**
 * Lee los últimos N registros de los logs
 * SOLO EJECUTABLE DESDE EL EDITOR DE APPS SCRIPT (no desde web)
 * Esto te permite consultar los logs de forma segura
 */
function leerLogs(cantidad) {
  cantidad = cantidad || 50; // Por defecto, últimas 50 entradas
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hojaLog = ss.getSheetByName('LOG');
    
    if (!hojaLog) {
      Logger.log('❌ La hoja LOG no existe. Ejecuta inicializarSistemaLogging() primero.');
      return;
    }
    
    const ultimaFila = hojaLog.getLastRow();
    const primeraFila = Math.max(2, ultimaFila - cantidad + 1); // Saltar encabezado
    
    if (ultimaFila < 2) {
      Logger.log('ℹ️ No hay logs registrados todavía.');
      return;
    }
    
    const rango = hojaLog.getRange(primeraFila, 1, ultimaFila - primeraFila + 1, 4);
    const valores = rango.getValues();
    
    Logger.log('');
    Logger.log('=================================');
    Logger.log(`📊 ÚLTIMOS ${valores.length} LOGS`);
    Logger.log('=================================');
    Logger.log('');
    
    valores.forEach(function(fila, index) {
      Logger.log(`[${index + 1}] ${fila[0]} | ${fila[1]} | ${fila[2]}`);
    });
    
    Logger.log('');
    Logger.log('Para ver más detalles, abre la hoja LOG en Google Sheets.');
    Logger.log('');
    
  } catch (error) {
    Logger.log('❌ Error al leer logs: ' + error.toString());
  }
}

/**
 * Lee los últimos registros de solicitudes de presupuesto
 * SOLO EJECUTABLE DESDE EL EDITOR DE APPS SCRIPT
 */
function leerSolicitudes(cantidad) {
  cantidad = cantidad || 20; // Por defecto, últimas 20 solicitudes
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hojaSolicitudes = ss.getSheetByName('Solicitudes');
    
    if (!hojaSolicitudes) {
      Logger.log('❌ La hoja Solicitudes no existe. Ejecuta inicializarSistemaLogging() primero.');
      return;
    }
    
    const ultimaFila = hojaSolicitudes.getLastRow();
    const primeraFila = Math.max(2, ultimaFila - cantidad + 1);
    
    if (ultimaFila < 2) {
      Logger.log('ℹ️ No hay solicitudes registradas todavía.');
      return;
    }
    
    const rango = hojaSolicitudes.getRange(primeraFila, 1, ultimaFila - primeraFila + 1, 11);
    const valores = rango.getValues();
    
    Logger.log('');
    Logger.log('=================================');
    Logger.log(`📋 ÚLTIMAS ${valores.length} SOLICITUDES`);
    Logger.log('=================================');
    Logger.log('');
    
    valores.forEach(function(fila, index) {
      Logger.log(`[${index + 1}] ${fila[0]}`);
      Logger.log(`    👤 ${fila[1]} ${fila[2]}`);
      Logger.log(`    📧 ${fila[3]}`);
      Logger.log(`    📱 ${fila[4]}`);
      Logger.log(`    📐 ${fila[6]} | ${fila[7]} | ${fila[9]}`);
      Logger.log('');
    });
    
    Logger.log('Para ver más detalles, abre la hoja Solicitudes en Google Sheets.');
    Logger.log('');
    
  } catch (error) {
    Logger.log('❌ Error al leer solicitudes: ' + error.toString());
  }
}

/**
 * Función para inicializar el sistema de logging
 * Crea las hojas LOG, LOG_FRONTEND y Solicitudes si no existen
 * EJECUTA ESTA FUNCIÓN UNA VEZ para preparar el sistema
 */
function inicializarSistemaLogging() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Crear hoja LOG
  let hojaLog = ss.getSheetByName('LOG');
  if (!hojaLog) {
    hojaLog = ss.insertSheet('LOG');
    hojaLog.appendRow(['Fecha', 'Tipo', 'Resumen', 'Datos Completos']);
    hojaLog.getRange('A1:D1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
    hojaLog.setFrozenRows(1);
    hojaLog.setColumnWidth(1, 150);
    hojaLog.setColumnWidth(2, 120);
    hojaLog.setColumnWidth(3, 300);
    hojaLog.setColumnWidth(4, 400);
    Logger.log('✅ Hoja LOG creada');
  } else {
    Logger.log('ℹ️ Hoja LOG ya existe');
  }
  
  // Crear hoja LOG_FRONTEND
  let hojaLogFrontend = ss.getSheetByName('LOG_FRONTEND');
  if (!hojaLogFrontend) {
    hojaLogFrontend = ss.insertSheet('LOG_FRONTEND');
    hojaLogFrontend.appendRow([
      'Timestamp',
      'Session ID',
      'User ID',
      'Tipo',
      'URL',
      'Resumen',
      'Datos Completos',
      'User Agent'
    ]);
    hojaLogFrontend.getRange('A1:H1').setFontWeight('bold').setBackground('#34a853').setFontColor('white');
    hojaLogFrontend.setFrozenRows(1);
    hojaLogFrontend.setColumnWidth(1, 150);
    hojaLogFrontend.setColumnWidth(2, 180);
    hojaLogFrontend.setColumnWidth(3, 180);
    hojaLogFrontend.setColumnWidth(4, 120);
    hojaLogFrontend.setColumnWidth(5, 250);
    hojaLogFrontend.setColumnWidth(6, 300);
    hojaLogFrontend.setColumnWidth(7, 400);
    hojaLogFrontend.setColumnWidth(8, 300);
    Logger.log('✅ Hoja LOG_FRONTEND creada');
  } else {
    Logger.log('ℹ️ Hoja LOG_FRONTEND ya existe');
  }
  
  // Crear hoja Solicitudes
  let hojaSolicitudes = ss.getSheetByName('Solicitudes');
  if (!hojaSolicitudes) {
    hojaSolicitudes = ss.insertSheet('Solicitudes');
    hojaSolicitudes.getRange('A1:K1').setValues([[
      'Fecha', 'Nombre', 'Apellidos', 'Email', 'Teléfono', 'Medio Contacto',
      'Dimensiones', 'Grosor', 'Litros', 'Precio', 'Mensaje'
    ]]);
    hojaSolicitudes.getRange('A1:K1').setFontWeight('bold').setBackground('#fbbc04').setFontColor('white');
    hojaSolicitudes.setFrozenRows(1);
    Logger.log('✅ Hoja Solicitudes creada');
  } else {
    Logger.log('ℹ️ Hoja Solicitudes ya existe');
  }
  
  // Agregar un log de prueba
  hojaLog.appendRow([
    new Date(),
    'sistema',
    'Sistema de logging inicializado correctamente',
    JSON.stringify({
      mensaje: 'El sistema de logging está funcionando',
      hojas_creadas: {
        LOG: true,
        LOG_FRONTEND: true,
        Solicitudes: true
      }
    })
  ]);
  
  Logger.log('');
  Logger.log('=================================');
  Logger.log('✅ SISTEMA DE LOGGING INICIALIZADO');
  Logger.log('=================================');
  Logger.log('Ve a tu Google Sheets y verás 3 hojas nuevas:');
  Logger.log('  📊 LOG - Logs del servidor');
  Logger.log('  🌐 LOG_FRONTEND - Logs del navegador');
  Logger.log('  📋 Solicitudes - Solicitudes de presupuesto');
  Logger.log('');
  
  return {
    success: true,
    message: 'Sistema de logging inicializado correctamente'
  };
}

// ============================================
// SISTEMA DE ENVÍO DE PRESUPUESTOS POR EMAIL
// ============================================

/**
 * Procesa notificación interna cuando el usuario descarga el PDF sin dejar datos de contacto
 * Solo envía email a Coraline con la configuración y el historial de la sesión
 */
function procesarNotificacionDescargaPDF(datos) {
  try {
    registrarLog('descarga_pdf', {
      configuracion: datos.configuracion,
      codigoRecuperacion: datos.codigoRecuperacion,
      sessionId: datos.sessionId,
      timestamp: new Date().toISOString()
    });

    const config = datos.configuracion || {};
    const asunto = '\uD83D\uDCE5 Descarga PDF - ' + (config.medidas ? (config.medidas.largo + 'x' + config.medidas.ancho + 'x' + config.medidas.alto + 'cm') : 'sin medidas') + ' - ' + (config.precioFinal ? config.precioFinal.toFixed(2) + '\u20ac' : '');

    let desgloseHtml = '';
    if (datos.desglose && datos.desglose.lineas) {
      desgloseHtml = '<table style="width:100%;border-collapse:collapse;">';
      datos.desglose.lineas.forEach(function(l) {
        const bg = l.tipo === 'total' ? '#f0f4ff' : 'white';
        const fw = l.tipo === 'total' ? 'bold' : 'normal';
        const pad = l.tipo === 'subitem' ? '20px' : '0';
        desgloseHtml += '<tr style="background:' + bg + ';">';
        desgloseHtml += '<td style="padding:6px 10px;border:1px solid #ddd;padding-left:' + pad + ';font-weight:' + fw + ';">' + l.nombre + '</td>';
        desgloseHtml += '<td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:' + fw + ';">' + l.precio.toFixed(2) + ' €</td>';
        desgloseHtml += '</tr>';
      });
      desgloseHtml += '</table>';
    }

    let historialHtml = '';
    if (datos.historialCotizaciones && datos.historialCotizaciones.length > 0) {
      historialHtml = '<h4>Historial de consultas en esta sesión (' + datos.historialCotizaciones.length + ')</h4><ul>';
      datos.historialCotizaciones.forEach(function(c) {
        if (c.datos) historialHtml += '<li>' + (c.datos.largo||'?') + 'x' + (c.datos.ancho||'?') + 'x' + (c.datos.alto||'?') + ' cm — ' + (c.resultado && c.resultado.precio ? c.resultado.precio.toFixed(2) + '€' : '') + '</li>';
      });
      historialHtml += '</ul>';
    }

    const htmlBody = '<div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;">' +
      '<div style="background:#667eea;padding:20px;"><h2 style="color:white;margin:0;">\uD83D\uDCE5 Notificación: Usuario descargó PDF</h2></div>' +
      '<div style="padding:20px;background:#f9f9f9;">' +
      '<p><strong>Código de recuperación:</strong> <code>' + (datos.codigoRecuperacion || 'No generado') + '</code></p>' +
      '<h3>Configuración del acuario</h3>' +
      (config.medidas ? '<p>Medidas: ' + config.medidas.largo + ' x ' + config.medidas.ancho + ' x ' + config.medidas.alto + ' cm — Grosor: ' + config.medidas.grosor + ' — ' + config.litros + ' litros</p>' : '') +
      '<p>Precio final: <strong>' + (config.precioFinal ? config.precioFinal.toFixed(2) + ' €' : 'N/D') + '</strong></p>' +
      '<h3>Desglose</h3>' + desgloseHtml +
      historialHtml +
      '</div></div>';

    MailApp.sendEmail({
      to: EMAIL_DESTINO,
      subject: asunto,
      htmlBody: htmlBody,
      name: 'Cotizador Coraline Aquariums'
    });

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Notificación enviada a Coraline' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error en procesarNotificacionDescargaPDF: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Procesa solicitud de presupuesto desde el formulario de contacto
 */
function procesarSolicitudPresupuesto(datos) {
  try {
    // Log: Registrar todos los datos recibidos para depuración
    registrarLog('formulario_completo', {
      datos_recibidos: datos,
      timestamp: new Date().toISOString()
    });
    
    // Validar datos obligatorios
    if (!datos.nombre || !datos.email) {
      throw new Error('Faltan datos obligatorios: nombre y email');
    }
    
    // Guardar en Google Sheets
    guardarSolicitudEnSheet(datos);
    
    // Enviar email a Coraline
    enviarEmailCoraline(datos);
    
    // Registrar éxito en el log
    registrarLog('presupuesto_enviado', {
      nombre: datos.nombre,
      email: datos.email,
      exito: true,
      timestamp: new Date().toISOString()
    });
    
    // Respuesta exitosa
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Solicitud enviada correctamente'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Registrar error detallado
    registrarLog('error', {
      contexto: 'procesarSolicitudPresupuesto',
      mensaje: error.toString(),
      datos_recibidos: datos,
      timestamp: new Date().toISOString()
    });
    
    Logger.log('Error al procesar solicitud: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        message: 'Error al enviar la solicitud'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Envía email al cliente con el PDF adjunto y mensaje de confirmación
 */
function enviarEmailCliente(datos) {
  try {
    const nombre = datos.nombre || 'Cliente';
    const asunto = 'Tu presupuesto de Coraline Aquariums';
    
    let htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: #667eea; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">¡Gracias por usar nuestro cotizador!</h2>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Gracias por confiar en <strong>Coraline Aquariums</strong> para tu proyecto de acuario a medida.</p>
          <p>Adjunto encontrarás el PDF con tu última cotización realizada (${datos.configuracion.largo} x ${datos.configuracion.ancho} x ${datos.configuracion.alto} cm, ${datos.configuracion.litros} litros, ${datos.configuracion.precio.toFixed(2)}€).</p>
          <p>Si tienes cualquier duda o necesitas cambios en la configuración, no dudes en contactarnos.</p>
          <p style="margin-top: 30px;">
            <strong>Contacto:</strong><br>
            📧 info@coralineaquariums.com<br>
            📱 +34 937 04 44 95
          </p>
        </div>
      </div>
    `;
    
    if (datos.pdfBase64) {
      const pdfBlob = Utilities.newBlob(Utilities.base64Decode(datos.pdfBase64), 'application/pdf', 'presupuesto.pdf');
      MailApp.sendEmail({
        to: datos.email,
        subject: asunto,
        htmlBody: htmlBody,
        attachments: [pdfBlob],
        name: 'Coraline Aquariums',
        replyTo: 'info@coralineaquariums.com'
      });
    }
    
  } catch (error) {
    Logger.log('Error al enviar email al cliente: ' + error.toString());
    throw error;
  }
}

/**
 * Envía email con la solicitud completa a Coraline Acuarios
 * Incluye el desglose de la configuración final y anteriores
 */
function enviarEmailCoraline(datos) {
  try {
  const asunto = `🐠 Nueva Solicitud de Presupuesto - ${datos.nombre} ${datos.apellidos}`;
  
  let htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <div style="background: #667eea; padding: 20px;">
        <h2 style="color: white; margin: 0;">Nueva Solicitud de Presupuesto</h2>
      </div>
      
      <div style="padding: 20px; background: #f9f9f9;">
        <h3 style="color: #333;">Datos del Cliente</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: white;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Nombre:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${datos.nombre} ${datos.apellidos}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${datos.email}</td>
          </tr>
          <tr style="background: white;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Medio de contacto:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${datos.medioContacto || 'No especificado'}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Teléfono:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${datos.telefono || 'No proporcionado'}</td>
          </tr>
        </table>
  `;
  
  // Mensaje del cliente
  if (datos.mensaje) {
    htmlBody += `
        <h3 style="color: #333; margin-top: 30px;">Mensaje del Cliente</h3>
        <div style="background: white; padding: 15px; border-left: 4px solid #667eea;">
          <p style="color: #666; white-space: pre-wrap;">${datos.mensaje}</p>
        </div>
    `;
  }
  
  // Configuración solicitada
  if (datos.configuracion && datos.configuracion.largo) {
    const config = datos.configuracion;
    htmlBody += `
        <h3 style="color: #333; margin-top: 30px;">Configuración Solicitada</h3>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Dimensiones:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${config.largo} x ${config.ancho} x ${config.alto} cm</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Grosor:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${config.grosor}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Capacidad:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${config.litros} litros</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Precio estimado:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>${config.precio.toFixed(2)}€</strong> (IVA incluido)</td>
          </tr>
        </table>
    `;
    
    // Refuerzos
    if (config.refuerzos) {
      htmlBody += `<p style="margin-top: 10px;"><strong>Refuerzos:</strong> `;
      const refuerzos = [];
      if (config.refuerzos.perimetrales) refuerzos.push('✓ Perimetrales');
      if (config.refuerzos.tirantes) refuerzos.push('✓ Tirantes');
      htmlBody += refuerzos.length > 0 ? refuerzos.join(' | ') : 'Ninguno';
      htmlBody += `</p>`;
    }
    
    // Cristales ópticos
    if (config.opticos) {
      htmlBody += `<p><strong>Cristales ópticos:</strong> `;
      const opticos = [];
      if (config.opticos.frontal) opticos.push('✓ Frontal');
      if (config.opticos.trasera) opticos.push('✓ Trasera');
      if (config.opticos.lateralIzq) opticos.push('✓ Lateral izq.');
      if (config.opticos.lateralDer) opticos.push('✓ Lateral der.');
      htmlBody += opticos.length > 0 ? opticos.join(' | ') : 'Ninguno';
      htmlBody += `</p>`;
    }
  }
  
  // Historial de cotizaciones
  if (datos.historialCotizaciones && datos.historialCotizaciones.length > 0) {
    htmlBody += `
        <h3 style="color: #333; margin-top: 30px;">📊 Historial de Configuraciones Probadas</h3>
        <p style="color: #666; font-size: 14px;">El cliente probó ${datos.historialCotizaciones.length} configuración(es) antes de solicitar presupuesto:</p>
    `;
    
    datos.historialCotizaciones.forEach((cot, index) => {
      const resultado = cot.resultado;
      const datosCot = cot.datos;
      
      htmlBody += `
        <div style="background: white; padding: 15px; margin: 10px 0; border-left: 4px solid ${index === datos.historialCotizaciones.length - 1 ? '#4CAF50' : '#ddd'};">
          <h4 style="margin: 0 0 10px 0; color: #667eea;">
            Configuración #${index + 1} ${index === datos.historialCotizaciones.length - 1 ? '(Configuración Final)' : ''}
          </h4>
          <p style="margin: 5px 0;"><strong>Dimensiones:</strong> ${datosCot.largo} x ${datosCot.ancho} x ${datosCot.alto} cm</p>
          <p style="margin: 5px 0;"><strong>Grosor:</strong> ${resultado.medidas.grosor}</p>
          <p style="margin: 5px 0;"><strong>Capacidad:</strong> ${resultado.litros} litros</p>
          <p style="margin: 5px 0;"><strong>Precio:</strong> ${resultado.precio.toFixed(2)}€</p>
      `;
      
      // Refuerzos de esta configuración
      if (resultado.refuerzos) {
        const refuerzosTexto = [];
        if (resultado.refuerzos.perimetrales) refuerzosTexto.push('Perimetrales');
        if (resultado.refuerzos.tirantes) refuerzosTexto.push('Tirantes');
        if (refuerzosTexto.length > 0) {
          htmlBody += `<p style="margin: 5px 0;"><strong>Refuerzos:</strong> ${refuerzosTexto.join(', ')}</p>`;
        }
      }
      
      // Ópticos de esta configuración
      if (resultado.opticos) {
        const opticosTexto = [];
        if (resultado.opticos.frontal) opticosTexto.push('Frontal');
        if (resultado.opticos.trasera) opticosTexto.push('Trasera');
        if (resultado.opticos.lateralIzq) opticosTexto.push('Lateral izq.');
        if (resultado.opticos.lateralDer) opticosTexto.push('Lateral der.');
        if (opticosTexto.length > 0) {
          htmlBody += `<p style="margin: 5px 0;"><strong>Ópticos:</strong> ${opticosTexto.join(', ')}</p>`;
        }
      }
      
      htmlBody += `</div>`;
    });
  }
  
  // Agregar desglose si existe
  if (datos.desglose && datos.desglose.acuarioBase) {
    htmlBody += `
        <h3 style="color: #333; margin-top: 30px;">💰 Desglose del Presupuesto</h3>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Concepto</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;"><strong>Precio</strong></td>
          </tr>
    `;
    
    // Acuario base
    if (datos.desglose.acuarioBase) {
      const base = datos.desglose.acuarioBase;
      htmlBody += `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${base.descripcion || 'Acuario base'}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${(base.precio || 0).toFixed(2)}€</td>
          </tr>
      `;
    }
    
    // Items opcionales
    if (datos.desglose.items && datos.desglose.items.length > 0) {
      datos.desglose.items.forEach(item => {
        htmlBody += `
          <tr style="background: #fafafa;">
            <td style="padding: 10px; border: 1px solid #ddd;">${item.nombre || item.descripcion || 'Item'}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${(item.precio || 0).toFixed(2)}€</td>
          </tr>
        `;
      });
    }
    
    // Subtotal e IVA
    htmlBody += `
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Subtotal</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;"><strong>${(datos.desglose.subtotal || 0).toFixed(2)}€</strong></td>
          </tr>
    `;
    
    if (datos.desglose.iva !== undefined) {
      htmlBody += `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">IVA (21%)</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${(datos.desglose.iva).toFixed(2)}€</td>
          </tr>
      `;
    }
    
    htmlBody += `
          <tr style="background: #667eea; color: white;">
            <td style="padding: 10px; border: 1px solid #667eea;"><strong>TOTAL</strong></td>
            <td style="padding: 10px; border: 1px solid #667eea; text-align: right;"><strong>${(datos.desglose.total || 0).toFixed(2)}€</strong></td>
          </tr>
        </table>
    `;
  }
  
  htmlBody += `
        <div style="background: #e3f2fd; border: 1px solid #2196F3; padding: 15px; margin-top: 30px; border-radius: 5px;">
          <p style="margin: 0; color: #1976D2;">
            <strong>📧 Responder a:</strong> ${datos.email}<br>
            <strong>📱 Teléfono:</strong> ${datos.telefono || 'No proporcionado'}
          </p>
        </div>
      </div>
    </div>
  `;
  
  MailApp.sendEmail({
    to: EMAIL_DESTINO,
    subject: asunto,
    htmlBody: htmlBody,
    name: 'Sistema Coraline Aquariums',
    replyTo: datos.email
  });
  
  } catch (error) {
    Logger.log('Error al enviar email a Coraline: ' + error.toString());
    throw error;
  }
}

/**
 * Guarda la solicitud en una hoja de Google Sheets
 */
function guardarSolicitudEnSheet(datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Buscar o crear la hoja "Solicitudes"
    let hojaSolicitudes = ss.getSheetByName('Solicitudes');
    if (!hojaSolicitudes) {
      hojaSolicitudes = ss.insertSheet('Solicitudes');
      // Añadir encabezados
      hojaSolicitudes.getRange('A1:K1').setValues([[
        'Fecha', 'Nombre', 'Apellidos', 'Email', 'Teléfono', 'Medio Contacto',
        'Dimensiones', 'Grosor', 'Litros', 'Precio', 'Mensaje'
      ]]);
      hojaSolicitudes.getRange('A1:K1').setFontWeight('bold');
      hojaSolicitudes.setFrozenRows(1);
    }
    
    // Preparar datos a guardar
    const fecha = new Date();
    const config = datos.configuracion || {};
    const dimensiones = config.largo ? `${config.largo}x${config.ancho}x${config.alto}` : 'N/A';
    const grosor = config.grosor || 'N/A';
    const litros = config.litros || 'N/A';
    const precio = config.precio ? config.precio.toFixed(2) + '€' : 'N/A';
    
    // Añadir nueva fila
    hojaSolicitudes.appendRow([
      fecha,
      datos.nombre,
      datos.apellidos || '',
      datos.email,
      datos.telefono || '',
      datos.medioContacto || '',
      dimensiones,
      grosor,
      litros,
      precio,
      datos.mensaje || ''
    ]);
    
    Logger.log('Solicitud guardada en Google Sheets correctamente');
    
  } catch (error) {
    Logger.log('Error al guardar en Sheets: ' + error.toString());
    // No lanzamos error para no bloquear el envío de emails
  }
}

// ============================================
// SISTEMA DE LOGGING CENTRALIZADO
// ============================================

/**
 * Procesa logs enviados desde el frontend
 * @param {array} logs - Array de eventos capturados en el navegador
 */
function procesarLogsDelFrontend(logs) {
  try {
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'No hay logs para procesar'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Procesar cada log recibido
    logs.forEach(function(log) {
      registrarLogFrontend(
        log.tipo,
        log.datos,
        log.sessionId,
        log.userId,
        log.timestamp,
        log.url,
        log.userAgent
      );
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        logsRegistrados: logs.length,
        message: 'Logs registrados correctamente'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error al procesar logs del frontend: ' + error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Registra un log del frontend en la hoja LOG_FRONTEND
 * @param {string} tipo - Tipo de evento
 * @param {object} datos - Datos del evento
 * @param {string} sessionId - ID de sesión del usuario
 * @param {string} userId - ID del usuario
 * @param {string} timestamp - Timestamp del evento
 * @param {string} url - URL donde ocurrió el evento
 * @param {string} userAgent - User agent del navegador
 */
function registrarLogFrontend(tipo, datos, sessionId, userId, timestamp, url, userAgent) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let hojaLog = ss.getSheetByName('LOG_FRONTEND');
    
    // Crear hoja LOG_FRONTEND si no existe
    if (!hojaLog) {
      hojaLog = ss.insertSheet('LOG_FRONTEND');
      hojaLog.appendRow([
        'Timestamp',
        'Session ID',
        'User ID',
        'Tipo',
        'URL',
        'Resumen',
        'Datos Completos',
        'User Agent'
      ]);
      hojaLog.getRange('A1:H1').setFontWeight('bold');
      hojaLog.setFrozenRows(1);
      hojaLog.setColumnWidth(1, 150); // Timestamp
      hojaLog.setColumnWidth(2, 180); // Session ID
      hojaLog.setColumnWidth(3, 180); // User ID
      hojaLog.setColumnWidth(4, 120); // Tipo
      hojaLog.setColumnWidth(5, 250); // URL
      hojaLog.setColumnWidth(6, 300); // Resumen
      hojaLog.setColumnWidth(7, 400); // Datos
      hojaLog.setColumnWidth(8, 300); // User Agent
    }
    
    // Crear resumen legible según el tipo
    let resumen = '';
    try {
      switch(tipo) {
        case 'visita':
          resumen = `Visita a: ${datos.path || url}`;
          break;
        case 'clic_enlace':
          resumen = `Clic en enlace: "${datos.texto}" -> ${datos.href}`;
          break;
        case 'clic_boton':
          resumen = `Clic en botón: "${datos.texto}" (${datos.id})`;
          break;
        case 'cotizacion_inicio':
          resumen = `Cotización: ${datos.largo}x${datos.ancho}x${datos.alto}cm`;
          break;
        case 'cotizacion_resultado':
          resumen = `Resultado: ${datos.precio}€, ${datos.litros}L`;
          break;
        case 'error_js':
          resumen = `Error JS: ${datos.mensaje} (${datos.archivo}:${datos.linea})`;
          break;
        case 'error_email':
          resumen = `Error email: ${datos.mensaje} en ${datos.contexto}`;
          break;
        case 'cambio_idioma':
          resumen = `Cambio idioma a: ${datos.idioma}`;
          break;
        case 'formulario_presupuesto':
          resumen = `Formulario: ${datos.nombre} - ${datos.email}`;
          break;
        case 'rendimiento':
          resumen = `Carga: ${datos.tiempoCargaTotal}ms total, ${datos.tiempoDomReady}ms DOM`;
          break;
        default:
          resumen = JSON.stringify(datos).substring(0, 100);
      }
    } catch (e) {
      resumen = 'Error al generar resumen';
    }
    
    // Registrar en el log
    hojaLog.appendRow([
      timestamp,
      sessionId,
      userId,
      tipo,
      url,
      resumen,
      JSON.stringify(datos),
      userAgent
    ]);
    
  } catch (e) {
    // Si falla el log, no bloquea el resto del sistema
    Logger.log('Error al registrar log frontend: ' + e.toString());
  }
}

/**
 * Registra un evento en la hoja LOG del Google Sheets
 * @param {string} tipo - Tipo de evento (ej: "consulta", "email", "error", "visita", "formulario")
 * @param {object} datos - Objeto con los datos relevantes del evento
 */
function registrarLog(tipo, datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let hojaLog = ss.getSheetByName('LOG');
    
    // Crear hoja LOG si no existe
    if (!hojaLog) {
      hojaLog = ss.insertSheet('LOG');
      hojaLog.appendRow(['Fecha', 'Tipo', 'Resumen', 'Datos Completos']);
      hojaLog.getRange('A1:D1').setFontWeight('bold');
      hojaLog.setFrozenRows(1);
      hojaLog.setColumnWidth(1, 150); // Fecha
      hojaLog.setColumnWidth(2, 120); // Tipo
      hojaLog.setColumnWidth(3, 300); // Resumen
      hojaLog.setColumnWidth(4, 400); // Datos
    }
    
    // Crear resumen legible según el tipo
    let resumen = '';
    switch(tipo) {
      case 'consulta':
        resumen = `${datos.largo}x${datos.ancho}x${datos.alto}cm, Grosor: ${datos.grosor}, Precio: ${datos.precio}€`;
        break;
      case 'email_cliente':
        resumen = `Para: ${datos.email}, Configuración enviada`;
        break;
      case 'email_coraline':
        resumen = `Solicitud de: ${datos.nombre}, Email: ${datos.email}`;
        break;
      case 'formulario':
        resumen = `${datos.nombre} - ${datos.email}`;
        break;
      case 'error':
        resumen = `${datos.contexto}: ${datos.mensaje}`;
        break;
      default:
        resumen = JSON.stringify(datos).substring(0, 100);
    }
    
    // Registrar en el log
    hojaLog.appendRow([
      new Date(),
      tipo,
      resumen,
      JSON.stringify(datos)
    ]);
    
  } catch (e) {
    // Si falla el log, no bloquea el resto del sistema
    Logger.log('Error al registrar log: ' + e.toString());
  }
}

// ============================================
// INSTRUCCIONES DE INSTALACIÓN:
// ============================================
// 1. Sube tu Excel (.ods) a Google Drive
// 2. Conviértelo a Google Sheets (Abrir con > Google Sheets)
// 3. En Google Sheets, ve a Extensiones > Apps Script
// 4. Borra todo el código y pega este archivo completo
// 5. Ejecuta la función "obtenerIdHoja" para obtener el ID
// 6. Copia el ID y pégalo en la variable SPREADSHEET_ID (línea 12)
// 7. Guarda el script (Ctrl+S)
// 8. Haz clic en "Implementar" > "Nueva implementación"
// 9. Tipo: "Aplicación web"
// 10. Ejecutar como: "Yo"
// 11. Quién tiene acceso: "Cualquier usuario"
// 12. Implementar
// 13. Copia la URL que te da y pégala en cotizador.js
// ============================================
