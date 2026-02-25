// ============================================
// MODELOS 3D - FILTROS Y CARGA EN COTIZADOR
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    inicializarFiltrosModelos();
});

/**
 * Inicializa los filtros de modelos
 */
function inicializarFiltrosModelos() {
    const botonesFiltro = document.querySelectorAll('.filtro-btn');
    const tarjetasModelo = document.querySelectorAll('.modelo-card');
    
    botonesFiltro.forEach(boton => {
        boton.addEventListener('click', function() {
            // Remover clase active de todos los botones
            botonesFiltro.forEach(btn => btn.classList.remove('active'));
            
            // Añadir clase active al botón clickeado
            this.classList.add('active');
            
            // Obtener el filtro seleccionado
            const filtro = this.getAttribute('data-filter');
            
            // Mostrar/ocultar tarjetas
            tarjetasModelo.forEach(tarjeta => {
                if (filtro === 'all') {
                    tarjeta.classList.remove('hidden');
                } else {
                    if (tarjeta.getAttribute('data-category') === filtro) {
                        tarjeta.classList.remove('hidden');
                    } else {
                        tarjeta.classList.add('hidden');
                    }
                }
            });
        });
    });
}

/**
 * Carga las medidas de un modelo en el cotizador
 * @param {number} largo - Largo en cm
 * @param {number} ancho - Ancho en cm
 * @param {number} alto - Alto en cm
 * @param {number} codigoGrosor - Código del grosor (1-6)
 */
function cargarEnCotizador(largo, ancho, alto, codigoGrosor) {
    // Cargar valores en los campos
    document.getElementById('largo').value = largo;
    document.getElementById('ancho').value = ancho;
    document.getElementById('alto').value = alto;
    document.getElementById('grosor').value = codigoGrosor;
    
    // Scroll suave al cotizador
    const cotizador = document.getElementById('cotizador');
    if (cotizador) {
        cotizador.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Resaltar los campos brevemente
        setTimeout(() => {
            const campos = [
                document.getElementById('largo'),
                document.getElementById('ancho'),
                document.getElementById('alto'),
                document.getElementById('grosor')
            ];
            
            campos.forEach(campo => {
                if (campo) {
                    campo.style.transition = 'all 0.3s ease';
                    campo.style.backgroundColor = '#e3f2fd';
                    campo.style.transform = 'scale(1.02)';
                    
                    setTimeout(() => {
                        campo.style.backgroundColor = '';
                        campo.style.transform = '';
                    }, 1000);
                }
            });
        }, 800);
        
        // Mostrar notificación
        mostrarNotificacion('✓ Modelo cargado en el cotizador', 'success');
    }
}

/**
 * Muestra una notificación temporal
 * @param {string} mensaje - El mensaje a mostrar
 * @param {string} tipo - 'success', 'error', 'info'
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notif = document.createElement('div');
    notif.className = `notificacion notif-${tipo}`;
    notif.textContent = mensaje;
    
    // Estilos
    notif.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        padding: 15px 25px;
        background: ${tipo === 'success' ? '#4caf50' : tipo === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInUp 0.3s ease, slideOutDown 0.3s ease 2.7s;
        font-weight: 600;
    `;
    
    document.body.appendChild(notif);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        notif.remove();
    }, 3000);
}

// Añadir estilos de animación
if (!document.getElementById('notif-animations')) {
    const style = document.createElement('style');
    style.id = 'notif-animations';
    style.textContent = `
        @keyframes slideInUp {
            from {
                transform: translateY(100px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutDown {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(100px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
