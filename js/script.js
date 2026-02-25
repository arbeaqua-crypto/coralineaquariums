// Configuración del API de Google Sheets - DESACTIVADA (ahora en cotizador.js)
// const CONFIG = {
//     googleSheetsAPI: 'https://script.google.com/macros/s/AKfycbxQNZrveQX7TehFg20Yzah82itP5kmQzqLmc738KdvxiFZ1Mm45WkjhAyjybjrKuOtqVQ/exec'
// };

// PRECIOS ANTIGUOS COMENTADOS - Ahora se usan desde Google Sheets
/*
const preciosBase = {
    // Precio base por litro según tipo
    tipoMultiplicador: {
        'dulce': 1.0,
        'marino': 1.3,
        'plantado': 1.2,
        'comercial': 1.4
    },
    
    // Precio por cm² de vidrio (base)
    precioPorCm2: 0.15,
    
    // Multiplicador por grosor de vidrio
    grosorMultiplicador: {
        '6': 0.9,
        '8': 1.0,
        '10': 1.2,
        '12': 1.4,
        '15': 1.7
    },
    
    // Precio adicional por calidad
    calidadExtra: {
        'normal': 0,
        'low-iron': 50
    },
    
    // Opciones adicionales
    opciones: {
        'mueble': 300,
        'tapa': 80,
        'sump': 250,
        'iluminacion': 200,
        'fondo-decorado': 100,
        'taladros': 50
    }
};

// Precios estándar predefinidos
const preciosEstandar = {
    dulce: [
        { medida: '60x30x30 cm', litros: 54, precio: 150 },
        { medida: '80x40x40 cm', litros: 128, precio: 280 },
        { medida: '100x40x50 cm', litros: 200, precio: 420 },
        { medida: '120x50x50 cm', litros: 300, precio: 580 },
        { medida: '150x50x60 cm', litros: 450, precio: 850 }
    ],
    marino: [
        { medida: '80x50x50 cm', litros: 200, precio: 450 },
        { medida: '100x50x60 cm', litros: 300, precio: 680 },
        { medida: '120x60x60 cm', litros: 432, precio: 950 },
        { medida: '150x60x70 cm', litros: 630, precio: 1400 },
        { medida: '180x70x70 cm', litros: 882, precio: 1850 }
    ],
    plantado: [
        { medida: '60x35x35 cm', litros: 74, precio: 195 },
        { medida: '90x45x45 cm', litros: 182, precio: 420 },
        { medida: '120x45x50 cm', litros: 270, precio: 620 },
        { medida: '150x50x50 cm', litros: 375, precio: 850 },
        { medida: '180x60x60 cm', litros: 648, precio: 1350 }
    ],
    comercial: [
        { medida: '100x50x50 cm', litros: 250, precio: 600 },
        { medida: '150x60x60 cm', litros: 540, precio: 1200 },
        { medida: '200x70x70 cm', litros: 980, precio: 2100 },
        { medida: '250x80x80 cm', litros: 1600, precio: 3200 },
        { medida: '300x90x90 cm', litros: 2430, precio: 4500 }
    ]
};
*/

// ============= NAVEGACIÓN =============
document.addEventListener('DOMContentLoaded', function() {
    // Menú hamburguesa
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // Cerrar menú al hacer click en un enlace
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // Destacar sección activa en el menú
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
});

// ============= CARRUSEL =============
document.addEventListener('DOMContentLoaded', () => {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');

    // Solo ejecutar si hay slides en la página
    if (slides.length === 0) return;

    function showSlide(index) {
        // Remover clase active de todos los slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        currentSlide = index;
        if (currentSlide >= slides.length) currentSlide = 0;
        if (currentSlide < 0) currentSlide = slides.length - 1;
        
        // Pequeño delay para forzar reinicio de animación CSS
        setTimeout(() => {
            slides[currentSlide].classList.add('active');
            indicators[currentSlide].classList.add('active');
        }, 50);
    }

    // Cambio automático cada 7 segundos
    setInterval(() => {
        currentSlide++;
        showSlide(currentSlide);
    }, 7000);

    // Click en indicadores
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showSlide(index);
        });
    });
});

// ============= MODAL DE PRECIOS =============
const modal = document.getElementById('pricesModal');
const closeBtn = document.querySelector('.close');

