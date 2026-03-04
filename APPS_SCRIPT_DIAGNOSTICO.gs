// ============================================
// VERSIÓN DE DIAGNÓSTICO CON LOGS ADICIONALES
// USA ESTE CÓDIGO TEMPORALMENTE PARA RASTREAR EL PROBLEMA
// ============================================
// Una vez identificado el problema, vuelve a usar NUEVO_APPS_SCRIPT_COMPLETO.gs

// ID DE TU GOOGLE SHEETS
const SPREADSHEET_ID = '13pfIOb2zUFC4tevEEzaF2RmHvmTw4T89UNmR-Omm4Ao';

// CONFIGURACIÓN DE EMAIL
const EMAIL_DESTINO = 'info@coralineaquariums.com';

// TOKEN SECRETO
const TOKEN_AUTORIZACION = 'oIw0QuTPH5EnBq4FPGDnQyZ0rw4LcP3y';

// DOMINIOS PERMITIDOS
const DOMINIOS_PERMITIDOS = [
  'https://coralineaquariums.com',
  'https://www.coralineaquariums.com',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

// Validaciones de seguridad
const VALIDAR_ORIGEN = true;
const VALIDAR_TOKEN = true;

// Mapeo de celdas
const CELDAS = {
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
  PRECIO_OPTICO_FRONTAL_O_TRASERO: 'B7',
  PRECIO_OPTICO_LATERAL: 'B8',
  RATIO_SEGURIDAD: 'B15',
  DEFLEXION: 'B16',
  PVPR: 'B17',
  LITROS: 'B18',
  CODIGO_PELIGRO: 'B31'
};

// ============================================
// FUNCIÓN PRINCIPAL MODIFICADA CON LOGS
// ============================================

function doPost(e) {
  // 🔴 LOG DE DIAGNÓSTICO
  const timestampInicio = new Date().getTime();
  Logger.log('🔴 ==========================================');
  Logger.log('🔴 NUEVA PETICIÓN doPost - Timestamp: ' + timestampInicio);
  Logger.log('🔴 ==========================================');
  
  try {
    // Validaciones de seguridad (sin cambios)
    if (VALIDAR_ORIGEN) {
      const origen = e.parameter.origin || e.parameters.origin;
      if (origen && !esOrigenPermitido(origen)) {
        Logger.log('❌ Origen no autorizado: ' + origen);
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Acceso denegado: origen no autorizado'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    const datos = JSON.parse(e.postData.contents);
    
    // 🔴 LOG: Mostrar acción recibida
    Logger.log('🔴 Acción recibida: ' + (datos.accion || 'cotizacion'));
    
    if (VALIDAR_TOKEN) {
      if (!datos.token || datos.token !== TOKEN_AUTORIZACION) {
        Logger.log('❌ Token inválido');
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Acceso denegado: token inválido'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Detectar tipo de acción
    if (datos.accion === 'registrar_logs') {
      Logger.log('🔴 Procesando logs del frontend');
      return procesarLogsDelFrontend(datos.logs);
    }
    
    if (datos.accion === 'enviar_presupuesto') {
      Logger.log('🔴 ==========================================');
      Logger.log('🔴 PROCESANDO SOLICITUD DE PRESUPUESTO');
      Logger.log('🔴 Nombre: ' + datos.nombre);
      Logger.log('🔴 Email: ' + datos.email);
      Logger.log('🔴 ==========================================');
      
      return procesarSolicitudPresupuesto(datos, timestampInicio);
    }
    
    // Cotización normal
    Logger.log('🔴 Procesando cotización normal');
    if (!datos.largo || !datos.ancho || !datos.alto || !datos.grosor) {
      throw new Error('Faltan datos obligatorios');
    }
    
    const resultado = calcularConExcel(datos);
    
    return ContentService
      .createTextOutput(JSON.stringify(resultado))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('❌ ERROR en doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        message: 'Error al procesar la solicitud'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// FUNCIÓN MODIFICADA CON LOGS DE DIAGNÓSTICO
// ============================================

function procesarSolicitudPresupuesto(datos, timestampInicio) {
  Logger.log('🔴 [procesarSolicitudPresupuesto] INICIO');
  
  try {
    // Validar datos
    if (!datos.nombre || !datos.email) {
      throw new Error('Faltan datos obligatorios: nombre y email');
    }
    
    Logger.log('🔴 [procesarSolicitudPresupuesto] Guardando en Sheets...');
    guardarSolicitudEnSheet(datos);
    
    Logger.log('🔴 [procesarSolicitudPresupuesto] Enviando email...');
    enviarEmailCoraline(datos, timestampInicio);
    
    Logger.log('🔴 [procesarSolicitudPresupuesto] ✅ COMPLETADO');
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Solicitud enviada correctamente',
        timestamp: timestampInicio // Devuelve el timestamp para verificar
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('❌ [procesarSolicitudPresupuesto] ERROR: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        message: 'Error al enviar la solicitud'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// FUNCIÓN DE EMAIL MODIFICADA CON LOGS
// ============================================

function enviarEmailCoraline(datos, timestampInicio) {
  // 🔴 LOG DE DIAGNÓSTICO CRÍTICO
  Logger.log('');
  Logger.log('🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴');
  Logger.log('🔴 EJECUTANDO enviarEmailCoraline');
  Logger.log('🔴 Timestamp inicio: ' + timestampInicio);
  Logger.log('🔴 Timestamp ahora: ' + new Date().getTime());
  Logger.log('🔴 Para: ' + datos.email);
  Logger.log('🔴 Nombre: ' + datos.nombre);
  Logger.log('🔴 Stack trace:');
  Logger.log(new Error().stack);
  Logger.log('🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴');
  Logger.log('');
  
  try {
    // Generar asunto con timestamp único para identificar duplicados
    const timestamp = new Date().getTime();
    const asunto = `🐠 [TEST-${timestamp}] Nueva Solicitud - ${datos.nombre} ${datos.apellidos}`;
    
    Logger.log('🔴 [enviarEmailCoraline] Preparando HTML...');
    
    let htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: #667eea; padding: 20px;">
          <h2 style="color: white; margin: 0;">Nueva Solicitud de Presupuesto [TEST]</h2>
          <p style="color: white; margin: 5px 0;">Timestamp: ${timestamp}</p>
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
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Teléfono:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${datos.telefono || 'No proporcionado'}</td>
            </tr>
          </table>
    `;
    
    // Mensaje del cliente
    if (datos.mensaje) {
      htmlBody += `
          <h3 style="color: #333; margin-top: 30px;">Mensaje</h3>
          <div style="background: white; padding: 15px;">
            <p style="color: #666;">${datos.mensaje}</p>
          </div>
      `;
    }
    
    // Configuración (si existe)
    if (datos.configuracion && datos.configuracion.largo) {
      const config = datos.configuracion;
      htmlBody += `
          <h3 style="color: #333; margin-top: 30px;">Configuración</h3>
          <table style="width: 100%; border-collapse: collapse; background: white;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Dimensiones:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${config.largo} x ${config.ancho} x ${config.alto} cm</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Precio:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>${config.precio ? config.precio.toFixed(2) : 'N/A'}€</strong></td>
            </tr>
          </table>
      `;
    }
    
    htmlBody += `
          <div style="background: #ffebee; border: 2px solid #f44336; padding: 15px; margin-top: 30px;">
            <p style="margin: 0; color: #c62828;">
              <strong>⚠️ MODO DIAGNÓSTICO</strong><br>
              Este correo incluye un timestamp único: <code>${timestamp}</code><br>
              Si recibes 2 correos con el MISMO timestamp, significa que MailApp.sendEmail se está ejecutando 2 veces.
            </p>
          </div>
        </div>
      </div>
    `;
    
    Logger.log('🔴 [enviarEmailCoraline] Llamando a MailApp.sendEmail...');
    Logger.log('🔴 [enviarEmailCoraline] Destinatario: ' + EMAIL_DESTINO);
    Logger.log('🔴 [enviarEmailCoraline] Asunto: ' + asunto);
    
    // 🔴 ÚNICA LLAMADA A MailApp.sendEmail
    MailApp.sendEmail({
      to: EMAIL_DESTINO,
      subject: asunto,
      htmlBody: htmlBody,
      name: 'Sistema Coraline Aquariums [TEST]',
      replyTo: datos.email
    });
    
    Logger.log('🔴 [enviarEmailCoraline] ✅ Email enviado correctamente');
    Logger.log('');
    
  } catch (error) {
    Logger.log('❌ [enviarEmailCoraline] ERROR: ' + error.toString());
    throw error;
  }
}

// ============================================
// FUNCIONES AUXILIARES (sin cambios significativos)
// ============================================

function doGet(e) {
  return ContentService.createTextOutput(
    'Sistema de cotización activo [MODO DIAGNÓSTICO]. Usa POST para calcular.'
  ).setMimeType(ContentService.MimeType.TEXT);
}

function doOptions(e) {
  return ContentService.createTextOutput('');
}

function calcularConExcel(datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName('Hoja1');
    
    if (!hoja) {
      throw new Error('No se encontró la hoja "Hoja1"');
    }
    
    const largo = parseFloat(datos.largo);
    const ancho = parseFloat(datos.ancho);
    const alto = parseFloat(datos.alto);
    const codigoGrosor = parseInt(datos.grosor);
    
    hoja.getRange(CELDAS.LARGO).setValue(largo);
    hoja.getRange(CELDAS.ANCHO).setValue(ancho);
    hoja.getRange(CELDAS.ALTO).setValue(alto);
    hoja.getRange(CELDAS.GROSOR).setValue(codigoGrosor);
    
    const perimetral = datos.perimetrales ? 1 : 0;
    const tirante = datos.tirantes ? 1 : 0;
    hoja.getRange(CELDAS.PERIMETRAL).setValue(perimetral);
    hoja.getRange(CELDAS.TIRANTE).setValue(tirante);
    
    const opticoFrontal = datos.opticoFrontal ? 1 : 0;
    const opticoTrasera = datos.opticoTrasera ? 1 : 0;
    const opticoLateralIzq = datos.opticoLateralIzq ? 1 : 0;
    const opticoLateralDer = datos.opticoLateralDer ? 1 : 0;
    
    hoja.getRange(CELDAS.OPTICO_FRONTAL).setValue(opticoFrontal);
    hoja.getRange(CELDAS.OPTICO_TRASERA).setValue(opticoTrasera);
    hoja.getRange(CELDAS.OPTICO_LATERAL_IZQ).setValue(opticoLateralIzq);
    hoja.getRange(CELDAS.OPTICO_LATERAL_DER).setValue(opticoLateralDer);
    
    SpreadsheetApp.flush();
    Utilities.sleep(500);
    
    const ratioSeguridad = parseFloat(hoja.getRange(CELDAS.RATIO_SEGURIDAD).getValue());
    const deflexion = parseFloat(hoja.getRange(CELDAS.DEFLEXION).getValue());
    const litros = parseFloat(hoja.getRange(CELDAS.LITROS).getValue());
    const precioFinal = parseFloat(hoja.getRange(CELDAS.PVPR).getValue());
    const precioOpticoFrontalTrasero = parseFloat(hoja.getRange(CELDAS.PRECIO_OPTICO_FRONTAL_O_TRASERO).getValue());
    const precioOpticoLateral = parseFloat(hoja.getRange(CELDAS.PRECIO_OPTICO_LATERAL).getValue());
    
    const warnings = [];
    
    if (ratioSeguridad < 4) {
      warnings.push({
        tipo: 'ratio',
        mensaje: '⚠️ RATIO DE SEGURIDAD BAJO',
        detalle: 'La configuración actual da como resultado un ratio de seguridad más bajo de lo recomendado.'
      });
    }
    
    if (deflexion > 10) {
      warnings.push({
        tipo: 'deflexion',
        mensaje: '⚠️ GROSOR INSUFICIENTE',
        detalle: 'El grosor es bajo para la altura, pudiendo ocasionar deformación.'
      });
    }
    
    const grosorMap = {
      1: '6mm',
      2: '8mm',
      3: '10mm',
      4: '12mm',
      5: '15mm',
      6: '19mm',
      7: '20mm laminado (10+10)'
    };
    
    return {
      success: true,
      medidas: {
        largo: largo,
        ancho: ancho,
        alto: alto,
        grosor: grosorMap[codigoGrosor]
      },
      litros: Math.round(litros),
      ratioSeguridad: parseFloat(ratioSeguridad.toFixed(2)),
      deflexion: parseFloat(deflexion.toFixed(2)),
      precio: parseFloat(precioFinal.toFixed(2)),
      precioOpticoFrontalTrasero: parseFloat(precioOpticoFrontalTrasero.toFixed(2)),
      precioOpticoLateral: parseFloat(precioOpticoLateral.toFixed(2)),
      refuerzos: {
        perimetrales: perimetral === 1,
        tirantes: tirante === 1
      },
      opticos: {
        frontal: opticoFrontal === 1,
        trasera: opticoTrasera === 1,
        lateralIzq: opticoLateralIzq === 1,
        lateralDer: opticoLateralDer === 1
      },
      warnings: warnings,
      esSeguro: warnings.length === 0
    };
    
  } catch (error) {
    throw new Error('Error en cálculo Excel: ' + error.toString());
  }
}

function guardarSolicitudEnSheet(datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let hojaSolicitudes = ss.getSheetByName('Solicitudes');
    
    if (!hojaSolicitudes) {
      hojaSolicitudes = ss.insertSheet('Solicitudes');
      hojaSolicitudes.getRange('A1:K1').setValues([[
        'Fecha', 'Nombre', 'Apellidos', 'Email', 'Teléfono', 'Medio Contacto',
        'Dimensiones', 'Grosor', 'Litros', 'Precio', 'Mensaje'
      ]]);
      hojaSolicitudes.getRange('A1:K1').setFontWeight('bold');
      hojaSolicitudes.setFrozenRows(1);
    }
    
    const fecha = new Date();
    const config = datos.configuracion || {};
    const dimensiones = config.largo ? `${config.largo}x${config.ancho}x${config.alto}` : 'N/A';
    const grosor = config.grosor || 'N/A';
    const litros = config.litros || 'N/A';
    const precio = config.precio ? config.precio.toFixed(2) + '€' : 'N/A';
    
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
    
    Logger.log('Solicitud guardada en Sheets');
    
  } catch (error) {
    Logger.log('Error al guardar en Sheets: ' + error.toString());
  }
}

function esOrigenPermitido(origen) {
  const origenNormalizado = origen.replace(/\/$/, '');
  for (let i = 0; i < DOMINIOS_PERMITIDOS.length; i++) {
    if (DOMINIOS_PERMITIDOS[i] === origenNormalizado) {
      return true;
    }
  }
  return false;
}

// Funciones de logging simplificadas (sin toda la lógica compleja)
function procesarLogsDelFrontend(logs) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Logs procesados'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
