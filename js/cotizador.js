// ============================================
// COTIZADOR DE ACUARIOS - FRONTEND
// Coraline Acuarios - Sistema de 2 pasos
// ============================================

// CONFIGURACIÓN - REEMPLAZAR CON TU URL DE GOOGLE APPS SCRIPT
const CONFIG = {
    googleSheetsAPI: 'https://script.google.com/macros/s/AKfycbxAak1iknG-WeltAhbWbU9wCx9wYGEVgTLSPR9IlVYGQ-r2F5f6vAHIZHQnBheNNVAA/exec'
};

// Variables globales
let ultimoCalculo = null;
let historialCotizaciones = [];

/**
 * Función principal para calcular el precio del acuario
 * PASO 1: Calcula precio base y muestra opciones de ópticos
 */
async function calcularPrecio() {
    // Obtener valores del formulario
    const largo = parseFloat(document.getElementById('largo').value);
    const ancho = parseFloat(document.getElementById('ancho').value);
    const alto = parseFloat(document.getElementById('alto').value);
    const codigoGrosor = parseInt(document.getElementById('grosor').value);
    const perimetrales = document.getElementById('perimetrales').checked;
    const tirantes = document.getElementById('tirantes').checked;
    
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
    btnCalcular.innerHTML = '<span class="spinner">⏳</span> Calculando...';
    
    try {
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
    
    // Mostrar y configurar opciones de cristal óptico
    if (data.precioOpticoFrontalTrasero > 0 || data.precioOpticoLateral > 0) {
        const opticosSection = document.getElementById('opticos-section');
        opticosSection.style.display = 'block';
        
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
    
    // Mostrar precio final
    document.getElementById('precioFinal').textContent = `${data.precio.toFixed(2)}€`;
    
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
            <div class="warning-icon">⚠️</div>
            <div class="warning-content">
                <h4>Ratio de Seguridad Bajo</h4>
                <p>La configuración actual da como resultado un ratio de seguridad más bajo de lo recomendado. Para evitar una construcción débil, puedes aumentar el grosor de cristal o añadir refuerzos perimetrales y tirantes.</p>
            </div>
        `;
        warningsContainer.appendChild(avisoRatio);
    }
    
    // Aviso si deflexión > 10%
    if (data.deflexion > 10) {
        const avisoDeflexion = document.createElement('div');
        avisoDeflexion.className = 'warning-box warning-danger';
        avisoDeflexion.innerHTML = `
            <div class="warning-icon">⚠️</div>
            <div class="warning-content">
                <h4>Grosor Insuficiente para la Altura</h4>
                <p>El grosor de las láminas de esta configuración es bajo para la altura y la fuerza del agua, pudiendo ocasionar deformación en el cristal. Recomendamos aumentar el grosor general del acuario o bien bajar la altura de este para evitarlo.</p>
            </div>
        `;
        warningsContainer.appendChild(avisoDeflexion);
    }
    
    // Si todo está bien, mostrar mensaje positivo
    if (data.ratioSeguridad >= 4 && data.deflexion <= 10) {
        const avisoOk = document.createElement('div');
        avisoOk.className = 'warning-box warning-success';
        avisoOk.innerHTML = `
            <div class="warning-icon">✅</div>
            <div class="warning-content">
                <h4>Configuración Segura</h4>
                <p>Esta configuración cumple con todos los estándares de seguridad recomendados.</p>
            </div>
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
// LÓGICA DE CHECKBOXES
// ============================================

/**
 * Manejo de dependencias entre checkboxes de refuerzos
 */
document.addEventListener('DOMContentLoaded', function() {
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
                // Guardar configuración actual para el formulario
                localStorage.setItem('configuracion-acuario', JSON.stringify({
                    largo: document.getElementById('largo').value,
                    ancho: document.getElementById('ancho').value,
                    alto: document.getElementById('alto').value,
                    grosor: document.getElementById('grosor').options[document.getElementById('grosor').selectedIndex].text,
                    precio: ultimoCalculo.precio,
                    litros: ultimoCalculo.litros,
                    refuerzos: ultimoCalculo.refuerzos,
                    opticos: ultimoCalculo.opticos
                }));
            }
        });
    }
});