function showPrices(tipo) {
    const lang = translations[currentLanguage];
    const modalTitle = document.getElementById('modalTitle');
    const pricesContent = document.getElementById('pricesContent');
    
    // Guardar el tipo actual para poder actualizar al cambiar idioma
    modal.dataset.currentType = tipo;
    
    // Títulos según tipo
    const titulos = {
        'dulce': 'titleFreshwater',
        'marino': 'titleMarine',
        'plantado': 'titlePlanted',
        'comercial': 'titleCommercial'
    };
    
    modalTitle.textContent = lang.modal[titulos[tipo]];
    
    // Generar tabla de precios
    const precios = preciosEstandar[tipo];
    let html = '<table class="price-table">';
    html += `<thead><tr><th>${lang.modal.dimensions}</th><th>${lang.modal.capacity}</th><th>${lang.modal.price}</th></tr></thead>`;
    html += '<tbody>';
    
    precios.forEach(item => {
        html += `<tr>
            <td><strong>${item.medida}</strong></td>
            <td>${item.litros} ${lang.modal.liters}</td>
            <td class="price-value">${item.precio} ${lang.currency}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    html += `<p style="margin-top: 1.5rem; text-align: center; color: #666;">${lang.modal.customNote}</p>`;
    
    pricesContent.innerHTML = html;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Cerrar modal con X
if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

// Cerrar modal al hacer click fuera
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// ============= COTIZADOR =============
// Función para calcular grosor recomendado del vidrio
function calcularGrosorRecomendado(largo, alto, fondo) {
    // Usar el panel más largo para cálculo (largo o fondo)
    const panelMasLargo = Math.max(largo, fondo);
    
    // Fórmula simplificada con factor de seguridad 3.8 (estándar industria)
    // Basada en presión hidráulica y flexión del panel
    const factorSeguridad = 3.8;
    const grosorCalculado = Math.sqrt((alto * panelMasLargo * factorSeguridad) / 100);
    
    // Redondear a grosores estándar disponibles: 6, 8, 10, 12, 15mm
    if (grosorCalculado <= 7) return '6';
    if (grosorCalculado <= 9) return '8';
    if (grosorCalculado <= 11) return '10';
    if (grosorCalculado <= 13) return '12';
    return '15';
}

// FUNCIONES ANTIGUAS DEL COTIZADOR - DESACTIVADAS (ahora en cotizador.js)
// Función principal para calcular el precio - ANTIGUA VERSION
/*
async function calcularPrecio() {
    // Validar formulario
    if (!validarFormularioCotizador()) {
        return;
    }

    // Obtener valores del formulario
    const largo = parseFloat(document.getElementById('largo').value);
    const ancho = parseFloat(document.getElementById('fondo').value); // fondo = ancho
    const alto = parseFloat(document.getElementById('alto').value);
    const grosorSeleccionado = calcularGrosorRecomendado(largo, alto, ancho);
    const perimetrales = false; // Por defecto no tiene perimetrales
    const numTirantes = 0; // Por defecto sin tirantes

    // Mapear grosor a código
    const codigoGrosor = mapearGrosorACodigo(grosorSeleccionado + 'mm');
    if (!codigoGrosor) {
        mostrarError(translations[currentLanguage].form.errorCalculation || 'Error al calcular el precio');
        return;
    }

    // Mostrar estado de carga
    const resultadoDiv = document.getElementById('resultado-precio');
    if (!resultadoDiv) {
        // Si no existe el div de resultado, crear uno temporal en price-estimate
        const priceEstimate = document.querySelector('.price-estimate');
        if (priceEstimate) {
            let tempDiv = document.getElementById('resultado-precio');
            if (!tempDiv) {
                tempDiv = document.createElement('div');
                tempDiv.id = 'resultado-precio';
                priceEstimate.appendChild(tempDiv);
            }
        }
    }
    
    const resultDiv = document.getElementById('resultado-precio');
    if (resultDiv) {
        resultDiv.innerHTML = '<p class="calculando">⏳ ' + (translations[currentLanguage].form.calculating || 'Calculando...') + '</p>';
        resultDiv.style.display = 'block';
    }

    try {
        // Llamar al API de Google Sheets
        const url = CONFIG.googleSheetsAPI + 
            '?largo=' + largo +
            '&ancho=' + ancho +
            '&alto=' + alto +
            '&codigo_grosor=' + codigoGrosor +
            '&perimetrales=' + perimetrales +
            '&tirantes=' + numTirantes;

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Mostrar resultado
        mostrarPrecioCalculado(data);

        // Scroll suave al precio
        document.querySelector('.price-estimate').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });

    } catch (error) {
        console.error('Error al calcular precio:', error);
        mostrarError(translations[currentLanguage].form.errorCalculation || 'Error al calcular el precio. Inténtalo de nuevo.');
    }
}

// Calcular precio automáticamente al cambiar valores
document.addEventListener('DOMContentLoaded', () => {
    // Actualizar grosor recomendado al cambiar dimensiones
    const dimensionInputs = ['largo', 'alto', 'fondo'];
    dimensionInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', actualizarGrosorRecomendado);
        }
    });
    
    const formInputs = document.querySelectorAll('#quoterForm input, #quoterForm select');
    formInputs.forEach(input => {
        input.addEventListener('change', () => {
            // Solo calcular si hay valores básicos
            const tipo = document.getElementById('tipo').value;
            const largo = document.getElementById('largo').value;
            const alto = document.getElementById('alto').value;
            const fondo = document.getElementById('fondo').value;
            
            if (tipo && largo && alto && fondo) {
                calcularPrecio();
            }
        });
    });
});

// Función para actualizar solo el grosor recomendado sin calcular precio
function actualizarGrosorRecomendado() {
    const lang = translations[currentLanguage];
    const largo = parseInt(document.getElementById('largo').value) || 0;
    const alto = parseInt(document.getElementById('alto').value) || 0;
    const fondo = parseInt(document.getElementById('fondo').value) || 0;
    
    if (largo >= 30 && alto >= 30 && fondo >= 30) {
        const grosor = calcularGrosorRecomendado(largo, alto, fondo);
        const grosorDisplay = document.getElementById('grosorRecomendado');
        
        if (grosorDisplay) {
            const grosorTextos = {
                '6': lang.form.glass6mm,
                '8': lang.form.glass8mm,
                '10': lang.form.glass10mm,
                '12': lang.form.glass12mm,
                '15': lang.form.glass15mm
            };
            grosorDisplay.innerHTML = `<strong>${grosor}mm</strong> - ${grosorTextos[grosor]}`;
            grosorDisplay.style.color = '#00a8e8';
            grosorDisplay.setAttribute('data-grosor', grosor);
        }
    }
}

// ============= ENVÍO DEL FORMULARIO =============
const quoterForm = document.getElementById('quoterForm');
if (quoterForm) {
    quoterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const lang = translations[currentLanguage];
    
    // Obtener grosor calculado
    const grosorElement = document.getElementById('grosorRecomendado');
    const grosor = grosorElement ? grosorElement.getAttribute('data-grosor') : '8';
    
    // Obtener todos los datos del formulario
    const formData = {
        nombre: document.getElementById('nombre').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        ciudad: document.getElementById('ciudad').value,
        tipo: document.getElementById('tipo').value,
        dimensiones: {
            largo: document.getElementById('largo').value,
            alto: document.getElementById('alto').value,
            fondo: document.getElementById('fondo').value
        },
        grosor: grosor,
        calidad: document.getElementById('calidad').value,
        opciones: [],
        notas: document.getElementById('notas').value,
        precioEstimado: document.getElementById('precioEstimado').textContent
    };
    
    // Recoger opciones seleccionadas
    Object.keys(preciosBase.opciones).forEach(opcion => {
        const checkbox = document.getElementById(opcion);
        if (checkbox && checkbox.checked) {
            formData.opciones.push(opcion);
        }
    });
    
    // Calcular litros para incluir en el email
    const litros = (formData.dimensiones.largo * formData.dimensiones.alto * formData.dimensiones.fondo) / 1000;
    
    // Crear el cuerpo del email en el idioma actual
    const subject = encodeURIComponent(
        currentLanguage === 'es' 
            ? 'Solicitud de Presupuesto - Acuario a Medida'
            : 'Quote Request - Custom Aquarium'
    );
    
    const bodyText = currentLanguage === 'es' ? `
Solicitud de Presupuesto - Acuario a Medida
========================================

DATOS DEL CLIENTE:
Nombre: ${formData.nombre}
Email: ${formData.email}
Teléfono: ${formData.telefono}
Ciudad: ${formData.ciudad}

CONFIGURACIÓN DEL ACUARIO:
Tipo: ${formData.tipo}
Dimensiones: ${formData.dimensiones.largo}cm x ${formData.dimensiones.alto}cm x ${formData.dimensiones.fondo}cm
Capacidad aproximada: ${Math.round(litros)} litros
Grosor del vidrio: ${formData.grosor}mm
Calidad del vidrio: ${formData.calidad}

OPCIONES ADICIONALES:
${formData.opciones.length > 0 ? formData.opciones.join(', ') : 'Ninguna'}

COMENTARIOS:
${formData.notas || 'Sin comentarios adicionales'}

PRECIO ESTIMADO: ${formData.precioEstimado}

========================================
Este es un presupuesto orientativo generado automáticamente.
Por favor, envíe un presupuesto detallado y personalizado.

Coraline Acuarios
    ` : `
Quote Request - Custom Aquarium
========================================

CLIENT INFORMATION:
Name: ${formData.nombre}
Email: ${formData.email}
Phone: ${formData.telefono}
City: ${formData.ciudad}

AQUARIUM CONFIGURATION:
Type: ${formData.tipo}
Dimensions: ${formData.dimensiones.largo}cm x ${formData.dimensiones.alto}cm x ${formData.dimensiones.fondo}cm
Approximate capacity: ${Math.round(litros)} liters
Glass thickness: ${formData.grosor}mm
Glass quality: ${formData.calidad}

ADDITIONAL OPTIONS:
${formData.opciones.length > 0 ? formData.opciones.join(', ') : 'None'}

COMMENTS:
${formData.notas || 'No additional comments'}

ESTIMATED PRICE: ${formData.precioEstimado}

========================================
This is an automatically generated estimated quote.
Please send a detailed and personalized quote.

Coraline Acuarios
    `;
    
    const body = encodeURIComponent(bodyText);
    
    // Abrir cliente de correo con los datos prellenados
    window.location.href = `mailto:info@coralineacuarios.com?subject=${subject}&body=${body}`;
    
    // Mostrar mensaje de confirmación
    alert(lang.form.successMessage)
    // document.getElementById('precioEstimado').textContent = '0 €';
    });
}

// ============= ANIMACIONES AL SCROLL =============
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observar elementos para animar
document.addEventListener('DOMContentLoaded', () => {
    const elementsToAnimate = document.querySelectorAll('.catalog-card, .feature-item, .contact-item');
    elementsToAnimate.forEach(el => observer.observe(el));
});

// ============= FUNCIONES PARA GOOGLE SHEETS API =============

// Función para mapear grosor seleccionado a código de Google Sheets
function mapearGrosorACodigo(grosor) {
    const mapeo = {
        '6mm': 1,
        '8mm': 2,
        '10mm': 3,
        '12mm': 4,
        '15mm': 5,
        '19mm': 6,
        '10+10': 7,
        '10+10t': 8
    };
    return mapeo[grosor] || null;
}

// Función para mostrar el precio calculado (SOLO TOTAL)
function mostrarPrecioCalculado(data) {
    const resultadoDiv = document.getElementById('resultado-precio');
    if (!resultadoDiv) return;
    
    const html = `
        <div class="precio-resultado">
            <div class="precio-principal">
                <span class="etiqueta">${translations[currentLanguage].form.totalPrice || 'Precio Total'}:</span>
                <span class="valor">${formatearMoneda(data.total)}</span>
            </div>
            <div class="info-adicional">
                <p>📏 ${translations[currentLanguage].form.volume || 'Volumen'}: ${data.litros.toFixed(2)} L</p>
                <p class="nota-precio">
                    💡 ${translations[currentLanguage].form.priceNote || 'Precio estimado. Solicita presupuesto final.'}
                </p>
            </div>
        </div>
    `;
    
    resultadoDiv.innerHTML = html;
    resultadoDiv.style.display = 'block';
}

// Función para formatear moneda
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(valor);
}

*/

// Función para validar el formulario - ANTIGUA VERSION
/*
function validarFormularioCotizador() {
    const largo = document.getElementById('largo').value;
    const ancho = document.getElementById('fondo').value;
    const alto = document.getElementById('alto').value;

    if (!largo || !ancho || !alto) {
        mostrarError(translations[currentLanguage].form.fillAllFields || 'Por favor completa todos los campos');
        return false;
    }

    if (parseFloat(largo) <= 0 || parseFloat(ancho) <= 0 || parseFloat(alto) <= 0) {
        mostrarError(translations[currentLanguage].form.invalidDimensions || 'Las dimensiones deben ser mayores a 0');
        return false;
    }

    return true;
}

// Función para mostrar errores - ANTIGUA VERSION
function mostrarError(mensaje) {
    const resultadoDiv = document.getElementById('resultado-precio');
    if (!resultadoDiv) {
        // Si no existe, crearlo
        const priceEstimate = document.querySelector('.price-estimate');
        if (priceEstimate) {
            const newDiv = document.createElement('div');
            newDiv.id = 'resultado-precio';
            priceEstimate.appendChild(newDiv);
        }
    }
    const resultDiv = document.getElementById('resultado-precio');
    if (resultDiv) {
        resultDiv.innerHTML = `<p class="error">⚠️ ${mensaje}</p>`;
        resultDiv.style.display = 'block';
    }
}
*/
// ========== FIN FUNCIONES ANTIGUAS COTIZADOR ==========

console.log('🐠 AcuariosPro - Web cargada correctamente');
