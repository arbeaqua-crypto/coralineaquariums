// ============================================
// COTIZADOR DE ACUARIOS - FRONTEND
// Coraline Acuarios - Sistema de 2 pasos
// ============================================

// CONFIGURACIÃ“N - REEMPLAZAR CON TU URL DE GOOGLE APPS SCRIPT
const CONFIG = {
    googleSheetsAPI: 'https://script.google.com/macros/s/AKfycbz8UDsTG35-KOZVmP-nu9v7WRl2tlT7pZYkcOdK4Ucsl-b8hGPuAdgswn-8bavHGlat/exec'
};

const EMAIL_BACKEND_URL = 'https://script.google.com/macros/s/AKfycbxAak1iknG-WeltAhbWbU9wCx9wYGEVgTLSPR9IlVYGQ-r2F5f6vAHIZHQnBheNNVAA/exec';

// Variables globales
let ultimoCalculo = null;
let historialCotizaciones = [];

/**
 * Función principal para calcular el precio del acuario
 * PASO 1: Calcula precio base y muestra opciones de ópticos
 */
async function calcularPrecio() {
    // Obtener valores del formulario
    const largo = parseFloat(document.getElementById('largo')?.value);
    const ancho = parseFloat(document.getElementById('ancho')?.value);
    const alto = parseFloat(document.getElementById('alto')?.value);
    const codigoGrosor = parseInt(document.getElementById('grosor')?.value);
    const perimetrales = document.getElementById('perimetrales')?.checked || false;
    const tirantes = document.getElementById('tirantes')?.checked || false;
    
    // Validar campos
    if (!largo || !ancho || !alto || !codigoGrosor) {
        alert('Por favor, completa todos los campos obligatorios');
        return;
    }
    
    // Validar rangos
    if (largo < 30 || largo > 500) {
        alert('El largo debe estar entre 30 y 500 cm');
        return;
    }
    if (ancho < 30 || ancho > 150) {
        alert('El ancho debe estar entre 30 y 150 cm');
        return;
    }
    if (alto < 30 || alto > 200) {
        alert('El alto debe estar entre 30 y 200 cm');
        return;
    }
    
    // Mostrar estado de carga
    const btnCalcular = document.querySelector('.btn-calculate');
    const textoOriginal = btnCalcular.innerHTML;
    btnCalcular.disabled = true;
    btnCalcular.innerHTML = 'Calculando...';
    
    try {
        // Obtener datos del soporte
        const necesitaSoporte = document.getElementById('necesitaSoporte')?.checked || false;
        let tipoSoporte = null;
        let acabadoEstructura = null;
        let colorEstructura = null;
        
        if (necesitaSoporte) {
            tipoSoporte = document.getElementById('tipoSoporte')?.value || 'estructura-metalica';
            const acabadoRadios = document.getElementsByName('acabadoEstructura');
            acabadoRadios.forEach(radio => {
                if (radio.checked) acabadoEstructura = radio.value;
            });
            if (acabadoEstructura === 'color') {
                colorEstructura = document.getElementById('colorEstructura')?.value || 'blanco';
            }
        }
        
        // Preparar datos para enviar
        const datos = {
            largo: largo,
            ancho: ancho,
            alto: alto,
            grosor: codigoGrosor,
            perimetrales: perimetrales,
            tirantes: tirantes,
            opticoFrontal: false,
            opticoTrasera: false,
            opticoLateralIzq: false,
            opticoLateralDer: false,
            // Datos del soporte
            necesitaSoporte: necesitaSoporte,
            tipoSoporte: tipoSoporte,
            acabadoEstructura: acabadoEstructura,
            colorEstructura: colorEstructura,
            token: window.TOKEN_SEGURIDAD || 'TOKEN_NO_CONFIGURADO'
        };
        
        // Registrar inicio de cotización
        if (window.Logger) {
            window.Logger.logCotizacionInicio(datos);
        }
        
        // Llamar a la API
        // Usar text/plain para evitar petición preflight CORS OPTIONS
        const response = await fetch(CONFIG.googleSheetsAPI, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(datos)
        });
        
        if (!response.ok) {
            throw new Error('Error en la conexión con el servidor');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error al calcular el precio');
        }
        
        // Guardar resultado
        ultimoCalculo = data;
        
        // Guardar en historial
        guardarEnHistorial(datos, data);
        
        // Registrar resultado en el log
        if (window.Logger) {
            window.Logger.logCotizacionResultado(data);
        }
        
        // Mostrar resultado
        mostrarResultado(data);
        
    } catch (error) {
        console.error('Error:', error);
        
        // Registrar error en el log
        if (window.Logger) {
            window.Logger.addLog('error_cotizacion', {
                mensaje: error.message || error.toString(),
                largo: largo,
                ancho: ancho,
                alto: alto
            });
        }
        
        let mensaje = 'Error al calcular el precio. ';
        if (error.message.includes('Failed to fetch')) {
            mensaje += 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
        } else {
            mensaje += error.message;
        }
        
        alert(mensaje);
        
    } finally {
        // Restaurar botón
        btnCalcular.disabled = false;
        btnCalcular.innerHTML = textoOriginal;
    }
}

/**
 * PASO 2: Recalcula con los cristales ópticos seleccionados
 */
async function recalcularConOpticos() {
    if (!ultimoCalculo) return;
    
    // Obtener valores actuales
    const largo = parseFloat(document.getElementById('largo').value);
    const ancho = parseFloat(document.getElementById('ancho').value);
    const alto = parseFloat(document.getElementById('alto').value);
    const codigoGrosor = parseInt(document.getElementById('grosor').value);
    const perimetrales = document.getElementById('perimetrales').checked;
    const tirantes = document.getElementById('tirantes').checked;
    
    // Obtener ópticos seleccionados
    const opticoFrontal = document.getElementById('opticoFrontal').checked;
    const opticoTrasera = document.getElementById('opticoTrasera').checked;
    const opticoLateralIzq = document.getElementById('opticoLateralIzq').checked;
    const opticoLateralDer = document.getElementById('opticoLateralDer').checked;
    
    try {
        // Preparar datos para enviar
        const datos = {
            largo: largo,
            ancho: ancho,
            alto: alto,
            grosor: codigoGrosor,
            perimetrales: perimetrales,
            tirantes: tirantes,
            opticoFrontal: opticoFrontal,
            opticoTrasera: opticoTrasera,
            opticoLateralIzq: opticoLateralIzq,
            opticoLateralDer: opticoLateralDer,
            token: window.TOKEN_SEGURIDAD || 'TOKEN_NO_CONFIGURADO'
        };
        
        // Llamar a la API
        // Usar text/plain para evitar petición preflight CORS OPTIONS
        const response = await fetch(CONFIG.googleSheetsAPI, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(datos)
        });
        
        if (!response.ok) {
            throw new Error('Error en la conexión con el servidor');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error al calcular el precio');
        }
        
        // Actualizar resultado
        ultimoCalculo = data;
        
        // Registrar selección de ópticos
        if (window.Logger) {
            window.Logger.logSeleccionOpticos({
                frontal: opticoFrontal,
                trasera: opticoTrasera,
                lateralIzq: opticoLateralIzq,
                lateralDer: opticoLateralDer,
                precioExtra: data.precio - (ultimoCalculo?.precio || data.precio)
            });
        }
        
        // Actualizar precio final
        document.getElementById('precioFinal').textContent = `${data.precio.toFixed(2)}€`;
        
    } catch (error) {
        console.error('Error al recalcular:', error);
    }
}

/**
 * Muestra el resultado del cálculo en la página
 */
function mostrarResultado(data) {
    // Mostrar avisos de seguridad personalizados
    mostrarAvisos(data);
    
    // Mostrar información básica (solo litros, sin ratio ni deflexión)
    document.getElementById('litros').textContent = `${data.litros} litros`;
    
    // Guardar datos globalmente para uso en configuración de soportes
    window.datosCalculoActual = data;
    window.largoAcuario = data.medidas.largo;
    window.litrosAcuario = data.litros;
    
    // Verificar disponibilidad de mesa en melamina según dimensiones
    verificarDisponibilidadMesa(data.medidas.largo, data.litros);
    
    // Recalcular soporte para actualizar número de pies niveladores según dimensiones
    recalcularSoporte();
    
    // Actualizar precios de estructura metálica si existen (nueva estructura de datos)
    console.log('ðŸ’° Precios de soportes recibidos:', {
        estructuraInox: data.estructuraInox,
        mesaMadera: data.mesaMadera,
        forradoMadera: data.forradoMadera,
        mesaAltaEstructura: data.mesaAltaEstructura,
        mesaAltaMadera: data.mesaAltaMadera,
        sump: data.sump || data.mesaAltaMadera,
        extrasSoporte: data.extrasSoporte,
        accesorios: data.accesorios,
        estructuraObligatoria: data.estructuraObligatoria
    });
    
    // Verificar estructura obligatoria y mostrar/ocultar opciones
    if (data.estructuraObligatoria) {
        const warningDiv = document.getElementById('warningEstructuraObligatoria');
        const textoDiv = document.getElementById('textoWarningEstructura');
        if (warningDiv && textoDiv) {
            warningDiv.style.display = 'block';
            textoDiv.textContent = data.razonEstructuraObligatoria || 
                'Este acuario requiere estructura metálica obligatoriamente.';
        }
        
        // Ocultar opción de mesa integral melamina
        const mesaMelaminaDiv = document.getElementById('opcionMesaMelamina');
        if (mesaMelaminaDiv) mesaMelaminaDiv.style.display = 'none';
    } else {
        const warningDiv = document.getElementById('warningEstructuraObligatoria');
        if (warningDiv) warningDiv.style.display = 'none';
        
        // Mostrar todas las opciones
        const mesaMelaminaDiv = document.getElementById('opcionMesaMelamina');
        if (mesaMelaminaDiv) mesaMelaminaDiv.style.display = 'block';
    }
    
    // Mostrar y configurar opciones de cristal óptico
    if (data.precioOpticoFrontalTrasero > 0 || data.precioOpticoLateral > 0) {
        const opticosSection = document.getElementById('extras-section');
        if (opticosSection) opticosSection.style.display = 'block';
        
        // Actualizar precios de ópticos (sin decimales)
        document.getElementById('precioOpticoFrontal').textContent = `+${Math.round(data.precioOpticoFrontalTrasero)}€`;
        document.getElementById('precioOpticoTrasera').textContent = `+${Math.round(data.precioOpticoFrontalTrasero)}€`;
        document.getElementById('precioOpticoLateralIzq').textContent = `+${Math.round(data.precioOpticoLateral)}€`;
        document.getElementById('precioOpticoLateralDer').textContent = `+${Math.round(data.precioOpticoLateral)}€`;
        
        // Limpiar checkboxes de ópticos (solo si es el primer cálculo)
        if (!data.opticos.frontal && !data.opticos.trasera && !data.opticos.lateralIzq && !data.opticos.lateralDer) {
            document.getElementById('opticoFrontal').checked = false;
            document.getElementById('opticoTrasera').checked = false;
            document.getElementById('opticoLateralIzq').checked = false;
            document.getElementById('opticoLateralDer').checked = false;
        }
    }
    
    // Inicializar precios de soportes (mostrar precios base en los checkboxes)
    if (data.estructuraInox && data.forradoMadera) {
        // Estructura de acero - acabados
        if (document.getElementById('precioAcabadoPulidoMatizado')) {
            document.getElementById('precioAcabadoPulidoMatizado').textContent = `+${Math.round(data.estructuraInox.brillo)}€`;
        }
        if (document.getElementById('precioAcabadoColor')) {
            document.getElementById('precioAcabadoColor').textContent = `+${Math.round(data.estructuraInox.color)}€`;
        }
        if (document.getElementById('precioAcabadoSinPulir')) {
            document.getElementById('precioAcabadoSinPulir').textContent = `+${Math.round(data.estructuraInox.sinPulir)}€`;
        }
        
        // Forrado en melamina (blanco satinado)
        const precioForradoMelaminaDiv = document.getElementById('precioForradoMelamina');
        if (precioForradoMelaminaDiv) {
            precioForradoMelaminaDiv.textContent = `+${Math.round(data.forradoMadera.blancoSatinado)}€`;
        }
        
        // Inicializar precios de accesorios base
        const largoMetros = Math.ceil(data.medidas.largo / 100);
        
        if (data.accesorios) {
            // Ventilador: precio fijo, no depende de datos del servidor
            
            // Iluminación: precio fijo 25€ por punto de luz (no depende del servidor)
            const precioIlumDiv = document.getElementById('precioIluminacionModular');
            if (precioIlumDiv) {
                precioIlumDiv.textContent = '+25€';
            }
            
            // Precios de regletas ahora son fijos (35€ normal, 45€ sobretensión)
            

        }
    }
    
    // Mostrar precio final
    document.getElementById('precioFinal').textContent = `${data.precio.toFixed(2)}€`;
    
    // Actualizar desglose detallado
    actualizarDesglose(data);

    // Generar desglose completo automáticamente (siempre visible)
    if (typeof generarDesgloseCompleto === 'function') {
        generarDesgloseCompleto();
    }

    // Mostrar sección de resultados
    document.getElementById('resultados').style.display = 'block';
    document.getElementById('resultados').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Muestra avisos de seguridad personalizados
 */
function mostrarAvisos(data) {
    const warningsContainer = document.getElementById('warnings');
    warningsContainer.innerHTML = '';
    
    // Aviso si ratio < 4
    if (data.ratioSeguridad < 4) {
        const avisoRatio = document.createElement('div');
        avisoRatio.className = 'warning-box warning-danger';
        avisoRatio.innerHTML = `
            <h4 style="color: #ff6b6b; margin-bottom: 10px;">Ratio de Seguridad Bajo</h4>
            <p style="color: #ff6b6b;">La configuración actual da como resultado un ratio de seguridad más bajo de lo recomendado. Para evitar una construcción débil, puedes aumentar el grosor de cristal o añadir refuerzos perimetrales y tirantes.</p>
        `;
        warningsContainer.appendChild(avisoRatio);
    }
    
    // Aviso si deflexión > 10%
    if (data.deflexion > 10) {
        const avisoDeflexion = document.createElement('div');
        avisoDeflexion.className = 'warning-box warning-danger';
        avisoDeflexion.innerHTML = `
            <h4 style="color: #ff6b6b; margin-bottom: 10px;">Grosor Insuficiente para la Altura</h4>
            <p style="color: #ff6b6b;">El grosor de las láminas de esta configuración es bajo para la altura y la fuerza del agua, pudiendo ocasionar deformación en el cristal. Recomendamos aumentar el grosor general del acuario o bien bajar la altura de este para evitarlo.</p>
        `;
        warningsContainer.appendChild(avisoDeflexion);
    }
    
    // Si todo está bien, mostrar mensaje positivo
    if (data.ratioSeguridad >= 4 && data.deflexion <= 10) {
        const avisoOk = document.createElement('div');
        avisoOk.className = 'warning-box warning-success';
        avisoOk.innerHTML = `
            <h4 style="color: #4ade80; margin-bottom: 10px;">Configuración Segura</h4>
            <p style="color: #4ade80;">Esta configuración cumple con todos los estándares de seguridad recomendados.</p>
        `;
        warningsContainer.appendChild(avisoOk);
    }
}

/**
 * Guarda la cotización en el historial
 */
function guardarEnHistorial(datos, resultado) {
    const cotizacion = {
        timestamp: new Date().toISOString(),
        datos: datos,
        resultado: resultado
    };
    
    historialCotizaciones.push(cotizacion);
    
    // Guardar en localStorage para el formulario
    localStorage.setItem('historialCotizaciones', JSON.stringify(historialCotizaciones));
    localStorage.setItem('ultimaCotizacion', JSON.stringify(cotizacion));
}

/**
 * Resetea el formulario para una nueva cotización
 */
function nuevaCotizacion() {
    // Limpiar campos del formulario
    document.getElementById('largo').value = '';
    document.getElementById('ancho').value = '';
    document.getElementById('alto').value = '';
    document.getElementById('grosor').value = '3'; // Reset a 10mm recomendado
    document.getElementById('perimetrales').checked = false;
    document.getElementById('tirantes').checked = false;
    
    // Ocultar sección de resultados
    document.getElementById('resultados').style.display = 'none';
    
    // Resetear última cotización (pero mantener historial)
    ultimoCalculo = null;
    
    // Scroll al formulario
    document.querySelector('.cotizador-form').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// LÃ“GICA DE CHECKBOXES
// ============================================

/**
 * Manejo de dependencias entre checkboxes de refuerzos
 */
document.addEventListener('DOMContentLoaded', function() {
    // Pre-rellenar el cotizador si hay un modelo guardado desde página de catálogo
    const modeloGuardado = localStorage.getItem('modelo');
    if (modeloGuardado) {
        try {
            const modelo = JSON.parse(modeloGuardado);
            if (modelo.largo) document.getElementById('largo').value = modelo.largo;
            if (modelo.ancho) document.getElementById('ancho').value = modelo.ancho;
            if (modelo.alto) document.getElementById('alto').value = modelo.alto;
            if (modelo.grosor) document.getElementById('grosor').value = modelo.grosor;
            
            // Limpiar el localStorage después de usar los datos
            localStorage.removeItem('modelo');
            
            // Scroll suave al formulario del cotizador
            setTimeout(() => {
                const cotizadorForm = document.querySelector('.cotizador-form');
                if (cotizadorForm) {
                    cotizadorForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        } catch (e) {
            console.error('Error al cargar modelo guardado:', e);
            localStorage.removeItem('modelo');
        }
    }
    
    const tirantesCheckbox = document.getElementById('tirantes');
    const perimetralesCheckbox = document.getElementById('perimetrales');
    
    if (tirantesCheckbox && perimetralesCheckbox) {
        // Si se activa tirantes, activar automáticamente perimetrales
        tirantesCheckbox.addEventListener('change', function() {
            if (this.checked) {
                perimetralesCheckbox.checked = true;
            }
        });
        
        // Si se desactiva perimetrales, desactivar también tirantes
        perimetralesCheckbox.addEventListener('change', function() {
            if (!this.checked) {
                tirantesCheckbox.checked = false;
            }
        });
    }
    
    // Configurar botón de presupuesto para guardar configuración
    const btnPresupuesto = document.getElementById('btnPresupuesto');
    if (btnPresupuesto) {
        btnPresupuesto.addEventListener('click', function() {
            if (ultimoCalculo) {
                const codigoRecuperacion = generarCodigoRecuperacionActual();

                // Guardar configuración actual para el formulario
                localStorage.setItem('configuracion-acuario', JSON.stringify({
                    largo: document.getElementById('largo').value,
                    ancho: document.getElementById('ancho').value,
                    alto: document.getElementById('alto').value,
                    grosor: document.getElementById('grosor').options[document.getElementById('grosor').selectedIndex].text,
                    precio: ultimoCalculo.precio,
                    litros: ultimoCalculo.litros,
                    refuerzos: ultimoCalculo.refuerzos,
                    opticos: ultimoCalculo.opticos,
                    codigoRecuperacion: codigoRecuperacion
                }));

                localStorage.setItem('ultimo-codigo-configuracion', codigoRecuperacion);
            }
        });
    }
});

// ============================================
// FUNCIONES PARA DESGLOSE DETALLADO
// ============================================

/**
 * Toggle del desglose detallado.
 * NOTA: el desglose ahora siempre está visible (sin toggle).
 * Esta función se mantiene como no-op por compatibilidad con cualquier
 * código legacy que pudiera invocarla. Simplemente regenera el contenido.
 */
function toggleDesglose() {
    if (typeof generarDesgloseCompleto === 'function') {
        generarDesgloseCompleto();
    }
}

/**
 * Mostrar posición actual de la cámara 3D (para copiar y pegar)
 * Usar desde consola: verCamara()
 */
window.verCamara = function() {
    const cam = window.threeCamera;
    const ctrl = window.threeControls;
    if (!cam || !ctrl) { console.log('Cámara no disponible'); return; }
    const p = cam.position;
    const t = ctrl.target;
    console.log(`📷 Cámara: posición(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}) → target(${t.x.toFixed(1)}, ${t.y.toFixed(1)}, ${t.z.toFixed(1)})`);
    alert(`Cámara:\nPos: ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}\nTarget: ${t.x.toFixed(1)}, ${t.y.toFixed(1)}, ${t.z.toFixed(1)}`);
};

/**
 * Capturar screenshot del 3D desde una posición específica
 */
function capturar3DDesdeAngulo(posX, posY, posZ, targetY) {
    const cam = window.threeCamera;
    const ctrl = window.threeControls;
    const ren = window.threeRenderer;
    const scn = window.threeScene;
    
    if (!cam || !ctrl || !ren || !scn) {
        return null;
    }
    
    // Guardar posicion actual
    const origPos = cam.position.clone();
    const origTarget = ctrl.target.clone();
    
    // Abrir puertas para mostrar interior
    const puertasEstaban = window.puertasAbiertas || false;
    if (typeof window.aplicarEstadoPuertas === 'function') {
        window.aplicarEstadoPuertas(true);
    }
    
    // Mover camara
    cam.position.set(posX, posY, posZ);
    ctrl.target.set(0, targetY || 3, 0);
    ctrl.update();
    
    // Renderizar y capturar
    ren.render(scn, cam);
    const dataURL = ren.domElement.toDataURL('image/png');
    
    // Restaurar puertas a su estado original
    if (typeof window.aplicarEstadoPuertas === 'function') {
        window.aplicarEstadoPuertas(puertasEstaban);
    }
    
    // Restaurar posicion
    cam.position.copy(origPos);
    ctrl.target.copy(origTarget);
    ctrl.update();
    ren.render(scn, cam);
    
    return dataURL;
}

/**
 * Verificar si hay algún rebosadero seleccionado en la urna principal
 */
function hayRebosaderoSeleccionado() {
    const idsRebosadero = [
        'rebosaderoGeneral',
        'rebosaderoEsquinero',
        'rebosaderoEtapa',
        'rebosaderoDiagonal',
        'rebosaderoColumna',
        'rebosaderoExterno'
    ];
    return idsRebosadero.some(id => document.getElementById(id)?.checked);
}

window.hayRebosaderoSeleccionado = hayRebosaderoSeleccionado;

/**
 * Gestionar activación del checkbox de sump con dependencia de rebosadero
 */
window.gestionarCambioSump = function(checkbox) {
    const checkSump = checkbox || document.getElementById('checkSump');
    if (!checkSump) return;

    const opcionesSump = document.getElementById('opcionesSump');
    const viniloSump = document.getElementById('viniloSump');
    const selectorVinilo = document.getElementById('selectorColorViniloSump');

    if (checkSump.checked && !hayRebosaderoSeleccionado()) {
        checkSump.checked = false;
        if (opcionesSump) opcionesSump.style.display = 'none';
        if (viniloSump) viniloSump.checked = false;
        if (selectorVinilo) selectorVinilo.style.display = 'none';

        alert('para el montaje con filtración de sump/sumidero, es necesario instalar en la urna principal un rebosadero previamente');
    } else {
        if (opcionesSump) opcionesSump.style.display = checkSump.checked ? '' : 'none';
        if (!checkSump.checked) {
            if (viniloSump) viniloSump.checked = false;
            if (selectorVinilo) selectorVinilo.style.display = 'none';
        }
    }

    recalcularSoporte();
    if (typeof window.actualizarSump3D === 'function') {
        window.actualizarSump3D();
    }
};

/**
 * Generar desglose completo dinámicamente
 */
function generarDesgloseCompleto() {
    const container = document.getElementById('desgloseGenerado');
    if (!container) return;
    
    const data = window.datosCalculoActual;
    const ds = window.datosSoporteActual;
    
    if (!data) {
        container.innerHTML = '<p style="color: rgba(224,230,237,0.5); text-align: center; padding: 20px;">Pulsa "Calcular Precio" primero para generar el desglose.</p>';
        return;
    }
    
    let html = '';
    let subtotal = 0;
    
    // =============================================
    // CABECERA: Título con dimensiones
    // =============================================
    const largo = parseFloat(document.getElementById('largo').value);
    const ancho = parseFloat(document.getElementById('ancho').value);
    const alto = parseFloat(document.getElementById('alto').value);
    const grosorText = document.getElementById('grosor').options[document.getElementById('grosor').selectedIndex].text;
    const litros = data.litros || Math.round(largo * ancho * alto / 1000);
    const colorSilicona = document.getElementById('colorSilicona')?.options[document.getElementById('colorSilicona').selectedIndex]?.text || 'Transparente';
    const tipoRefuerzo = document.getElementById('tipoRefuerzo')?.value || 'ninguno';
    
    let textoRefuerzos = 'Sin refuerzos';
    if (tipoRefuerzo === 'perimetral') textoRefuerzos = 'Refuerzos perimetrales';
    else if (tipoRefuerzo === 'perimetral-tirantes') textoRefuerzos = 'Refuerzos perimetrales + tirantes';
    
    html += `
        <div class="dg-cabecera">
            <h2 class="dg-titulo">Acuario ${largo} x ${ancho} x ${alto} cm en ${grosorText}</h2>
            <p class="dg-subtitulo">${litros} litros &mdash; Silicona ${colorSilicona} &mdash; ${textoRefuerzos}</p>
        </div>
    `;
    
    // =============================================
    // CAPTURAS 3D
    // =============================================
    const capFrontal = capturar3DDesdeAngulo(4.7, -2.5, 20.4, -2);
    const capLateral = capturar3DDesdeAngulo(14.9, 3.7, 13.6, -2);
    
    if (capFrontal && capLateral) {
        html += `
            <div class="dg-capturas">
                <img src="${capFrontal}" alt="Vista frontal" class="dg-captura-img">
                <img src="${capLateral}" alt="Vista lateral" class="dg-captura-img">
            </div>
        `;
    }
    
    // =============================================
    // Helper para líneas del desglose
    // =============================================
    function lineaCategoria(nombre) {
        return `<div class="dg-categoria">${nombre}</div>`;
    }
    function lineaItem(nombre, precio) {
        subtotal += precio;
        return `<div class="dg-item"><span class="dg-item-nombre">${nombre}</span><span class="dg-item-precio">${precio.toFixed(2)} &euro;</span></div>`;
    }
    function lineaSubitem(nombre, precio) {
        subtotal += precio;
        return `<div class="dg-subitem"><span class="dg-subitem-nombre">${nombre}</span><span class="dg-subitem-precio">${precio.toFixed(2)} &euro;</span></div>`;
    }
    
    // =============================================
    // CATEGORÍA 1: ACUARIO PRINCIPAL
    // =============================================
    html += lineaCategoria('Acuario principal');
    
    const precioBase = data.precioBase || data.precio || 0;
    html += lineaItem('Urna de cristal', precioBase);
    
    if (tipoRefuerzo !== 'ninguno' && data.precioRefuerzos > 0) {
        html += lineaSubitem('Refuerzos perimetrales', data.precioRefuerzos);
    }
    if (tipoRefuerzo === 'perimetral-tirantes' && data.precioTirantes > 0) {
        html += lineaSubitem('Tirantes', data.precioTirantes);
    }
    
    // =============================================
    // CATEGORÍA 2: ACABADOS EN CRISTAL ÓPTICO
    // =============================================
    const opticoItems = [];
    
    if (document.getElementById('opticoFrontal')?.checked) {
        const p = parseFloat(document.getElementById('precioOpticoFrontal')?.textContent?.replace(/[^\d.]/g, '')) || 0;
        opticoItems.push({ nombre: 'Cristal óptico - Frontal', precio: p });
    }
    if (document.getElementById('opticoTrasera')?.checked) {
        const p = parseFloat(document.getElementById('precioOpticoTrasera')?.textContent?.replace(/[^\d.]/g, '')) || 0;
        opticoItems.push({ nombre: 'Cristal óptico - Trasera', precio: p });
    }
    if (document.getElementById('opticoLateralIzq')?.checked) {
        const p = parseFloat(document.getElementById('precioOpticoLateralIzq')?.textContent?.replace(/[^\d.]/g, '')) || 0;
        opticoItems.push({ nombre: 'Cristal óptico - Lateral izq.', precio: p });
    }
    if (document.getElementById('opticoLateralDer')?.checked) {
        const p = parseFloat(document.getElementById('precioOpticoLateralDer')?.textContent?.replace(/[^\d.]/g, '')) || 0;
        opticoItems.push({ nombre: 'Cristal óptico - Lateral der.', precio: p });
    }
    
    if (opticoItems.length > 0) {
        html += lineaCategoria('Acabados en cristal óptico');
        opticoItems.forEach(item => {
            html += lineaSubitem(item.nombre, item.precio);
        });
    }
    
    // =============================================
    // CATEGORÍA 2B: REBOSADERO
    // =============================================
    const rebosaderoNombres = {
        'general': { id: 'rebosaderoGeneral', nombre: 'Rebosadero general', precio: 110 },
        'esquinero': { id: 'rebosaderoEsquinero', nombre: 'Rebosadero esquinero', precio: 95 },
        'etapa': { id: 'rebosaderoEtapa', nombre: 'Rebosadero de etapa', precio: 115 },
        'diagonal': { id: 'rebosaderoDiagonal', nombre: 'Rebosadero esquinero diagonal', precio: 75 },
        'columna': { id: 'rebosaderoColumna', nombre: 'Rebosadero de columna', precio: 145 },
        'externo': { id: 'rebosaderoExterno', nombre: 'Rebosadero de cajón externo', precio: 115 }
    };
    let rebosaderoEncontrado = null;
    Object.keys(rebosaderoNombres).forEach(key => {
        const rb = rebosaderoNombres[key];
        if (document.getElementById(rb.id)?.checked) {
            rebosaderoEncontrado = rb;
        }
    });
    if (rebosaderoEncontrado) {
        html += lineaCategoria('Rebosadero');
        let nombreReb = rebosaderoEncontrado.nombre;
        if (rebosaderoEncontrado.id === 'rebosaderoEsquinero') {
            const pos = document.getElementById('posicionEsquinero')?.value || '';
            if (pos) nombreReb += ` (${pos})`;
        } else if (rebosaderoEncontrado.id === 'rebosaderoDiagonal') {
            const pos = document.getElementById('posicionDiagonal')?.value || '';
            if (pos) nombreReb += ` (${pos})`;
        } else if (rebosaderoEncontrado.id === 'rebosaderoExterno') {
            const pos = document.getElementById('posicionExterno')?.value || '';
            if (pos) nombreReb += ` (${pos})`;
        }
        html += lineaSubitem(nombreReb, rebosaderoEncontrado.precio);
    }
    
    // =============================================
    // CATEGORÍA 2C: VINILOS EN URNA
    // =============================================
    const viniloItems = [];
    const colorVinilo = document.getElementById('colorVinilo')?.value || 'negro';
    
    if (document.getElementById('extraViniloLateralDerecho')?.checked) {
        const p = parseFloat(document.getElementById('precioViniloLateralDerecho')?.textContent?.replace(/[^\d.+]/g, '')) || 0;
        viniloItems.push({ nombre: 'Vinilo lateral derecho', precio: p });
    }
    if (document.getElementById('extraViniloLateralIzquierdo')?.checked) {
        const p = parseFloat(document.getElementById('precioViniloLateralIzquierdo')?.textContent?.replace(/[^\d.+]/g, '')) || 0;
        viniloItems.push({ nombre: 'Vinilo lateral izquierdo', precio: p });
    }
    if (document.getElementById('extraViniloTrasero')?.checked) {
        const p = parseFloat(document.getElementById('precioViniloTrasero')?.textContent?.replace(/[^\d.+]/g, '')) || 0;
        viniloItems.push({ nombre: 'Vinilo lámina trasera', precio: p });
    }
    const viniloFondoSel = document.getElementById('viniloFondo');
    if (viniloFondoSel && viniloFondoSel.value !== 'no') {
        const p = parseFloat(document.getElementById('precioViniloFondo')?.textContent?.replace(/[^\d.+]/g, '')) || 0;
        viniloItems.push({ nombre: 'Vinilo en fondo/base', precio: p });
    }
    
    if (viniloItems.length > 0) {
        html += lineaCategoria(`Vinilos (color ${colorVinilo})`);
        viniloItems.forEach(item => {
            html += lineaSubitem(item.nombre, item.precio);
        });
    }
    
    // =============================================
    // CATEGORÍA 2D: ENCINTADOS
    // =============================================
    const encintadoItems = [];
    const colorEncintado = document.getElementById('colorEncintado')?.value || 'negro';
    
    // Textos descriptivos de perímetro
    const perimetroTextos = {
        'frontal': 'frontal',
        'frontal-derecho': 'frontal + lateral der.',
        'frontal-izquierdo': 'frontal + lateral izq.',
        'frontal-derecho-trasera': 'frontal + der. + trasera',
        'perimetro': 'perímetro completo'
    };
    
    if (document.getElementById('extraEncintadoSuperficie')?.checked) {
        const p = parseFloat(document.getElementById('precioEncintadoSuperficie')?.textContent?.replace(/[^\d.+]/g, '')) || 0;
        const perim = document.getElementById('perimetroEncintadoSuperficie')?.value || 'frontal';
        encintadoItems.push({ nombre: `Encintado de superficie (${perimetroTextos[perim] || perim})`, precio: p });
    }
    if (document.getElementById('extraEncintadoBase')?.checked) {
        const p = parseFloat(document.getElementById('precioEncintadoBase')?.textContent?.replace(/[^\d.+]/g, '')) || 0;
        const perim = document.getElementById('perimetroEncintadoBase')?.value || 'frontal';
        encintadoItems.push({ nombre: `Encintado de base (${perimetroTextos[perim] || perim})`, precio: p });
    }
    if (document.getElementById('extraViniladoRebosadero')?.checked) {
        const p = parseFloat(document.getElementById('precioViniladoRebosadero')?.textContent?.replace(/[^\d.+]/g, '')) || 0;
        encintadoItems.push({ nombre: 'Vinilado en rebosadero', precio: p });
    }
    
    if (encintadoItems.length > 0) {
        html += lineaCategoria(`Encintados (color ${colorEncintado})`);
        encintadoItems.forEach(item => {
            html += lineaSubitem(item.nombre, item.precio);
        });
    }
    
    // =============================================
    // CATEGORÍA 2E: TALADROS Y TAPAS
    // =============================================
    const taladroItems = [];
    
    if (document.getElementById('extraTaladrosOverflow')?.checked) {
        const p = parseFloat(document.getElementById('precioTaladrosOverflow')?.textContent?.replace(/[^\d.+]/g, '')) || 0;
        taladroItems.push({ nombre: 'Taladros para overflow', precio: p });
    }
    if (document.getElementById('extraTaladroSubida')?.checked) {
        const p = parseFloat(document.getElementById('precioTaladroSubida')?.textContent?.replace(/[^\d.+]/g, '')) || 0;
        taladroItems.push({ nombre: 'Taladro adicional para subida', precio: p });
    }
    if (document.getElementById('extraTaladroVaciado')?.checked) {
        const p = parseFloat(document.getElementById('precioTaladroVaciado')?.textContent?.replace(/[^\d.+]/g, '')) || 0;
        taladroItems.push({ nombre: 'Taladro especial para vaciado', precio: p });
    }
    if (document.getElementById('extraTaladrosAdicionales')?.checked) {
        const p = parseFloat(document.getElementById('precioTaladrosAdicionales')?.textContent?.replace(/[^\d.+]/g, '')) || 0;
        const medida = document.getElementById('medidaTaladro')?.value === 'grande' ? '32-50mm' : '8-25mm';
        const cant = document.getElementById('cantidadTaladros')?.value || '1';
        taladroItems.push({ nombre: `Taladros adicionales ${medida} (${cant} ud${cant > 1 ? 's' : ''})`, precio: p });
    }
    if (document.getElementById('extraTapasNoCorrederas')?.checked) {
        const p = parseFloat(document.getElementById('precioTapasNoCorrederas')?.textContent?.replace(/[^\d.+]/g, '')) || 0;
        taladroItems.push({ nombre: 'Tapas para acuario (no correderas)', precio: p });
    }
    if (document.getElementById('extraTapasCorrederas')?.checked) {
        const p = parseFloat(document.getElementById('precioTapasCorrederas')?.textContent?.replace(/[^\d.+]/g, '')) || 0;
        taladroItems.push({ nombre: 'Tapas para acuario (correderas)', precio: p });
    }
    
    if (taladroItems.length > 0) {
        html += lineaCategoria('Taladros y tapas');
        taladroItems.forEach(item => {
            html += lineaSubitem(item.nombre, item.precio);
        });
    }
    
    // =============================================
    // CATEGORÍA 2F: PVC RETORNO Y BAJADAS
    // =============================================
    const pvcItems = [];
    
    if (document.getElementById('pvcInstalacionBasica')?.checked) {
        const p = parseFloat(document.getElementById('precioPvcInstalacionBasica')?.textContent?.replace(/[^\d.+]/g, '')) || 0;
        pvcItems.push({ nombre: 'Instalación básica de PVC (retorno + 3 bajadas + pasamuros)', precio: p });
    }
    if (document.getElementById('pvcAntiretorno')?.checked) {
        pvcItems.push({ nombre: 'Antiretorno en subida', precio: 85 });
    }
    if (document.getElementById('pvcTiradorAdicional')?.checked) {
        const preciosTir = { '1': 45, '2': 85, '3': 115 };
        const cantTir = document.getElementById('cantidadTiradores')?.value || '1';
        const pTir = preciosTir[cantTir] || 45;
        pvcItems.push({ nombre: `Tirador adicional equipos/reactores (${cantTir} ud${cantTir > 1 ? 's' : ''})`, precio: pTir });
    }
    
    if (pvcItems.length > 0) {
        html += lineaCategoria('PVC retorno y bajadas');
        pvcItems.forEach(item => {
            html += lineaSubitem(item.nombre, item.precio);
        });
    }
    
    // =============================================
    // CATEGORÍA 2G: FILTRACIÓN AVANZADA
    // =============================================
    const filtracionItems = [];
    
    if (document.getElementById('filtracionRefugioAlgas')?.checked) {
        filtracionItems.push({ nombre: 'Refugio de algas', precio: 65 });
    }
    if (document.getElementById('filtracionBarridoSump')?.checked) {
        filtracionItems.push({ nombre: 'Sistema de barrido para sump', precio: 65 });
    }
    
    if (filtracionItems.length > 0) {
        html += lineaCategoria('Filtración avanzada');
        filtracionItems.forEach(item => {
            html += lineaSubitem(item.nombre, item.precio);
        });
    }
    
    // =============================================
    // CATEGORÍA 3: SOPORTE / MESA
    // =============================================
    if (ds && ds.precioTotal > 0) {
        html += lineaCategoria('Soporte / Mesa');
        
        // Estructura acero
        if (ds.estructuraAcero?.habilitada && ds.estructuraAcero.precio > 0) {
            let descAcabado = '';
            if (ds.estructuraAcero.acabadoPulido) descAcabado = ' (pulido/matizado)';
            else if (ds.estructuraAcero.acabadoColor) descAcabado = ` (color ${ds.estructuraAcero.color})`;
            else if (ds.estructuraAcero.acabadoSinPulir) descAcabado = ' (sin pulir)';
            html += lineaItem('Estructura Acero Inox 316' + descAcabado, ds.estructuraAcero.precio);
        }
        
        // Mesa melamina
        if (ds.mesaMelamina?.habilitada && ds.mesaMelamina.precio > 0) {
            let colorMesa = '';
            if (ds.mesaMelamina.colorBlanco) colorMesa = ' - Blanca';
            else if (ds.mesaMelamina.colorNegro) colorMesa = ' - Negra';
            html += lineaItem('Mesa integral melamina' + colorMesa, ds.mesaMelamina.precio);
        }
        
        // Forrado melamina
        if (ds.forradoMelamina?.habilitado && ds.forradoMelamina.precio > 0) {
            html += lineaItem('Forrado melamina' + (ds.forradoMelamina.color ? ` (${ds.forradoMelamina.color})` : ''), ds.forradoMelamina.precio);
        }
        
        // Pies niveladores
        if (ds.piesNiveladores?.habilitados && ds.piesNiveladores.precio > 0) {
            html += lineaSubitem(`Pies niveladores (${ds.piesNiveladores.cantidad} uds.)`, ds.piesNiveladores.precio);
        }
        
        // Zona estanca mesa
        if (ds.zonaEstancaMesa?.habilitada && ds.zonaEstancaMesa.precio > 0) {
            html += lineaSubitem('Zona estanca equipos electrónicos', ds.zonaEstancaMesa.precio);
        }
        
        // Iluminación mesa
        if (ds.iluminacionMesa?.habilitada && ds.iluminacionMesa.precio > 0) {
            html += lineaSubitem(`Iluminación LED interior (${ds.iluminacionMesa.modulos} módulo${ds.iluminacionMesa.modulos > 1 ? 's' : ''})`, ds.iluminacionMesa.precio);
        }
        
        // Regleta mesa
        if (ds.regletaMesa?.habilitada && ds.regletaMesa.precio > 0) {
            const tipoTextoDesg = ds.regletaMesa.tipo === 'sobretension' ? ' con protección sobretensión' : ' normal';
            html += lineaSubitem(`Regleta 8 enchufes${tipoTextoDesg}`, ds.regletaMesa.precio);
        }
        
        // Zona estanca estructura
        if (ds.zonaEstanca?.habilitada && ds.zonaEstanca.precio > 0) {
            html += lineaSubitem('Zona estanca', ds.zonaEstanca.precio);
        }
    }
    
    // =============================================
    // CATEGORÍA 4: ACCESORIOS
    // =============================================
    if (ds && ds.accesorios) {
        const acc = ds.accesorios;
        const hayAccesorios = 
            (acc.ventilador?.habilitado && acc.ventilador.precio > 0) ||
            (acc.iluminacionModular?.habilitada && acc.iluminacionModular.precio > 0) ||
            (acc.regletaEstructura?.habilitada && acc.regletaEstructura.precio > 0);
        
        if (hayAccesorios) {
            html += lineaCategoria('Accesorios');
            
            if (acc.ventilador?.habilitado && acc.ventilador.precio > 0) {
                const tipoVentDesg = acc.ventilador.tipo === 'doble' ? 'doble (2 ventiladores)' : 'sencilla (1 ventilador)';
                html += lineaSubitem(`Ventilación ${tipoVentDesg}`, acc.ventilador.precio);
            }
            if (acc.iluminacionModular?.habilitada && acc.iluminacionModular.precio > 0)
                html += lineaSubitem(`Iluminación LED (${acc.iluminacionModular.modulos} módulo${acc.iluminacionModular.modulos > 1 ? 's' : ''})`, acc.iluminacionModular.precio);
            if (acc.regletaEstructura?.habilitada && acc.regletaEstructura.precio > 0) {
                const tipoTextoEstrDesg = acc.regletaEstructura.tipo === 'sobretension' ? ' con protección sobretensión' : ' normal';
                html += lineaSubitem(`Regleta 8 enchufes${tipoTextoEstrDesg}`, acc.regletaEstructura.precio);
            }
        }
    }
    
    // =============================================
    // CATEGORÍA 5: SUMP
    // =============================================
    if (ds && ds.sump?.habilitado && ds.sump.precio > 0) {
        html += lineaCategoria('Sump (sumidero)');
        // Calcular dimensiones del sump
        const largoSumpCm = largo - 30;
        const anchoSumpCm = ancho - 10;
        const altFrontalCm = 40;
        const altLateralCm = 50;
        // Grosor sump: 2 escalones por debajo del acuario, mínimo 6mm
        const grosoresSump = [6, 8, 10, 12, 15, 19];
        const codGrosor = parseInt(document.getElementById('grosor')?.value) || 3;
        const idxAcu = Math.min(codGrosor - 1, grosoresSump.length - 1);
        const grosorSumpMm = grosoresSump[Math.max(0, idxAcu - 2)];
        const descSump = `Sump ${largoSumpCm} x ${anchoSumpCm} x ${altFrontalCm}/${altLateralCm} cm en ${grosorSumpMm}mm`;
        const precioSumpUrna = ds.sump.precio - (ds.sump.vinilo?.precio || 0);
        html += lineaSubitem(descSump, precioSumpUrna);
        if (ds.sump.vinilo?.habilitado && ds.sump.vinilo.precio > 0) {
            html += lineaSubitem('Vinilo en sump (laterales y fondo)', ds.sump.vinilo.precio);
        }
        subtotal += ds.sump.precio;
    }
    
    // =============================================
    // TOTALES
    // =============================================
    const iva = subtotal * 0.21;
    const total = subtotal + iva;
    
    html += `
        <div class="dg-separator"></div>
        <div class="dg-total-row dg-subtotal-row">
            <span>Subtotal (sin IVA)</span>
            <span>${subtotal.toFixed(2)} &euro;</span>
        </div>
        <div class="dg-total-row dg-iva-row">
            <span>IVA (21%)</span>
            <span>${iva.toFixed(2)} &euro;</span>
        </div>
        <div class="dg-separator"></div>
        <div class="dg-total-row dg-total-final">
            <span>TOTAL FINAL</span>
            <span>${total.toFixed(2)} &euro;</span>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Actualizar precio principal
    document.getElementById('precioFinal').textContent = total.toFixed(2) + '€';
}

// === LEGACY actualizarDesglose / recalcularTotalDesglose eliminadas ===
// Reemplazadas por generarDesgloseCompleto()

// Stub para compatibilidad (llamadas existentes que referenciaban la vieja función)
function actualizarDesglose(data) {
    // No hacer nada - el desglose se genera bajo demanda con generarDesgloseCompleto()
}
function recalcularTotalDesglose() {
    // No hacer nada - reemplazado por generarDesgloseCompleto()
}

// === FIN stubs ===
/**
 * Protocolo web local para descarga/envio de presupuesto
 * (sin Apps Script ni backend)
 */
const PROTOCOLO_STORAGE_KEY = 'coraline-protocolo-web';

function base64UrlEncodeUtf8(texto) {
    const bytes = new TextEncoder().encode(texto);
    let binario = '';
    bytes.forEach(function(b) { binario += String.fromCharCode(b); });
    return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecodeUtf8(base64url) {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const binario = atob(base64 + padding);
    const bytes = Uint8Array.from(binario, function(c) { return c.charCodeAt(0); });
    return new TextDecoder().decode(bytes);
}

function capturarEstadoCotizadorParaCodigo() {
    const estado = {
        v: 1,
        m: {
            largo: document.getElementById('largo')?.value || '',
            ancho: document.getElementById('ancho')?.value || '',
            alto: document.getElementById('alto')?.value || '',
            grosor: document.getElementById('grosor')?.value || '',
            colorSilicona: document.getElementById('colorSilicona')?.value || '',
            tipoRefuerzo: document.getElementById('tipoRefuerzo')?.value || ''
        },
        checks: {},
        selects: {},
        inputs: {}
    };

    const idsExcluidos = ['protocoloNombre', 'protocoloTelefono', 'protocoloEmail', 'protocoloNotas'];

    document.querySelectorAll('input[id], select[id], textarea[id]').forEach(function(el) {
        if (!el.id || idsExcluidos.includes(el.id) || el.id.startsWith('protocolo')) return;

        if (el.tagName === 'SELECT') {
            if (el.value !== '') estado.selects[el.id] = el.value;
            return;
        }

        if (el.type === 'checkbox' || el.type === 'radio') {
            if (el.checked) estado.checks[el.id] = true;
            return;
        }

        if (el.value !== '') {
            estado.inputs[el.id] = el.value;
        }
    });

    return estado;
}

// Mapa de perimetros para encoding
var PERIMETRO_ENCODE = { '': 0, 'frontal': 1, 'frontal-derecho': 2, 'frontal-izquierdo': 3, 'frontal-derecho-trasera': 4, 'perimetro': 5 };
var PERIMETRO_DECODE = ['', 'frontal', 'frontal-derecho', 'frontal-izquierdo', 'frontal-derecho-trasera', 'perimetro'];

function generarCodigoRecuperacionActual() {
    var L = parseInt(document.getElementById('largo')?.value) || 0;
    var A = parseInt(document.getElementById('ancho')?.value) || 0;
    var H = parseInt(document.getElementById('alto')?.value) || 0;
    var G = parseInt(document.getElementById('grosor')?.value) || 3;

    // silicona: 0=transparente, 1=negro, 2=blanco
    var silVal = document.getElementById('colorSilicona')?.value || 'transparente';
    var sil = silVal === 'negro' ? 1 : silVal === 'blanco' ? 2 : 0;

    // refuerzo: 0=ninguno, 1=perimetral, 2=perimetral+tirantes
    var refVal = document.getElementById('tipoRefuerzo')?.value || 'ninguno';
    var ref = refVal === 'perimetral-tirantes' ? 2 : refVal === 'perimetral' ? 1 : 0;

    // opticos (4 bits)
    var oF = document.getElementById('opticoFrontal')?.checked ? 1 : 0;
    var oT = document.getElementById('opticoTrasera')?.checked ? 1 : 0;
    var oLI = document.getElementById('opticoLateralIzq')?.checked ? 1 : 0;
    var oLD = document.getElementById('opticoLateralDer')?.checked ? 1 : 0;
    var opt = oF | (oT << 1) | (oLI << 2) | (oLD << 3);

    // rebosadero: 0=ninguno, 1-6
    var reb = 0;
    var rebIds = ['rebosaderoGeneral','rebosaderoEsquinero','rebosaderoEtapa','rebosaderoDiagonal','rebosaderoColumna','rebosaderoExterno'];
    rebIds.forEach(function(id, i) { if (document.getElementById(id)?.checked) reb = i + 1; });

    // vinilos urna
    var vLD = document.getElementById('extraViniloLateralDerecho')?.checked ? 1 : 0;
    var vLI = document.getElementById('extraViniloLateralIzquierdo')?.checked ? 1 : 0;
    var vT = document.getElementById('extraViniloTrasero')?.checked ? 1 : 0;
    var vFVal = document.getElementById('viniloFondo')?.value || 'no';
    var vF = vFVal === 'negro' ? 1 : vFVal === 'blanco' ? 2 : vFVal === 'azul' ? 3 : 0;

    // encintados
    var encSAct = document.getElementById('extraEncintadoSuperficie')?.checked;
    var encS = encSAct ? (PERIMETRO_ENCODE[document.getElementById('perimetroEncintadoSuperficie')?.value] || 1) : 0;
    var encBAct = document.getElementById('extraEncintadoBase')?.checked;
    var encB = encBAct ? (PERIMETRO_ENCODE[document.getElementById('perimetroEncintadoBase')?.value] || 1) : 0;

    // soporte: 0=ninguno, 1=acero_pul, 2=acero_col, 3=acero_sin, 4=mesa_blanco, 5=mesa_negro
    var sop = 0;
    if (document.getElementById('checkEstructuraAcero')?.checked) {
        if (document.getElementById('acabadoSinPulir')?.checked) sop = 3;
        else if (document.getElementById('acabadoColor')?.checked) sop = 2;
        else sop = 1;
    } else if (document.getElementById('checkMesaMelamina')?.checked) {
        sop = document.getElementById('mesaMelaminaNegro')?.checked ? 5 : 4;
    }

    // sump
    var sump = document.getElementById('checkSump')?.checked ? 1 : 0;

    // Empaquetar en 32 bits
    // [1:0] sil, [3:2] ref, [7:4] opticos, [10:8] rebosadero
    // [11] vLD, [12] vLI, [13] vT, [15:14] vF
    // [18:16] encS, [21:19] encB, [24:22] sop, [25] sump
    var flags = 0;
    flags |= (sil & 0x3);
    flags |= (ref & 0x3) << 2;
    flags |= (opt & 0xF) << 4;
    flags |= (reb & 0x7) << 8;
    flags |= vLD << 11;
    flags |= vLI << 12;
    flags |= vT << 13;
    flags |= (vF & 0x3) << 14;
    flags |= (encS & 0x7) << 16;
    flags |= (encB & 0x7) << 19;
    flags |= (sop & 0x7) << 22;
    flags |= sump << 25;

    var hex = (flags >>> 0).toString(16).toUpperCase().padStart(7, '0');
    return 'CRL-' + L + '-' + A + '-' + H + '-' + G + '-' + hex;
}

async function aplicarCodigoRecuperacion(codigo) {
    var raw = (codigo || '').trim();

    // Compatibilidad con códigos largos del formato anterior (CRL3D-...)
    if (raw.startsWith('CRL3D-')) {
        return await _aplicarCodigoLegado(raw);
    }

    if (!raw.startsWith('CRL-')) {
        throw new Error('Formato de código inválido. Debe empezar por CRL-');
    }

    var partes = raw.slice(4).split('-');
    if (partes.length !== 5) {
        throw new Error('Código incompleto (se esperan 5 secciones separadas por -).');
    }

    var L = partes[0], A = partes[1], H = partes[2], G = partes[3];
    var flags = parseInt(partes[4], 16);
    if (isNaN(flags)) throw new Error('Código corrupto.');

    var setVal = function(id, val) {
        var el = document.getElementById(id);
        if (!el) return;
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    var setChk = function(id, val) {
        var el = document.getElementById(id);
        if (!el) return;
        el.checked = !!val;
        el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    // Desmarcar todos los checkboxes primero
    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(function(el) {
        if (el.id && !el.id.startsWith('protocolo')) el.checked = false;
    });

    // Medidas
    setVal('largo', L);  setVal('ancho', A);  setVal('alto', H);  setVal('grosor', G);

    // Decodificar flags
    var sil  = flags & 0x3;
    var ref  = (flags >> 2) & 0x3;
    var opt  = (flags >> 4) & 0xF;
    var reb  = (flags >> 8) & 0x7;
    var vLD  = (flags >> 11) & 0x1;
    var vLI  = (flags >> 12) & 0x1;
    var vT   = (flags >> 13) & 0x1;
    var vF   = (flags >> 14) & 0x3;
    var encS = (flags >> 16) & 0x7;
    var encB = (flags >> 19) & 0x7;
    var sop  = (flags >> 22) & 0x7;
    var sump = (flags >> 25) & 0x1;

    // Silicona y refuerzo
    setVal('colorSilicona', ['transparente','negro','blanco'][sil] || 'transparente');
    setVal('tipoRefuerzo', ['ninguno','perimetral','perimetral-tirantes'][ref] || 'ninguno');

    // Ópticos
    setChk('opticoFrontal', opt & 1);
    setChk('opticoTrasera', (opt >> 1) & 1);
    setChk('opticoLateralIzq', (opt >> 2) & 1);
    setChk('opticoLateralDer', (opt >> 3) & 1);

    // Rebosadero
    var rebIds2 = ['rebosaderoGeneral','rebosaderoEsquinero','rebosaderoEtapa','rebosaderoDiagonal','rebosaderoColumna','rebosaderoExterno'];
    rebIds2.forEach(function(id) { setChk(id, false); });
    if (reb >= 1 && reb <= 6) setChk(rebIds2[reb - 1], true);

    // Vinilos urna
    setChk('extraViniloLateralDerecho', vLD);
    setChk('extraViniloLateralIzquierdo', vLI);
    setChk('extraViniloTrasero', vT);
    setVal('viniloFondo', ['no','negro','blanco','azul'][vF] || 'no');

    // Encintados
    setChk('extraEncintadoSuperficie', encS > 0);
    if (encS > 0) setVal('perimetroEncintadoSuperficie', PERIMETRO_DECODE[encS] || 'frontal');
    setChk('extraEncintadoBase', encB > 0);
    if (encB > 0) setVal('perimetroEncintadoBase', PERIMETRO_DECODE[encB] || 'frontal');

    // Soporte
    if (sop >= 1 && sop <= 3) {
        setChk('checkEstructuraAcero', true);
        if (typeof toggleEstructuraAcero === 'function') toggleEstructuraAcero();
        if (sop === 1) setChk('acabadoPulidoMatizado', true);
        else if (sop === 2) setChk('acabadoColor', true);
        else if (sop === 3) setChk('acabadoSinPulir', true);
        if (typeof seleccionarAcabadoAcero === 'function') {
            seleccionarAcabadoAcero(sop === 1 ? 'pulidoMatizado' : sop === 2 ? 'color' : 'sinPulir');
        }
    } else if (sop >= 4 && sop <= 5) {
        setChk('checkMesaMelamina', true);
        if (typeof toggleMesaMelamina === 'function') toggleMesaMelamina();
        setChk(sop === 5 ? 'mesaMelaminaNegro' : 'mesaMelaminaBlanco', true);
    }

    // Sump
    if (sump) {
        setChk('checkSump', true);
        if (typeof window.gestionarCambioSump === 'function') {
            window.gestionarCambioSump(document.getElementById('checkSump'));
        }
    }

    // Recalcular
    if (typeof calcularPrecio === 'function') await calcularPrecio();
    if (typeof recalcularSoporte === 'function') recalcularSoporte();
    if (typeof generarDesgloseCompleto === 'function') generarDesgloseCompleto();

    localStorage.setItem('ultimo-codigo-configuracion', raw);
}

// Función de compatibilidad para códigos del formato anterior (CRL3D-...)
async function _aplicarCodigoLegado(raw) {
    const json = base64UrlDecodeUtf8(raw.slice(6));
    const estado = JSON.parse(json);
    if (!estado || !estado.v) throw new Error('Código no reconocido.');

    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(function(el) {
        if (el.id && !el.id.startsWith('protocolo')) el.checked = false;
    });
    Object.keys(estado.inputs || {}).forEach(function(id) {
        const el = document.getElementById(id); if (!el) return;
        el.value = estado.inputs[id];
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    Object.keys(estado.selects || {}).forEach(function(id) {
        const el = document.getElementById(id); if (!el) return;
        el.value = estado.selects[id];
        el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    Object.keys(estado.checks || {}).forEach(function(id) {
        const el = document.getElementById(id); if (!el) return;
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    if (typeof calcularPrecio === 'function') await calcularPrecio();
    if (typeof recalcularSoporte === 'function') recalcularSoporte();
    if (typeof generarDesgloseCompleto === 'function') generarDesgloseCompleto();
    localStorage.setItem('ultimo-codigo-configuracion', raw);
}

window.recuperarConfiguracionDesdeCodigo = async function() {
    const input = document.getElementById('recuperarCodigoInput');
    const boton = document.getElementById('recuperarCodigoBtn');
    const valor = (input?.value || '').trim();

    if (!valor) {
        alert('Introduce un código de configuración.');
        return;
    }

    const textoOriginal = boton ? boton.textContent : '';
    if (boton) {
        boton.disabled = true;
        boton.textContent = 'Recuperando...';
    }

    try {
        await aplicarCodigoRecuperacion(valor);
        alert('Configuración recuperada correctamente.');
        document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        alert('No se pudo recuperar la configuración: ' + error.message);
    } finally {
        if (boton) {
            boton.disabled = false;
            boton.textContent = textoOriginal || 'Recupera tu configuración';
        }
    }
};

function parseEuros(texto) {
    if (!texto) return 0;
    const limpio = String(texto)
        .replace(/\s/g, '')
        .replace(/€/g, '')
        .replace(/[^\d,.-]/g, '')
        .replace(/,(?=\d{1,2}$)/, '.');
    const numero = parseFloat(limpio.replace(/,/g, ''));
    return Number.isFinite(numero) ? numero : 0;
}

function obtenerSessionIdProtocolo() {
    const key = 'coraline-session-id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = 'ses-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
        localStorage.setItem(key, id);
    }
    return id;
}

function extraerLineasDesglose() {
    const lineas = [];
    const raiz = document.getElementById('desgloseGenerado');
    if (!raiz) return lineas;

    let categoriaActual = 'General';
    const nodos = raiz.querySelectorAll('.dg-categoria, .dg-item, .dg-subitem, .dg-total-row');
    nodos.forEach(function(nodo) {
        if (nodo.classList.contains('dg-categoria')) {
            categoriaActual = (nodo.textContent || 'General').trim();
            return;
        }

        const spans = nodo.querySelectorAll('span');
        if (spans.length < 2) return;

        const nombre = (spans[0].textContent || '').trim();
        const precioTexto = (spans[1].textContent || '').trim();
        if (!nombre) return;

        lineas.push({
            categoria: categoriaActual,
            tipo: nodo.classList.contains('dg-subitem') ? 'subitem' : (nodo.classList.contains('dg-total-row') ? 'total' : 'item'),
            nombre: nombre,
            precio: parseEuros(precioTexto),
            precioTexto: precioTexto
        });
    });

    return lineas;
}

function obtenerSalidaCotizador() {
    const data = window.datosCalculoActual;
    if (!data) return null;

    const largo = parseFloat(document.getElementById('largo')?.value || '0');
    const ancho = parseFloat(document.getElementById('ancho')?.value || '0');
    const alto = parseFloat(document.getElementById('alto')?.value || '0');
    const grosorSel = document.getElementById('grosor');
    const grosorTexto = grosorSel ? grosorSel.options[grosorSel.selectedIndex].text : '';
    const colorSiliconaSel = document.getElementById('colorSilicona');
    const colorSilicona = colorSiliconaSel ? colorSiliconaSel.options[colorSiliconaSel.selectedIndex].text : '';
    const tipoRefuerzo = document.getElementById('tipoRefuerzo')?.value || 'ninguno';

    const lineas = extraerLineasDesglose();
    const subtotal = lineas.find(function(l) { return /Subtotal/i.test(l.nombre); })?.precio || 0;
    const iva = lineas.find(function(l) { return /^IVA/i.test(l.nombre); })?.precio || 0;
    const total = lineas.find(function(l) { return /TOTAL FINAL/i.test(l.nombre); })?.precio || parseEuros(document.getElementById('precioFinal')?.textContent || '0');

    return {
        version: 'coraline-protocolo-web-v1',
        accion: 'pendiente',
        fechaISO: new Date().toISOString(),
        sessionId: obtenerSessionIdProtocolo(),
        pagina: window.location.href,
        cotizador: {
            medidas: { largo: largo, ancho: ancho, alto: alto, grosor: grosorTexto },
            litros: data.litros || 0,
            colorSilicona: colorSilicona,
            tipoRefuerzo: tipoRefuerzo,
            precioFinal: total,
            precioSinIva: subtotal,
            iva: iva,
            ratioSeguridad: data.ratioSeguridad,
            deflexion: data.deflexion
        },
        desglose: {
            lineas: lineas,
            html: document.getElementById('desgloseGenerado')?.innerHTML || ''
        },
        historialSesion: JSON.parse(localStorage.getItem('historialCotizaciones') || '[]')
    };
}

function registrarProtocolo(payload) {
    const historico = JSON.parse(localStorage.getItem(PROTOCOLO_STORAGE_KEY) || '[]');
    historico.unshift(payload);
    localStorage.setItem(PROTOCOLO_STORAGE_KEY, JSON.stringify(historico.slice(0, 30)));
}

function construirTextoResumen(payload, cliente) {
    const c = cliente || {};
    const m = payload.cotizador.medidas;
    const lineas = [];

    lineas.push('Protocolo: ' + payload.version);
    lineas.push('Fecha: ' + payload.fechaISO);
    lineas.push('Sesion: ' + payload.sessionId);
    lineas.push('Accion: ' + payload.accion);
    lineas.push('');
    lineas.push('Cliente');
    lineas.push('- Nombre: ' + (c.nombre || 'No informado'));
    lineas.push('- Telefono: ' + (c.telefono || 'No informado'));
    lineas.push('- Email: ' + (c.email || 'No informado'));
    if (c.instrucciones) {
        lineas.push('- Instrucciones: ' + c.instrucciones);
    }
    lineas.push('');
    lineas.push('Cotizador');
    lineas.push('- Medidas: ' + m.largo + ' x ' + m.ancho + ' x ' + m.alto + ' cm');
    lineas.push('- Grosor: ' + m.grosor);
    lineas.push('- Litros: ' + payload.cotizador.litros);
    lineas.push('- Refuerzo: ' + payload.cotizador.tipoRefuerzo);
    lineas.push('- Precio sin IVA: ' + payload.cotizador.precioSinIva.toFixed(2) + ' EUR');
    lineas.push('- IVA: ' + payload.cotizador.iva.toFixed(2) + ' EUR');
    lineas.push('- Precio final: ' + payload.cotizador.precioFinal.toFixed(2) + ' EUR');
    lineas.push('');
    lineas.push('Desglose');

    payload.desglose.lineas.forEach(function(l) {
        const prefijo = l.tipo === 'subitem' ? '  - ' : '- ';
        lineas.push(prefijo + l.nombre + ': ' + l.precio.toFixed(2) + ' EUR');
    });

    lineas.push('');
    lineas.push('Contacto Coraline: info@coralineaquariums.com | +34 937 04 44 95');

    return lineas.join('\n');
}

// ============================================================
// PRECARGA DEL LOGO PARA PDF
// ============================================================
window.__LOGO_CORALINE_B64 = null;
window.__LOGO_CORALINE_RATIO = 1; // ancho/alto
(function precargarLogoCoraline() {
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            try {
                const c = document.createElement('canvas');
                c.width = img.naturalWidth || 400;
                c.height = img.naturalHeight || 400;
                const ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0);
                window.__LOGO_CORALINE_B64 = c.toDataURL('image/png');
                window.__LOGO_CORALINE_RATIO = c.width / c.height;
            } catch (e) {
                console.warn('No se pudo convertir logo a base64:', e.message);
            }
        };
        img.onerror = function() { console.warn('No se pudo cargar el logo Coraline para el PDF.'); };
        img.src = 'images/coralinelogo3D.png';
    } catch (e) { /* silencioso */ }
})();

// ============================================================
// PALETA DE COLORES (tonos azulados suaves, fondos claros)
// ============================================================
const PDF_COLORS = {
    azulMarca:    [82, 200, 255],   // #52C8FF
    azulOscuro:   [37, 99, 145],    // #256391  (títulos)
    azulMedio:    [110, 175, 215],  // #6EAFD7
    azulSuave:    [234, 246, 252],  // #EAF6FC  (banda cabecera)
    azulFila:    [245, 250, 254],   // #F5FAFE  (fila alterna tabla)
    azulBorde:    [180, 215, 235],  // #B4D7EB
    grisTxt:      [60, 70, 80],     // texto principal
    grisSuave:    [120, 130, 140],  // texto secundario
    blanco:       [255, 255, 255]
};

function generarPDFPresupuesto(payload, cliente) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        throw new Error('No se pudo cargar la libreria de PDF.');
    }

    const jsPDFCtor = window.jspdf.jsPDF;
    const doc = new jsPDFCtor({ unit: 'mm', format: 'a4' });
    const ancho = doc.internal.pageSize.getWidth();   // 210
    const alto  = doc.internal.pageSize.getHeight();  // 297
    const margen = 14;
    const anchoUtil = ancho - margen * 2;
    let y = 0;

    // ---------- helpers de color ----------
    function setRellenoPDF(c) { doc.setFillColor(c[0], c[1], c[2]); }
    function setBordePDF(c)   { doc.setDrawColor(c[0], c[1], c[2]); }
    function setTextoPDF(c)   { doc.setTextColor(c[0], c[1], c[2]); }

    // ---------- cabecera (página 1) ----------
    function dibujarCabeceraPrincipal() {
        // Banda azul suave de fondo
        setRellenoPDF(PDF_COLORS.azulSuave);
        doc.rect(0, 0, ancho, 34, 'F');
        // Línea inferior fina azul marca
        setRellenoPDF(PDF_COLORS.azulMarca);
        doc.rect(0, 34, ancho, 0.8, 'F');

        // Logo (si está cargado)
        let xTexto = margen;
        if (window.__LOGO_CORALINE_B64) {
            try {
                const altoLogo = 22;
                const anchoLogo = altoLogo * (window.__LOGO_CORALINE_RATIO || 1);
                doc.addImage(window.__LOGO_CORALINE_B64, 'PNG', margen, 6, anchoLogo, altoLogo);
                xTexto = margen + anchoLogo + 6;
            } catch (e) { /* fallback sin logo */ }
        }

        // URL de la web (sustituye al título en mayúsculas)
        setTextoPDF(PDF_COLORS.azulOscuro);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('www.coralineaquariums.com', xTexto, 14);

        // Subtítulo descriptivo
        setTextoPDF(PDF_COLORS.grisTxt);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Diseño, fabricación y montaje de acuarios a medida', xTexto, 20);

        // Fecha justo debajo del subtítulo, formato "8 de mayo de 2026"
        const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        setTextoPDF(PDF_COLORS.grisSuave);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text(fecha, xTexto, 25.5);
    }

    // ---------- cabecera reducida (páginas siguientes) ----------
    function dibujarCabeceraSlim() {
        setRellenoPDF(PDF_COLORS.azulSuave);
        doc.rect(0, 0, ancho, 14, 'F');
        setRellenoPDF(PDF_COLORS.azulMarca);
        doc.rect(0, 14, ancho, 0.4, 'F');
        setTextoPDF(PDF_COLORS.azulOscuro);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('www.coralineaquariums.com', margen, 9);
        setTextoPDF(PDF_COLORS.grisSuave);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Presupuesto detallado', ancho - margen, 9, { align: 'right' });
    }

    // ---------- pie de página (en todas) ----------
    function dibujarPie(numPag, totalPag) {
        const yPie = alto - 12;
        setBordePDF(PDF_COLORS.azulBorde);
        doc.setLineWidth(0.2);
        doc.line(margen, yPie, ancho - margen, yPie);

        setTextoPDF(PDF_COLORS.grisSuave);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Coraline Aquariums  ·  info@coralineaquariums.com  ·  +34 937 04 44 95', margen, yPie + 5);
        doc.text('Página ' + numPag + ' de ' + totalPag, ancho - margen, yPie + 5, { align: 'right' });
    }

    // ---------- gestión de páginas ----------
    let numeroPaginaActual = 1;
    function nuevaPagina() {
        doc.addPage();
        numeroPaginaActual++;
        dibujarCabeceraSlim();
        y = 22;
    }
    function reservar(necesario) {
        if (y + necesario <= alto - 18) return;
        nuevaPagina();
    }

    // ---------- componentes de contenido ----------
    function tituloSeccion(txt) {
        reservar(14);
        // Pequeña barra azul a la izquierda
        setRellenoPDF(PDF_COLORS.azulMarca);
        doc.rect(margen, y, 2.2, 6.5, 'F');
        // Fondo azul muy suave del título
        setRellenoPDF(PDF_COLORS.azulSuave);
        doc.rect(margen + 2.2, y, anchoUtil - 2.2, 6.5, 'F');
        // Texto
        setTextoPDF(PDF_COLORS.azulOscuro);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(txt.toUpperCase(), margen + 5, y + 4.5);
        y += 9;
    }

    function dibujarCajaInfo(filas) {
        // Caja con borde azul suave; cada fila: etiqueta gris + valor en oscuro
        const padX = 4;
        const padY = 3;
        const altoFila = 5.2;
        const altoCaja = padY * 2 + filas.length * altoFila;
        reservar(altoCaja + 3);

        setBordePDF(PDF_COLORS.azulBorde);
        setRellenoPDF(PDF_COLORS.blanco);
        doc.setLineWidth(0.3);
        doc.roundedRect(margen, y, anchoUtil, altoCaja, 1.5, 1.5, 'FD');

        let yy = y + padY + 3.5;
        filas.forEach(function(f) {
            setTextoPDF(PDF_COLORS.grisSuave);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(f.label + ':', margen + padX, yy);

            setTextoPDF(PDF_COLORS.grisTxt);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            const valor = String(f.valor == null || f.valor === '' ? '—' : f.valor);
            doc.text(valor, margen + 42, yy);
            yy += altoFila;
        });
        y += altoCaja + 3;
    }

    function dibujarTablaDesglose(lineas) {
        const colPrecioX = ancho - margen - 4;
        const altoFila = 6.2;
        const padX = 4;

        // Cabecera de tabla
        reservar(altoFila + 4);
        setRellenoPDF(PDF_COLORS.azulMarca);
        doc.rect(margen, y, anchoUtil, altoFila, 'F');
        setTextoPDF(PDF_COLORS.blanco);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('CONCEPTO', margen + padX, y + 4.2);
        doc.text('IMPORTE', colPrecioX, y + 4.2, { align: 'right' });
        y += altoFila;

        let alterna = false;
        lineas.forEach(function(item) {
            reservar(altoFila + 1);
            const esTotal = item.tipo === 'total';
            const esSub = item.tipo === 'subitem';

            if (esTotal) {
                setRellenoPDF(PDF_COLORS.azulSuave);
                doc.rect(margen, y, anchoUtil, altoFila, 'F');
            } else if (alterna) {
                setRellenoPDF(PDF_COLORS.azulFila);
                doc.rect(margen, y, anchoUtil, altoFila, 'F');
            }
            // borde inferior fino
            setBordePDF(PDF_COLORS.azulBorde);
            doc.setLineWidth(0.1);
            doc.line(margen, y + altoFila, ancho - margen, y + altoFila);

            // texto
            setTextoPDF(esTotal ? PDF_COLORS.azulOscuro : PDF_COLORS.grisTxt);
            doc.setFont('helvetica', esTotal ? 'bold' : (esSub ? 'normal' : 'normal'));
            doc.setFontSize(esTotal ? 10 : 9.5);
            const sangria = esSub ? 8 : 0;
            const nombre = (esSub ? '› ' : '') + String(item.nombre || '');
            doc.text(nombre, margen + padX + sangria, y + 4.3);

            const precio = (Number(item.precio) || 0).toFixed(2) + ' €';
            doc.setFont('helvetica', 'bold');
            doc.text(precio, colPrecioX, y + 4.3, { align: 'right' });

            y += altoFila;
            alterna = !alterna;
        });
        y += 2;
    }

    function dibujarCajaTotal(subtotal, iva, total) {
        reservar(28);
        const altoCaja = 24;
        // Fondo azul suave + borde azul marca
        setRellenoPDF(PDF_COLORS.azulSuave);
        setBordePDF(PDF_COLORS.azulMarca);
        doc.setLineWidth(0.7);
        doc.roundedRect(margen, y, anchoUtil, altoCaja, 2, 2, 'FD');

        setTextoPDF(PDF_COLORS.grisTxt);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.text('Subtotal sin IVA', margen + 5, y + 7);
        doc.text('IVA (21%)',         margen + 5, y + 12.5);

        doc.setFont('helvetica', 'bold');
        doc.text(subtotal.toFixed(2) + ' €', margen + 70, y + 7);
        doc.text(iva.toFixed(2) + ' €',      margen + 70, y + 12.5);

        // Total grande, alineado a la derecha
        setTextoPDF(PDF_COLORS.azulOscuro);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('TOTAL', ancho - margen - 5, y + 9, { align: 'right' });
        doc.setFontSize(20);
        doc.text(total.toFixed(2) + ' €', ancho - margen - 5, y + 18, { align: 'right' });

        y += altoCaja + 4;
    }

    function dibujarCajaCodigo(codigo) {
        reservar(20);
        const altoCaja = 16;
        setBordePDF(PDF_COLORS.azulMedio);
        setRellenoPDF(PDF_COLORS.blanco);
        doc.setLineWidth(0.4);
        doc.setLineDashPattern([1.2, 1.2], 0);
        doc.roundedRect(margen, y, anchoUtil, altoCaja, 1.5, 1.5, 'FD');
        doc.setLineDashPattern([], 0);

        setTextoPDF(PDF_COLORS.grisSuave);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text('CÓDIGO DE RECUPERACIÓN DE LA CONFIGURACIÓN', margen + 4, y + 5);

        setTextoPDF(PDF_COLORS.azulOscuro);
        doc.setFont('courier', 'bold');
        doc.setFontSize(13);
        doc.text(String(codigo), margen + anchoUtil / 2, y + 12, { align: 'center' });
        y += altoCaja + 4;
    }

    // ============================================================
    // RENDERIZADO
    // ============================================================
    dibujarCabeceraPrincipal();
    y = 42;

    // --- Datos cliente ---
    tituloSeccion('Datos de cliente');
    dibujarCajaInfo([
        { label: 'Nombre',   valor: cliente.nombre || 'No informado' },
        { label: 'Teléfono', valor: cliente.telefono || 'No informado' },
        { label: 'Email',    valor: cliente.email || 'No informado' }
    ]);
    if (cliente.instrucciones) {
        setTextoPDF(PDF_COLORS.grisTxt);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        const txt = doc.splitTextToSize('Instrucciones: ' + cliente.instrucciones, anchoUtil);
        reservar(txt.length * 4 + 2);
        doc.text(txt, margen, y);
        y += txt.length * 4 + 2;
    }

    // --- Configuración acuario ---
    const m = payload.cotizador.medidas;
    tituloSeccion('Configuración del acuario');
    dibujarCajaInfo([
        { label: 'Medidas',    valor: m.largo + ' × ' + m.ancho + ' × ' + m.alto + ' cm' },
        { label: 'Grosor',     valor: m.grosor },
        { label: 'Capacidad',  valor: payload.cotizador.litros + ' litros' },
        { label: 'Refuerzo',   valor: payload.cotizador.tipoRefuerzo },
        { label: 'Silicona',   valor: payload.cotizador.colorSilicona }
    ]);

    // --- Desglose económico ---
    tituloSeccion('Desglose económico');
    dibujarTablaDesglose(payload.desglose.lineas || []);

    // --- Totales ---
    dibujarCajaTotal(
        payload.cotizador.precioSinIva || 0,
        payload.cotizador.iva || 0,
        payload.cotizador.precioFinal || 0
    );

    // --- Código de recuperación ---
    const codigoRecuperacion = payload.codigoRecuperacion || localStorage.getItem('ultimo-codigo-configuracion') || '';
    if (codigoRecuperacion) {
        dibujarCajaCodigo(codigoRecuperacion);
    }

    // --- Nota legal pequeña ---
    reservar(14);
    setTextoPDF(PDF_COLORS.grisSuave);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    const nota = 'Documento informativo generado automáticamente. Los precios pueden variar según verificación técnica final. ' +
                 'Para confirmar el pedido, contacta con nosotros en info@coralineaquariums.com.';
    const lineasNota = doc.splitTextToSize(nota, anchoUtil);
    doc.text(lineasNota, margen, y);
    y += lineasNota.length * 3.5;

    // --- Pies en todas las páginas ---
    const totalPags = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPags; i++) {
        doc.setPage(i);
        dibujarPie(i, totalPags);
    }

    return doc;
}

function descargarDocumentoPDF(doc, cliente) {
    const nombreSeguro = (cliente.nombre || 'cliente').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const fecha = new Date().toISOString().slice(0, 10);
    const archivo = 'presupuesto-coraline-' + (nombreSeguro || 'cliente') + '-' + fecha + '.pdf';
    // Usar arraybuffer + tipo octet-stream para forzar descarga y evitar que el navegador abra el PDF en una ventana nueva
    const bytes = doc.output('arraybuffer');
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = archivo;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 500);
    return archivo;
}

function abrirBorradorCorreo(destino, asunto, cuerpo, cc) {
    const partes = [];
    if (cc) partes.push('cc=' + encodeURIComponent(cc));
    partes.push('subject=' + encodeURIComponent(asunto));
    partes.push('body=' + encodeURIComponent(cuerpo));
    window.location.href = 'mailto:' + encodeURIComponent(destino) + '?' + partes.join('&');
}

async function enviarSolicitudPresupuestoBackend(payload, cliente, pdfBase64) {
    const m = payload.cotizador.medidas;
    const datos = {
        accion: 'enviar_presupuesto',
        nombre: cliente.nombre,
        apellidos: '',
        email: cliente.email,
        medioContacto: cliente.telefono ? 'telefono' : 'email',
        telefono: cliente.telefono || '',
        mensaje: cliente.instrucciones || '',
        configuracion: {
            largo: m.largo,
            ancho: m.ancho,
            alto: m.alto,
            grosor: m.grosor,
            litros: payload.cotizador.litros,
            precio: payload.cotizador.precioFinal,
            refuerzos: {
                perimetrales: /perimetral/i.test(payload.cotizador.tipoRefuerzo || ''),
                tirantes: /tirante/i.test(payload.cotizador.tipoRefuerzo || '')
            },
            opticos: payload.cotizador.opticos || {}
        },
        historialCotizaciones: JSON.parse(localStorage.getItem('historialCotizaciones') || '[]'),
        desglose: payload.desglose,
        pdfBase64: pdfBase64,
        token: window.TOKEN_SEGURIDAD || 'TOKEN_NO_CONFIGURADO'
    };

    const response = await fetch(EMAIL_BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(datos)
    });

    if (!response.ok) {
        throw new Error('Error en la conexión con el servidor (HTTP ' + response.status + ')');
    }

    const resultado = await response.json();
    if (!resultado.success) {
        throw new Error(resultado.message || resultado.error || 'No se pudo enviar la solicitud');
    }

    return resultado;
}

function abrirModalProtocolo(modo) {
    const modal = document.getElementById('protocoloModal');
    if (!modal) return;

    const titulo = document.getElementById('protocoloTitulo');
    const ayuda = document.getElementById('protocoloAyuda');
    const boton = document.getElementById('protocoloAccionBtn');
    const campoNotas = document.getElementById('protocoloNotasField');
    const campoNombre = document.getElementById('protocoloNombre');
    const campoEmail = document.getElementById('protocoloEmail');

    document.getElementById('protocoloModo').value = modo;

    const TEXTO_AYUDA = 'Indicanos tu nombre y tus datos. También puedes poner cualquier comentario que quieras hacernos, o aquello que necesites equipar en tu configuración y que no esté en las opciones de nuestro cotizador.';

    // Limpiar campos al abrir
    document.getElementById('protocoloNombre').value = '';
    document.getElementById('protocoloTelefono').value = '';
    document.getElementById('protocoloEmail').value = '';
    if (document.getElementById('protocoloNotas')) document.getElementById('protocoloNotas').value = '';

    if (modo === 'enviar') {
        titulo.textContent = 'Enviar presupuesto en PDF por correo';
        ayuda.textContent = TEXTO_AYUDA;
        boton.textContent = 'Enviar PDF por correo';
        campoNotas.style.display = '';
        campoNombre.required = true;
        campoEmail.required = true;
    } else {
        titulo.textContent = 'Descargar presupuesto en PDF';
        ayuda.textContent = TEXTO_AYUDA;
        boton.textContent = 'Descargar PDF';
        campoNotas.style.display = '';
        campoNombre.required = true;
        campoEmail.required = false;
    }

    boton.disabled = true;
    verificarCamposProtocolo();

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
}

function cerrarModalProtocolo() {
    const modal = document.getElementById('protocoloModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
}

async function ejecutarAccionProtocolo() {
    const modo = document.getElementById('protocoloModo')?.value || 'descargar';
    const cliente = {
        nombre: (document.getElementById('protocoloNombre')?.value || '').trim(),
        telefono: (document.getElementById('protocoloTelefono')?.value || '').trim(),
        email: (document.getElementById('protocoloEmail')?.value || '').trim(),
        instrucciones: (document.getElementById('protocoloNotas')?.value || '').trim()
    };

    if (modo === 'enviar') {
        if (!cliente.nombre || !cliente.email) return;
    } else {
        if (!cliente.nombre || (!cliente.telefono && !cliente.email)) return;
    }

    const payload = obtenerSalidaCotizador();
    if (!payload) {
        alert('Debes calcular el presupuesto antes de generar o enviar PDF.');
        return;
    }

    payload.accion = modo === 'enviar' ? 'enviar_presupuesto_pdf' : 'descargar_pdf';
    payload.cliente = cliente;
    payload.codigoRecuperacion = generarCodigoRecuperacionActual();
    localStorage.setItem('ultimo-codigo-configuracion', payload.codigoRecuperacion);
    registrarProtocolo(payload);

    if (modo === 'enviar') {
        const boton = document.getElementById('protocoloAccionBtn');
        const textoOriginal = boton ? boton.textContent : '';

        if (boton) {
            boton.disabled = true;
            boton.textContent = 'Enviando...';
        }

        try {
            const doc = generarPDFPresupuesto(payload, cliente);
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            await enviarSolicitudPresupuestoBackend(payload, cliente, pdfBase64);
            cerrarModalProtocolo();
            alert('Solicitud enviada correctamente a Coraline Aquariums.');
        } catch (error) {
            alert('No se pudo enviar la solicitud: ' + error.message);
        } finally {
            if (boton) {
                boton.textContent = textoOriginal || 'Enviar PDF por correo';
                verificarCamposProtocolo();
            }
        }
    } else {
        try {
            const doc = generarPDFPresupuesto(payload, cliente);
            descargarDocumentoPDF(doc, cliente);
            cerrarModalProtocolo();
        } catch (error) {
            alert('No se pudo generar el PDF: ' + error.message);
        }
    }
}

function verificarCamposProtocolo() {
    const modo = document.getElementById('protocoloModo')?.value || 'descargar';
    const nombre = (document.getElementById('protocoloNombre')?.value || '').trim();
    const telefono = (document.getElementById('protocoloTelefono')?.value || '').trim();
    const email = (document.getElementById('protocoloEmail')?.value || '').trim();
    const boton = document.getElementById('protocoloAccionBtn');
    if (!boton) return;

    let valido;
    if (modo === 'enviar') {
        valido = nombre.length > 0 && email.length > 0;
    } else {
        valido = nombre.length > 0 && (telefono.length > 0 || email.length > 0);
    }

    boton.disabled = !valido;
    boton.style.opacity = valido ? '1' : '0.42';
    boton.style.cursor = valido ? 'pointer' : 'not-allowed';
}

window.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('protocoloModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                cerrarModalProtocolo();
            }
        });
    }

    ['protocoloNombre', 'protocoloTelefono', 'protocoloEmail'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', verificarCamposProtocolo);
    });
});

function enviarPresupuestoDetallado() {
    // Guardar el estado completo del cotizador en localStorage antes de ir a contacto.html
    const payload = obtenerSalidaCotizador();
    if (!payload) {
        alert('Debes calcular el presupuesto antes de solicitar presupuesto.');
        return;
    }

    const codigoRecuperacion = generarCodigoRecuperacionActual();
    payload.codigoRecuperacion = codigoRecuperacion;
    localStorage.setItem('ultimo-codigo-configuracion', codigoRecuperacion);

    // Guardar desglose completo con líneas de precios
    localStorage.setItem('presupuesto-detallado', JSON.stringify(payload.desglose));

    // Guardar configuración con datos completos para que contacto.html pueda enviarlos
    const m = payload.cotizador.medidas;
    localStorage.setItem('configuracion-acuario', JSON.stringify({
        largo: m.largo,
        ancho: m.ancho,
        alto: m.alto,
        grosor: m.grosor,
        litros: payload.cotizador.litros,
        precio: payload.cotizador.precioFinal,
        precioSinIva: payload.cotizador.precioSinIva,
        iva: payload.cotizador.iva,
        colorSilicona: payload.cotizador.colorSilicona,
        tipoRefuerzo: payload.cotizador.tipoRefuerzo,
        refuerzos: {
            perimetrales: /perimetral/i.test(payload.cotizador.tipoRefuerzo || ''),
            tirantes: /tirante/i.test(payload.cotizador.tipoRefuerzo || '')
        },
        opticos: payload.cotizador.opticos || {},
        codigoRecuperacion: codigoRecuperacion
    }));

    window.location.href = 'contacto.html';
}

// ============================================
// FUNCIONES DE CONFIGURACIÃ“N DE SOPORTES/MESAS
// ============================================

/**
 * Toggle de la configuración de soporte
 */
/**
 * Limpia PVC y Filtración Avanzada si no hay ningún soporte activo (estructura ni mesa)
 */
function limpiarPVCYFiltracionSiSinSoporte() {
    const estructuraActiva = document.getElementById('checkEstructuraAcero')?.checked;
    const mesaActiva = document.getElementById('checkMesaMelamina')?.checked;
    if (estructuraActiva || mesaActiva) return; // Hay soporte, no limpiar

    ['pvcInstalacionBasica','pvcAntiretorno','pvcTiradorAdicional',
     'filtracionRefugioAlgas','filtracionBarridoSump'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    });
    const selectorTiradores = document.getElementById('selectorCantidadTiradores');
    if (selectorTiradores) selectorTiradores.style.display = 'none';
    const pvcContent = document.getElementById('pvcMainContent');
    if (pvcContent) pvcContent.style.display = 'none';
    const pvcToggle = document.getElementById('pvcMainToggle');
    if (pvcToggle) pvcToggle.textContent = '+';
    const filtrContent = document.getElementById('filtracionAvanzadaMainContent');
    if (filtrContent) filtrContent.style.display = 'none';
    const filtrToggle = document.getElementById('filtracionAvanzadaMainToggle');
    if (filtrToggle) filtrToggle.textContent = '+';
}
window.limpiarPVCYFiltracionSiSinSoporte = limpiarPVCYFiltracionSiSinSoporte;

/**
 * Toggle de estructura de acero
 */
function toggleEstructuraAcero() {
    const checkbox = document.getElementById('checkEstructuraAcero');
    const opciones = document.getElementById('opcionesEstructuraAcero');
    
    if (checkbox && opciones) {
        opciones.style.display = checkbox.checked ? 'block' : 'none';
        
        // Si se desactiva, limpiar selecciones de acabado
        if (!checkbox.checked) {
            const acabados = ['acabadoPulidoMatizado', 'acabadoColor', 'acabadoSinPulir'];
            acabados.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.checked = false;
            });
            const selectorColor = document.getElementById('selectorColorAcero');
            if (selectorColor) selectorColor.style.display = 'none';
            const opcionesAdicionales = document.getElementById('opcionesAdicionalesEstructura');
            if (opcionesAdicionales) opcionesAdicionales.style.display = 'none';
            
            // Limpiar opciones adicionales
            const pies = document.getElementById('piesNiveladores');
            if (pies) pies.checked = false;
            const forrado = document.getElementById('forradoEstructuraMelamina');
            if (forrado) { forrado.checked = false; }
            const selectorForrado = document.getElementById('selectorColorForrado');
            if (selectorForrado) selectorForrado.style.display = 'none';

            // Cerrar y limpiar PVC y Filtración Avanzada si ya no hay soporte activo
            limpiarPVCYFiltracionSiSinSoporte();
        }
        
        // Si se activa estructura, desactivar mesa (mutuamente excluyentes)
        if (checkbox.checked) {
            const mesaCheck = document.getElementById('checkMesaMelamina');
            if (mesaCheck && mesaCheck.checked) {
                mesaCheck.checked = false;
                toggleMesaMelamina();
            }
        }
    }
    
    verificarVisibilidadOtrosAcabados();
    recalcularSoporte();
    
    // Actualizar visualización 3D
    if (typeof actualizarSoporteEn3D === 'function') {
        actualizarSoporteEn3D();
    }
    // Actualizar forrado/melamina 3D para limpiar restos
    if (typeof window.actualizarForradoMelamina3D === 'function') {
        window.actualizarForradoMelamina3D();
    }
}

/**
 * Seleccionar acabado de acero (solo uno a la vez) y mostrar opciones adicionales
 */
function seleccionarAcabadoAcero(tipo) {
    const pulidoCheck = document.getElementById('acabadoPulidoMatizado');
    const colorCheck = document.getElementById('acabadoColor');
    const sinPulirCheck = document.getElementById('acabadoSinPulir');
    const selectorColor = document.getElementById('selectorColorAcero');
    const opcionesAdicionales = document.getElementById('opcionesAdicionalesEstructura');
    
    // Desmarcar todos primero
    if (pulidoCheck) pulidoCheck.checked = false;
    if (colorCheck) colorCheck.checked = false;
    if (sinPulirCheck) sinPulirCheck.checked = false;
    if (selectorColor) selectorColor.style.display = 'none';
    
    // Marcar el seleccionado
    if (tipo === 'pulidoMatizado' && pulidoCheck) {
        pulidoCheck.checked = true;
    } else if (tipo === 'color' && colorCheck) {
        colorCheck.checked = true;
        if (selectorColor) selectorColor.style.display = 'block';
    } else if (tipo === 'sinPulir' && sinPulirCheck) {
        sinPulirCheck.checked = true;
    }
    
    // Mostrar opciones adicionales si hay acabado seleccionado
    const hayAcabado = pulidoCheck?.checked || colorCheck?.checked || sinPulirCheck?.checked;
    if (opcionesAdicionales) opcionesAdicionales.style.display = hayAcabado ? 'block' : 'none';
    
    // Actualizar visualización 3D
    if (typeof actualizarSoporteEn3D === 'function') {
        actualizarSoporteEn3D();
    }
    
    recalcularSoporte();
}

/**
 * Toggle mesa melamina (B33) - mutuamente excluyente con estructura acero
 */
function toggleMesaMelamina() {
    const checkbox = document.getElementById('checkMesaMelamina');
    const opciones = document.getElementById('opcionesMesaMelamina');
    
    if (checkbox && opciones) {
        opciones.style.display = checkbox.checked ? 'block' : 'none';
        
        // Si se activa, seleccionar blanco por defecto
        if (checkbox.checked) {
            const checkboxBlanco = document.getElementById('mesaMelaminaBlanco');
            const checkboxNegro = document.getElementById('mesaMelaminaNegro');
            if (checkboxBlanco && !checkboxBlanco.checked && !checkboxNegro?.checked) {
                checkboxBlanco.checked = true;
            }
            
            // Desactivar estructura acero (mutuamente excluyentes)
            const estructuraCheck = document.getElementById('checkEstructuraAcero');
            if (estructuraCheck && estructuraCheck.checked) {
                estructuraCheck.checked = false;
                toggleEstructuraAcero();
            }
        } else {
            // Si se desactiva, limpiar selecciones
            const checkboxBlanco = document.getElementById('mesaMelaminaBlanco');
            const checkboxNegro = document.getElementById('mesaMelaminaNegro');
            const zonaEstancaMesa = document.getElementById('zonaEstancaMesa');
            const ilumMesa = document.getElementById('iluminacionMesaMelamina');
            const regletaMesa = document.getElementById('regletaMesaMelamina');
            const selectorRegletaMesa = document.getElementById('selectorTipoRegletaMesa');
            if (checkboxBlanco) checkboxBlanco.checked = false;
            if (checkboxNegro) checkboxNegro.checked = false;
            if (zonaEstancaMesa) zonaEstancaMesa.checked = false;
            if (ilumMesa) ilumMesa.checked = false;
            if (regletaMesa) regletaMesa.checked = false;
            if (selectorRegletaMesa) selectorRegletaMesa.style.display = 'none';
            // Limpiar también regleta agua dulce
            const regletaDulce = document.getElementById('regletaMesaDulce');
            const selectorRegletaDulce = document.getElementById('selectorTipoRegletaDulce');
            if (regletaDulce) regletaDulce.checked = false;
            if (selectorRegletaDulce) selectorRegletaDulce.style.display = 'none';
            // Limpiar ventilador mesa
            const ventiladorMesa = document.getElementById('ventiladorMesaMarino');
            const selectorVentiladorMesa = document.getElementById('selectorTipoVentiladorMesa');
            if (ventiladorMesa) ventiladorMesa.checked = false;
            if (selectorVentiladorMesa) selectorVentiladorMesa.style.display = 'none';

            // Cerrar y limpiar PVC y Filtración Avanzada si ya no hay soporte activo
            limpiarPVCYFiltracionSiSinSoporte();
        }
    }
    
    verificarVisibilidadOtrosAcabados();
    recalcularSoporte();
    
    // Actualizar forrado/mesa melamina en 3D
    if (typeof window.actualizarForradoMelamina3D === 'function') {
        window.actualizarForradoMelamina3D();
    }
}

/**
 * Cambiar tipo de acuario para mesa melamina (marino / agua dulce)
 */
function cambiarTipoAcuarioMesa() {
    const tipo = document.getElementById('tipoAcuarioMesa')?.value || 'marino';
    const opcionesMarino = document.getElementById('opcionesMesaMarino');
    const opcionesDulce = document.getElementById('opcionesMesaDulce');
    
    if (tipo === 'marino') {
        if (opcionesMarino) opcionesMarino.style.display = '';
        if (opcionesDulce) opcionesDulce.style.display = 'none';
        // Limpiar opciones de dulce al cambiar a marino
        const regletaDulce = document.getElementById('regletaMesaDulce');
        if (regletaDulce && regletaDulce.checked) regletaDulce.checked = false;
        const selectorRegletaDulce = document.getElementById('selectorTipoRegletaDulce');
        if (selectorRegletaDulce) selectorRegletaDulce.style.display = 'none';
    } else {
        if (opcionesMarino) opcionesMarino.style.display = 'none';
        if (opcionesDulce) opcionesDulce.style.display = '';
        // Limpiar opciones de marino al cambiar a dulce
        const checkboxesMarino = ['zonaEstancaMesa', 'iluminacionMesaMelamina', 'regletaMesaMelamina', 'ventiladorMesaMarino'];
        checkboxesMarino.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.checked) el.checked = false;
        });
        const selectorRegleta = document.getElementById('selectorTipoRegletaMesa');
        if (selectorRegleta) selectorRegleta.style.display = 'none';
        const selectorVentilador = document.getElementById('selectorTipoVentiladorMesa');
        if (selectorVentilador) selectorVentilador.style.display = 'none';
    }
    
    recalcularSoporte();
    if (typeof window.actualizarForradoMelamina3D === 'function') {
        window.actualizarForradoMelamina3D();
    }
}

/**
 * Seleccionar color de la mesa melamina (B33) - solo uno a la vez
 */
function seleccionarColorMesaMelamina(color) {
    const checkboxBlanco = document.getElementById('mesaMelaminaBlanco');
    const checkboxNegro = document.getElementById('mesaMelaminaNegro');
    
    if (color === 'blanco' && checkboxBlanco?.checked) {
        // Desmarcar negro si blanco está marcado
        if (checkboxNegro) checkboxNegro.checked = false;
    } else if (color === 'negro' && checkboxNegro?.checked) {
        // Desmarcar blanco si negro está marcado
        if (checkboxBlanco) checkboxBlanco.checked = false;
    }
    
    verificarVisibilidadOtrosAcabados();
    recalcularSoporte();
    
    // Actualizar forrado melamina en 3D (cambia color)
    if (typeof window.actualizarForradoMelamina3D === 'function') {
        window.actualizarForradoMelamina3D();
    }
}

/**
 * Toggle forrado de estructura en melamina (B35)
 */
function toggleForradoEstructura() {
    const checkbox = document.getElementById('forradoEstructuraMelamina');
    const selector = document.getElementById('selectorColorForrado');
    
    if (checkbox && selector) {
        selector.style.display = checkbox.checked ? 'block' : 'none';
        
        // Si se desactiva, limpiar selección
        if (!checkbox.checked) {
            document.getElementById('colorForradoEstructura').value = '';
        }
    }
    
    verificarVisibilidadOtrosAcabados();
    recalcularSoporte();
    
    // Actualizar forrado melamina en 3D
    if (typeof window.actualizarForradoMelamina3D === 'function') {
        window.actualizarForradoMelamina3D();
    }
}

/**
 * Verificar visibilidad de sección "Otros Acabados"
 * Visible si: estructura tiene forrado con color seleccionado
 */
function verificarVisibilidadOtrosAcabados() {
    const seccionOtrosAcabados = document.getElementById('otrosAcabados');
    if (!seccionOtrosAcabados) return;
    
    // Verificar si forrado tiene color seleccionado
    const forradoCheck = document.getElementById('forradoEstructuraMelamina');
    const forradoColor = document.getElementById('colorForradoEstructura');
    const forradoConColor = forradoCheck?.checked && forradoColor?.value && forradoColor.value !== '';
    
    // Mostrar "Otros Acabados" solo si estructura tiene forrado con color
    seccionOtrosAcabados.style.display = forradoConColor ? 'block' : 'none';
    
    // Si se oculta, limpiar selecciones de Otros Acabados
    if (!forradoConColor) {
        const otrosCheckboxes = ['zonaEstanca', 'ventiladorEstructura', 'iluminacionModular', 'regletaEstructura'];
        otrosCheckboxes.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.checked) {
                el.checked = false;
            }
        });
        // Ocultar selectores
        const selectores = ['selectorTipoRegletaEstructura'];
        selectores.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
}

/**
 * Verificar disponibilidad de mesa en melamina según dimensiones del acuario
 * Solo disponible si: largo < 120cm O litros < 250
 */
function verificarDisponibilidadMesa(largoCm, litros) {
    const contenedorMesa = document.getElementById('contenedorMesaMelamina');
    const checkboxMesa = document.getElementById('checkMesaMelamina');
    
    if (!contenedorMesa) return;
    
    // Verificar si la mesa está permitida
    const mesaPermitida = largoCm < 120 || litros < 250;
    
    if (mesaPermitida) {
        // Mostrar opción de mesa
        contenedorMesa.style.display = 'block';
    } else {
        // Ocultar opción de mesa
        contenedorMesa.style.display = 'none';
        
        // Si estaba seleccionada, deseleccionarla
        if (checkboxMesa && checkboxMesa.checked) {
            checkboxMesa.checked = false;
            toggleMesaMelamina(); // Cerrar opciones si estaban abiertas
        }
    }
}

/**
 * Calcular número de patas del soporte según dimensiones del acuario
 * Replica la lógica de calcularPosicionesPatas de cotizador-3d.js
 */
function calcularNumeroPatas(largoAcuarioCm) {
    // 4 patas base siempre
    let numPatas = 4;
    
    // 5ª pata trasera central si largo >= 150cm
    if (largoAcuarioCm >= 150) {
        numPatas = 5;
    }
    
    // 2 patas más (traseras intermedias) si largo >= 250cm
    if (largoAcuarioCm >= 250) {
        numPatas = 7;
    }
    
    return numPatas;
}

/**
 * Toggle de regleta estructura
 */
function toggleRegletaEstructura() {
    const checkbox = document.getElementById('regletaEstructura');
    const selectorDiv = document.getElementById('selectorTipoRegletaEstructura');
    
    if (checkbox && selectorDiv) {
        selectorDiv.style.display = checkbox.checked ? 'block' : 'none';
    }
    
    recalcularSoporte();
    if (typeof window.actualizarForradoMelamina3D === 'function') window.actualizarForradoMelamina3D();
}



/**
 * Recalcular precios del soporte seleccionado
 */
function recalcularSoporte() {
    if (!window.datosCalculoActual) return;
    
    const data = window.datosCalculoActual;
    
    let precioTotal = 0;
    let descripcionSoporte = '';
    let descripcionAccesorios = [];
    
    // ========================================
    // ESTRUCTURA DE ACERO INOXIDABLE
    // ========================================
    let precioEstructuraAcero = 0;
    const estructuraAceroCheck = document.getElementById('checkEstructuraAcero')?.checked || false;
    
    // Detectar qué acabado está seleccionado (declarar aquí para que estén disponibles en toda la función)
    const acabadoPulido = document.getElementById('acabadoPulidoMatizado')?.checked || false;
    const acabadoColor = document.getElementById('acabadoColor')?.checked || false;
    const acabadoSinPulir = document.getElementById('acabadoSinPulir')?.checked || false;
    
    // Precios de referencia de cada acabado (siempre calculados)
    const precioPulido = data.estructuraInox?.brillo || 0;
    const precioColor = data.estructuraInox?.color || 0;
    const precioSinPulir = data.estructuraInox?.sinPulir || 0;
    
    if (estructuraAceroCheck) {
        // SIEMPRE mostrar los 3 precios para que el usuario vea antes de clickar
        const elPulido = document.getElementById('precioAcabadoPulidoMatizado');
        const elColor = document.getElementById('precioAcabadoColor');
        const elSinPulir = document.getElementById('precioAcabadoSinPulir');
        if (elPulido) elPulido.textContent = `+${Math.round(precioPulido)}€`;
        if (elColor) elColor.textContent = `+${Math.round(precioColor)}€`;
        if (elSinPulir) elSinPulir.textContent = `+${Math.round(precioSinPulir)}€`;
        
        // Solo sumar al total el acabado seleccionado
        if (acabadoPulido) {
            precioEstructuraAcero = precioPulido;
            descripcionSoporte = 'Estructura Acero Inox 316 - Acabado pulido/matizado';
        } else if (acabadoColor) {
            precioEstructuraAcero = precioColor;
            const color = document.getElementById('colorAcero')?.value || 'blanco';
            descripcionSoporte = `Estructura Acero Inox 316 - Color ${color}`;
        } else if (acabadoSinPulir) {
            precioEstructuraAcero = precioSinPulir;
            descripcionSoporte = 'Estructura Acero Inox 316 - Sin pulir';
        }
        
        precioTotal += precioEstructuraAcero;
    } else {
        // Si no está seleccionada la estructura, resetear precios
        const elPulido = document.getElementById('precioAcabadoPulidoMatizado');
        const elColor = document.getElementById('precioAcabadoColor');
        const elSinPulir = document.getElementById('precioAcabadoSinPulir');
        if (elPulido) elPulido.textContent = '+0€';
        if (elColor) elColor.textContent = '+0€';
        if (elSinPulir) elSinPulir.textContent = '+0€';
    }
    
    // ========================================
    // MESA EN MELAMINA INTEGRAL (B33)
    // ========================================
    let precioMesa = 0;
    const mesaCheck = document.getElementById('checkMesaMelamina')?.checked || false;
    
    if (mesaCheck) {
        const colorBlanco = document.getElementById('mesaMelaminaBlanco')?.checked || false;
        const colorNegro = document.getElementById('mesaMelaminaNegro')?.checked || false;
        const tipoAcuarioMesa = document.getElementById('tipoAcuarioMesa')?.value || 'marino';
        const esDulce = tipoAcuarioMesa === 'dulce';
        
        // Precios según tipo de acuario
        // Marino: B33 blanco, B33*1.10 negro (datos del servidor)
        // Dulce: B33/1.25 blanco, (B33/1.25)*1.10 negro
        const precioBase = data.mesaMadera?.blancoSatinado || 0;
        const precioMarinoBlanco = precioBase;
        const precioMarinoNegro = data.mesaMadera?.negroSatinado || 0;
        const precioDulceBlanco = precioBase / 1.25;
        const precioDulceNegro = precioDulceBlanco * 1.10;
        
        const precioBlanco = esDulce ? precioDulceBlanco : precioMarinoBlanco;
        const precioNegro = esDulce ? precioDulceNegro : precioMarinoNegro;
        
        let colorSeleccionado = '';
        
        // Precio base según color seleccionado
        if (colorBlanco) {
            precioMesa = precioBlanco;
            colorSeleccionado = 'blanco';
        } else if (colorNegro) {
            precioMesa = precioNegro;
            colorSeleccionado = 'negro';
        }
        
        // Siempre actualizar precios mostrados según tipo acuario
        document.getElementById('precioMesaMelaminaBlanco').textContent = `+${Math.round(precioBlanco)}€`;
        document.getElementById('precioMesaMelaminaNegro').textContent = `+${Math.round(precioNegro)}€`;
        
        let tipoTexto = esDulce ? 'agua dulce' : 'marino';
        let descripcionMesa = colorSeleccionado ? `Mesa Melamina ${colorSeleccionado} (${tipoTexto})` : 'Mesa Melamina';
        
        precioTotal += precioMesa;
        
        if (descripcionSoporte) {
            descripcionSoporte += ' + ' + descripcionMesa;
        } else {
            descripcionSoporte = descripcionMesa;
        }
    } else {
        // Si no está seleccionada la mesa, resetear precios
        const precioBlanco = document.getElementById('precioMesaMelaminaBlanco');
        const precioNegro = document.getElementById('precioMesaMelaminaNegro');
        if (precioBlanco) precioBlanco.textContent = '+0€';
        if (precioNegro) precioNegro.textContent = '+0€';
    }
    
    // ========================================
    // FORRADO DE ESTRUCTURA EN MELAMINA (B34)
    // ========================================
    let precioForrado = 0;
    const forradoCheck = document.getElementById('forradoEstructuraMelamina')?.checked || false;
    
    if (forradoCheck) {
        const colorForrado = document.getElementById('colorForradoEstructura')?.value || '';
        
        if (colorForrado && colorForrado !== '') {
            if (colorForrado === 'blanco') {
                precioForrado = data.forradoMadera?.blancoSatinado || 0;
            } else if (colorForrado === 'negro') {
                precioForrado = data.forradoMadera?.negroSatinado || 0;
            }
            
            precioTotal += precioForrado;
            document.getElementById('precioForradoEstructura').textContent = `+${Math.round(precioForrado)}€`;
            
            descripcionAccesorios.push(`Forrado melamina ${colorForrado}`);
        } else {
            document.getElementById('precioForradoEstructura').textContent = '+0€';
        }
    } else {
        document.getElementById('precioForradoEstructura').textContent = '+0€';
    }
    
    // ========================================
    // PIES NIVELADORES (bajo opciones adicionales estructura)
    // ========================================
    let precioPies = 0;
    const piesNiveladores = document.getElementById('piesNiveladores')?.checked || false;
    const largoAcuario = parseFloat(document.getElementById('largo')?.value || 100);
    const numPies = calcularNumeroPatas(largoAcuario);
    
    // Actualizar label con número de patas
    const labelPies = document.getElementById('labelPiesNiveladores');
    if (labelPies) {
        labelPies.textContent = `Pies niveladores - ${numPies} unidades (35€/unidad)`;
    }
    
    // Siempre mostrar precio calculado de patas
    const precioPatasCalculado = 35 * numPies;
    const precioPiesDiv = document.getElementById('precioPiesNiveladores');
    if (precioPiesDiv) precioPiesDiv.textContent = `+${precioPatasCalculado}€`;
    
    if (piesNiveladores) {
        precioPies = precioPatasCalculado;
        precioTotal += precioPies;
        descripcionAccesorios.push(`Pies niveladores (${numPies} uds.)`);
    }
    
    // ========================================
    // ZONA ESTANCA MESA MELAMINA (dentro de mesa)
    // ========================================
    let precioZonaEstancaMesa = 0;
    const precioZEMesaRef = data.extrasSoporte?.zonaEstancaEstructura || 0;
    const precioZEMesaDiv = document.getElementById('precioZonaEstancaMesa');
    
    // Siempre mostrar precio si mesa está activa
    if (mesaCheck && precioZEMesaRef > 0) {
        if (precioZEMesaDiv) precioZEMesaDiv.textContent = `+${Math.round(precioZEMesaRef)}€`;
    } else {
        if (precioZEMesaDiv) precioZEMesaDiv.textContent = '+0€';
    }
    
    // Solo sumar al total si está marcado
    if (mesaCheck && document.getElementById('zonaEstancaMesa')?.checked && precioZEMesaRef > 0) {
        precioZonaEstancaMesa = precioZEMesaRef;
        precioTotal += precioZonaEstancaMesa;
        descripcionAccesorios.push('Zona estanca (mesa)');
    }
    
    // ========================================
    // ILUMINACIÃ“N LED MESA MELAMINA
    // ========================================
    let precioIlumMesa = 0;
    const precioIlumMesaUnit = 25; // Precio fijo: 25€ por punto de luz
    const largoCmMesa = parseFloat(document.getElementById('largo')?.value) || 100;
    const numModulosMesa = Math.max(1, Math.ceil(largoCmMesa / 100));
    const precioIlumMesaTotal = precioIlumMesaUnit * numModulosMesa;
    const divIlumMesa = document.getElementById('precioIluminacionMesaMelamina');
    
    if (mesaCheck) {
        if (divIlumMesa) divIlumMesa.textContent = `+${Math.round(precioIlumMesaTotal)}€`;
    } else {
        if (divIlumMesa) divIlumMesa.textContent = '+0€';
    }
    
    if (mesaCheck && document.getElementById('iluminacionMesaMelamina')?.checked) {
        precioIlumMesa = precioIlumMesaTotal;
        precioTotal += precioIlumMesa;
        descripcionAccesorios.push(`Iluminación LED mesa (${numModulosMesa} módulo${numModulosMesa > 1 ? 's' : ''})`);
    }
    
    // ========================================
    // REGLETA MESA MELAMINA (marino o dulce)
    // ========================================
    let precioRegletaMesa = 0;
    const regletaMarinoCheck = document.getElementById('regletaMesaMelamina')?.checked || false;
    const regletaDulceCheck = document.getElementById('regletaMesaDulce')?.checked || false;
    const regletaMesaActiva = mesaCheck && (regletaMarinoCheck || regletaDulceCheck);
    
    // Determinar qué selector de tipo usar según cuál está activo
    const tipoRegletaMesaId = regletaDulceCheck ? 'tipoRegletaDulce' : 'tipoRegletaMesa';
    const tipoRegletaMesa = document.getElementById(tipoRegletaMesaId)?.value || 'normal';
    const precioRegletaMesaUnit = tipoRegletaMesa === 'sobretension' ? 45 : 35;
    const divRegMesa = document.getElementById('precioRegletaMesaMelamina');
    const divRegDulce = document.getElementById('precioRegletaMesaDulce');
    
    if (regletaMesaActiva) {
        precioRegletaMesa = precioRegletaMesaUnit;
        precioTotal += precioRegletaMesa;
        const tipoTexto = tipoRegletaMesa === 'sobretension' ? 'con protección sobretensión' : 'normal';
        descripcionAccesorios.push(`Regleta 8 enchufes ${tipoTexto} (mesa)`);
    }
    // Actualizar precios mostrados en ambos
    if (divRegMesa) divRegMesa.textContent = `+${precioRegletaMesaUnit}€`;
    if (divRegDulce) divRegDulce.textContent = `+${precioRegletaMesaUnit}€`;
    
    // ========================================
    // OTROS ACABADOS (solo con estructura + forrado con color)
    // ========================================
    
    // Zona estanca (en sección "Otros Acabados" - para estructura con forrado)
    let precioZonaEstanca = 0;
    const precioZERef = data.extrasSoporte?.zonaEstancaEstructura || 0;
    const precioZEDiv = document.getElementById('precioZonaEstanca');
    
    // Siempre mostrar precio real
    if (precioZERef > 0 && precioZEDiv) {
        precioZEDiv.textContent = `+${Math.round(precioZERef)}€`;
    } else if (precioZEDiv) {
        precioZEDiv.textContent = '+0€';
    }
    
    // Solo sumar al total si está marcado
    if (document.getElementById('zonaEstanca')?.checked && precioZERef > 0) {
        precioZonaEstanca = precioZERef;
        precioTotal += precioZonaEstanca;
        descripcionAccesorios.push('Zona estanca');
    }
    
    // ========================================
    // ACCESORIOS ADICIONALES
    // ========================================
    let precioAccesorios = 0;
    const largoMetros = Math.ceil((window.largoAcuario || 100) / 100);
    
    // Variables para guardar precios individuales
    let precioVentilador = 0;
    let precioIluminacionModular = 0;
    let precioRegletaEstructura = 0;
    
    // Ventilador para renovación de aire (mesa marino + estructura con forrado)
    const ventiladorMesaCheck = document.getElementById('ventiladorMesaMarino')?.checked || false;
    const ventiladorEstrCheck = document.getElementById('ventiladorEstructura')?.checked || false;
    const ventiladorActivo = ventiladorMesaCheck || ventiladorEstrCheck;
    const tipoVentiladorId = ventiladorMesaCheck ? 'tipoVentiladorMesa' : 'tipoVentiladorEstructura';
    const tipoVentilador = document.getElementById(tipoVentiladorId)?.value || 'simple';
    const precioVentiladorUnit = tipoVentilador === 'doble' ? 65 : 35;
    
    // Actualizar precios mostrados
    const divVentMesa = document.getElementById('precioVentiladorMesaMarino');
    const divVentEstr = document.getElementById('precioVentiladorEstructura');
    if (divVentMesa) divVentMesa.textContent = `+${precioVentiladorUnit}€`;
    if (divVentEstr) divVentEstr.textContent = `+${precioVentiladorUnit}€`;
    
    if (ventiladorActivo) {
        precioVentilador = precioVentiladorUnit;
        precioAccesorios += precioVentilador;
        const tipoTextoVent = tipoVentilador === 'doble' ? 'doble (2 ventiladores)' : 'sencilla (1 ventilador)';
        descripcionAccesorios.push(`Ventilación ${tipoTextoVent}`);
    }
    
    // Iluminación modular - precio fijo 25€ por punto de luz
    const precioIlumPorModulo = 25; // Precio fijo: 25€ por punto de luz
    const largoCm = parseFloat(document.getElementById('largo')?.value) || 100;
    const numModulosLed = Math.max(1, Math.ceil(largoCm / 100));
    const precioIlumTotal = precioIlumPorModulo * numModulosLed;
    const divIlum = document.getElementById('precioIluminacionModular');
    if (divIlum) divIlum.textContent = `+${Math.round(precioIlumTotal)}€`;
    
    if (document.getElementById('iluminacionModular')?.checked) {
        precioIluminacionModular = precioIlumTotal;
        precioAccesorios += precioIluminacionModular;
        descripcionAccesorios.push(`Iluminación LED (${numModulosLed} módulo${numModulosLed > 1 ? 's' : ''})`);
    }
    
    // Regleta estructura - precio fijo según tipo
    const tipoRegletaEstr = document.getElementById('tipoRegletaEstructura')?.value || 'normal';
    const precioRegEstrUnit = tipoRegletaEstr === 'sobretension' ? 45 : 35;
    const divRegEstr = document.getElementById('precioRegletaEstructura');
    
    if (document.getElementById('regletaEstructura')?.checked) {
        precioRegletaEstructura = precioRegEstrUnit;
        precioAccesorios += precioRegletaEstructura;
        const tipoTextoEstr = tipoRegletaEstr === 'sobretension' ? 'con protección sobretensión' : 'normal';
        descripcionAccesorios.push(`Regleta 8 enchufes ${tipoTextoEstr}`);
        if (divRegEstr) divRegEstr.textContent = `+${precioRegEstrUnit}€`;
    } else {
        if (divRegEstr) divRegEstr.textContent = `+${precioRegEstrUnit}€`;
    }
    
    
    // Sumar accesorios al total
    precioTotal += precioAccesorios;
    
    // ========================================
    // SUMP (sumidero) - disponible de forma independiente
    // ========================================
    let precioSump = 0;
    let sumpCheck = document.getElementById('checkSump')?.checked || false;
    const rebosaderoDisponibleParaSump = hayRebosaderoSeleccionado();
    if (sumpCheck && !rebosaderoDisponibleParaSump) {
        const checkSumpEl = document.getElementById('checkSump');
        const viniloSumpEl = document.getElementById('viniloSump');
        const opcionesSumpEl = document.getElementById('opcionesSump');
        const selectorViniloEl = document.getElementById('selectorColorViniloSump');
        if (checkSumpEl) checkSumpEl.checked = false;
        if (viniloSumpEl) viniloSumpEl.checked = false;
        if (opcionesSumpEl) opcionesSumpEl.style.display = 'none';
        if (selectorViniloEl) selectorViniloEl.style.display = 'none';
        sumpCheck = false;
    }

    const precioSumpBase = data.sump?.precio || data.mesaAltaMadera?.blancoSatinado || 0;
    const divSump = document.getElementById('precioSump');
    
    if (precioSumpBase > 0) {
        if (divSump) divSump.textContent = `+${Math.round(precioSumpBase)}€`;
    } else {
        if (divSump) divSump.textContent = '+0€';
    }
    
    // Vinilo en sump
    let precioViniloSump = 0;
    const viniloSumpCheck = sumpCheck && (document.getElementById('viniloSump')?.checked || false);
    if (sumpCheck && viniloSumpCheck) {
        const largoAcuCm = parseFloat(document.getElementById('largo')?.value) || 100;
        const anchoAcuCm = parseFloat(document.getElementById('ancho')?.value) || 40;
        const largoTrasero = largoAcuCm - 30;
        const anchoLateral = anchoAcuCm - 9;
        const totalCmVinilo = largoTrasero + 2 * anchoLateral;
        precioViniloSump = Math.round((totalCmVinilo / 25) * 4.50 * 100) / 100;
    }
    const divPrecioViniloSump = document.getElementById('precioViniloSump');
    if (divPrecioViniloSump) {
        divPrecioViniloSump.textContent = precioViniloSump > 0 ? `+${precioViniloSump.toFixed(2)}€` : '';
    }

    if (sumpCheck && precioSumpBase > 0) {
        precioSump = precioSumpBase + precioViniloSump;
        precioTotal += precioSump;
    }
    
    // Guardar datos de soporte DETALLADOS para el desglose
    window.datosSoporteActual = {
        precioTotal: precioTotal,
        descripcionGeneral: descripcionSoporte,
        accesoriosTexto: descripcionAccesorios.join(', '),
        
        // Estructura de acero
        estructuraAcero: {
            habilitada: estructuraAceroCheck,
            precio: precioEstructuraAcero,
            descripcion: descripcionSoporte,
            acabadoPulido: acabadoPulido || false,
            acabadoColor: acabadoColor || false,
            acabadoSinPulir: acabadoSinPulir || false,
            color: acabadoColor ? (document.getElementById('colorAcero')?.value || 'blanco') : null
        },
        
        // Mesa melamina integral (B33)
        mesaMelamina: {
            habilitada: mesaCheck,
            precio: precioMesa,
            colorBlanco: document.getElementById('mesaMelaminaBlanco')?.checked || false,
            colorNegro: document.getElementById('mesaMelaminaNegro')?.checked || false
        },
        
        // Forrado de estructura en melamina (B34)
        forradoMelamina: {
            habilitado: forradoCheck,
            precio: precioForrado,
            color: document.getElementById('colorForradoEstructura')?.value || ''
        },
        
        // Pies niveladores (bajo opciones adicionales estructura)
        piesNiveladores: {
            habilitados: piesNiveladores,
            precio: precioPies,
            cantidad: numPies
        },
        
        // Zona estanca mesa melamina (dentro de mesa)
        zonaEstancaMesa: {
            habilitada: mesaCheck && (document.getElementById('zonaEstancaMesa')?.checked || false),
            precio: precioZonaEstancaMesa
        },
        
        // Iluminación mesa melamina
        iluminacionMesa: {
            habilitada: mesaCheck && (document.getElementById('iluminacionMesaMelamina')?.checked || false),
            precio: precioIlumMesa || 0,
            modulos: numModulosMesa || 0
        },
        
        // Regleta mesa melamina (marino o dulce)
        regletaMesa: {
            habilitada: regletaMesaActiva,
            precio: precioRegletaMesa || 0,
            tipo: tipoRegletaMesa || 'normal'
        },
        
        // Zona estanca estructura (en sección "Otros Acabados")
        zonaEstanca: {
            habilitada: document.getElementById('zonaEstanca')?.checked || false,
            precio: precioZonaEstanca
        },
        
        // Accesorios con precios individuales
        accesorios: {
            ventilador: {
                habilitado: ventiladorActivo,
                precio: precioVentilador || 0,
                tipo: tipoVentilador || 'simple'
            },
            iluminacionModular: {
                habilitada: document.getElementById('iluminacionModular')?.checked || false,
                precio: precioIluminacionModular || 0,
                modulos: numModulosLed
            },
            regletaEstructura: {
                habilitada: document.getElementById('regletaEstructura')?.checked || false,
                precio: precioRegletaEstructura || 0,
                tipo: tipoRegletaEstr || 'normal'
            }
        },
        
        // Sump (sumidero)
        sump: {
            habilitado: sumpCheck,
            precio: precioSump || 0,
            vinilo: {
                habilitado: sumpCheck && viniloSumpCheck,
                precio: precioViniloSump || 0
            }
        }
    };
    
    // Actualizar desglose
    actualizarDesglose(data);
    
    // Actualizar precio grande (acuario + soporte completo)
    const precioAcuario = data.precio || 0;
    const precioTotalConAcuario = precioAcuario + precioTotal;
    const precioFinalEl = document.getElementById('precioFinal');
    if (precioFinalEl) {
        precioFinalEl.textContent = `${precioTotalConAcuario.toFixed(2)}€`;
    }
    
    // Actualizar visualización 3D según el modo activo
    if (mesaCheck && typeof window.actualizarForradoMelamina3D === 'function') {
        window.actualizarForradoMelamina3D();
    } else if (typeof window.actualizarSoporteEn3D === 'function') {
        window.actualizarSoporteEn3D();
    }

    // Regenerar desglose detallado (siempre visible)
    if (typeof generarDesgloseCompleto === 'function') {
        generarDesgloseCompleto();
    }
}

/**
 * Descargar presupuesto como PDF
 * Abre un modal para pedir datos de contacto (nombre + email/teléfono)
 * antes de generar el documento.
 */
function descargarPresupuestoPDF() {
    const payload = obtenerSalidaCotizador();
    if (!payload) {
        alert('Debes calcular el presupuesto antes de descargar el PDF.');
        return;
    }
    abrirModalDatosPDF(payload);
}

function abrirModalDatosPDF(payload) {
    // Quitar modal anterior si existe
    const previo = document.getElementById('modal-datos-pdf-overlay');
    if (previo) previo.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modal-datos-pdf-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,30,50,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';

    overlay.innerHTML =
        '<div style="background:#fff;border-radius:10px;width:min(460px,100%);overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.4);font-family:\'Rajdhani\',Helvetica,Arial,sans-serif;">' +
            '<div style="background:#EAF6FC;border-bottom:2px solid #52C8FF;padding:14px 18px;">' +
                '<h3 style="margin:0;color:#256391;font-family:\'Orbitron\',Helvetica,Arial,sans-serif;font-size:16px;letter-spacing:1px;">DATOS PARA EL PRESUPUESTO</h3>' +
                '<p style="margin:4px 0 0;font-size:13px;color:#456;">Necesitamos tu nombre y al menos un dato de contacto (email o teléfono) para preparar el PDF.</p>' +
            '</div>' +
            '<div style="padding:18px;">' +
                '<label style="display:block;font-size:13px;color:#345;margin-bottom:4px;font-weight:600;">Nombre <span style="color:#d33;">*</span></label>' +
                '<input id="mdp-nombre" type="text" maxlength="60" style="width:100%;padding:9px 11px;border:1px solid #B4D7EB;border-radius:6px;font-size:14px;box-sizing:border-box;margin-bottom:12px;">' +

                '<label style="display:block;font-size:13px;color:#345;margin-bottom:4px;font-weight:600;">Email</label>' +
                '<input id="mdp-email" type="email" maxlength="80" style="width:100%;padding:9px 11px;border:1px solid #B4D7EB;border-radius:6px;font-size:14px;box-sizing:border-box;margin-bottom:12px;">' +

                '<label style="display:block;font-size:13px;color:#345;margin-bottom:4px;font-weight:600;">Teléfono</label>' +
                '<input id="mdp-telefono" type="tel" maxlength="20" style="width:100%;padding:9px 11px;border:1px solid #B4D7EB;border-radius:6px;font-size:14px;box-sizing:border-box;margin-bottom:6px;">' +
                '<p id="mdp-aviso" style="font-size:12px;color:#888;margin:6px 0 14px;">* Indica al menos email o teléfono.</p>' +

                '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
                    '<button id="mdp-cancelar" type="button" style="background:#eee;color:#456;border:none;padding:9px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Cancelar</button>' +
                    '<button id="mdp-aceptar" type="button" disabled style="background:#B4D7EB;color:#fff;border:none;padding:9px 18px;border-radius:6px;cursor:not-allowed;font-weight:700;letter-spacing:0.5px;">DESCARGAR PDF</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    document.body.appendChild(overlay);

    const $nombre = document.getElementById('mdp-nombre');
    const $email = document.getElementById('mdp-email');
    const $tel = document.getElementById('mdp-telefono');
    const $aceptar = document.getElementById('mdp-aceptar');
    const $aviso = document.getElementById('mdp-aviso');

    function emailValido(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
    function telefonoValido(v) { return /^[+\d][\d\s\-]{6,}$/.test(v.trim()); }

    function validar() {
        const okNombre = $nombre.value.trim().length >= 2;
        const okEmail = emailValido($email.value);
        const okTel = telefonoValido($tel.value);
        const okContacto = okEmail || okTel;
        const valido = okNombre && okContacto;

        if (valido) {
            $aceptar.disabled = false;
            $aceptar.style.background = '#52C8FF';
            $aceptar.style.cursor = 'pointer';
            $aviso.style.color = '#3a8a3a';
            $aviso.textContent = '✓ Datos correctos.';
        } else {
            $aceptar.disabled = true;
            $aceptar.style.background = '#B4D7EB';
            $aceptar.style.cursor = 'not-allowed';
            $aviso.style.color = '#888';
            if (!okNombre) {
                $aviso.textContent = '* Introduce tu nombre.';
            } else if (!okContacto) {
                $aviso.textContent = '* Indica al menos email o teléfono.';
            }
        }
    }
    $nombre.addEventListener('input', validar);
    $email.addEventListener('input', validar);
    $tel.addEventListener('input', validar);
    setTimeout(function() { $nombre.focus(); }, 50);

    document.getElementById('mdp-cancelar').onclick = function() { overlay.remove(); };
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

    $aceptar.onclick = function() {
        if ($aceptar.disabled) return;
        const datos = {
            nombre: $nombre.value.trim(),
            email: $email.value.trim(),
            telefono: $tel.value.trim()
        };
        overlay.remove();
        ejecutarDescargaPDFConDatos(payload, datos);
    };
}

async function ejecutarDescargaPDFConDatos(payload, datosCliente) {
    const codigoRecuperacion = generarCodigoRecuperacionActual();
    payload.accion = 'descargar_pdf';
    payload.codigoRecuperacion = codigoRecuperacion;
    payload.cliente = datosCliente;
    localStorage.setItem('ultimo-codigo-configuracion', codigoRecuperacion);
    registrarProtocolo(payload);

    let doc;
    try {
        doc = generarPDFPresupuesto(payload, datosCliente);
        descargarDocumentoPDF(doc, datosCliente);
    } catch (error) {
        alert('No se pudo generar el PDF: ' + error.message);
        return;
    }

    // Enviar notificación interna a Coraline (sin pdfBase64, datos directamente en el cuerpo)
    try {
        const datosNotif = {
            accion: 'notificacion_descarga_pdf',
            nombre: datosCliente.nombre,
            email: datosCliente.email,
            telefono: datosCliente.telefono,
            configuracion: payload.cotizador,
            desglose: payload.desglose,
            codigoRecuperacion: payload.codigoRecuperacion,
            sessionId: payload.sessionId,
            historialCotizaciones: JSON.parse(localStorage.getItem('historialCotizaciones') || '[]'),
            token: window.TOKEN_SEGURIDAD || 'TOKEN_NO_CONFIGURADO'
        };
        await fetch(EMAIL_BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(datosNotif)
        });
    } catch (e) {
        console.warn('No se pudo enviar notificación a Coraline:', e.message);
    }

    setTimeout(function() {
        window.location.href = 'confirmacion-enviado.html';
    }, 1200);
}
