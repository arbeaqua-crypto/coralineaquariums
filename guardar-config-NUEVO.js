// FUNCIÓN SIMPLIFICADA PARA GUARDAR CONFIGURACIÓN
// Esta función lee directamente lo que está en pantalla en lugar de recalcular

function guardarConfiguracionYSolicitar() {
    try {
        console.log('🚀 INICIO: Guardando configuración...');
        
        // ========== 1. CAPTURAR MEDIDAS BÁSICAS ==========
        const largo = parseInt(document.getElementById('largo').value) || 0;
        const ancho = parseInt(document.getElementById('ancho').value) || 0;
        const alto = parseInt(document.getElementById('alto').value) || 0;
        
        if (largo === 0 || ancho === 0 || alto === 0) {
            alert('Por favor, calcula el precio del acuario primero');
            return;
        }
        
        const grosorSelector = document.getElementById('grosor').value;
        const grosorMap = {'1': 6, '2': 8, '3': 10, '4': 12, '5': 15, '6': 19, '7': 20};
        const grosor = grosorMap[grosorSelector] || 10;
        const tipoRefuerzo = document.getElementById('tipoRefuerzo').value;
        const colorSilicona = document.getElementById('colorSilicona').value;
        const litros = Math.round((largo * ancho * alto) / 1000);
        
        console.log('📏 Medidas:', {largo, ancho, alto, litros, grosor});
        
        // ========== 2. CAPTURAR PRECIO FINAL (EL QUE SE VE EN PANTALLA) ==========
        const precioFinalElement = document.getElementById('precioFinal');
        const precioFinalTexto = precioFinalElement ? precioFinalElement.textContent.trim() : '0€';
        
        console.log('💰 Precio final visible:', precioFinalTexto);
        
        // ========== 3. CAPTURAR TODOS LOS EXTRAS MARCADOS ==========
        const extrasDesglose = [];
        let totalExtras = 0;
        
        //Función helper para leer checkboxes y sus precios
        function leerExtra(checkboxId, nombreDisplay) {
            const checkbox = document.getElementById(checkboxId);
            if (!checkbox || !checkbox.checked) return 0;
            
            // Buscar el span de precio cerca del checkbox
            const label = checkbox.closest('label') || checkbox.parentElement;
            const precioSpan = label.querySelector('.extra-price');
            
            if (precioSpan) {
                const precioTexto = precioSpan.textContent.replace('+', '').replace('€', '').trim();
                const precio = parseFloat(precioTexto) || 0;
                
                if (precio > 0) {
                    extrasDesglose.push({nombre: nombreDisplay, precio: precio});
                    console.log(`  ✓ ${nombreDisplay}: +${precio}€`);
                }
                return precio;
            }
            return 0;
        }
        
        console.log('📝 Escaneando extras marcados...');
        
        // Cristales ópticos
        totalExtras += leerExtra('opticoFrontal', 'Cristal óptico frontal');
        totalExtras += leerExtra('opticoTrasera', 'Cristal óptico trasera');
        totalExtras += leerExtra('opticoLateralIzq', 'Cristal óptico lateral izquierdo');
        totalExtras += leerExtra('opticoLateralDer', 'Cristal óptico lateral derecho');
        
        // Rebosaderos
        totalExtras += leerExtra('rebosaderoGeneral', 'Rebosadero General Interior');
        totalExtras += leerExtra('rebosaderoEsquinero', 'Rebosadero Esquinero');
        totalExtras += leerExtra('rebosaderoEtapa', 'Rebosadero Doble Etapa');
        totalExtras += leerExtra('rebosaderoDiagonal', 'Rebosadero Diagonal');
        totalExtras += leerExtra('rebosaderoColumna', 'Rebosadero Columna Central');
        totalExtras += leerExtra('rebosaderoExterno', 'Rebosadero Externo');
        
        // Vinilos
        totalExtras += leerExtra('extraViniloLateralDerecho', 'Vinilo lateral derecho');
        totalExtras += leerExtra('extraViniloLateralIzquierdo', 'Vinilo lateral izquierdo');
        totalExtras += leerExtra('extraViniloTrasero', 'Lámina trasera');
        
        // Vinilo fondo (dropdown)
        const viniloFondoSelect = document.getElementById('viniloFondo');
        if (viniloFondoSelect && viniloFondoSelect.value !== 'no') {
            const precioSpan = document.getElementById('precioViniloFondo');
            if (precioSpan) {
                const precioTexto = precioSpan.textContent.replace('+', '').replace('€', '').trim();
                const precio = parseFloat(precioTexto) || 0;
                if (precio > 0) {
                    const color = viniloFondoSelect.options[viniloFondoSelect.selectedIndex].text;
                    extrasDesglose.push({nombre: `Vinilo fondo (${color})`, precio: precio});
                    totalExtras += precio;
                    console.log(`  ✓ Vinilo fondo (${color}): +${precio}€`);
                }
            }
        }
        
        // Encintados
        totalExtras += leerExtra('extraEncintadoSuperficie', 'Encintado superficie');
        totalExtras += leerExtra('extraEncintadoBase', 'Encintado base');
        totalExtras += leerExtra('extraViniladoRebosadero', 'Vinilado rebosadero');
        
        // Otros acabados
        totalExtras += leerExtra('extraTaladrosOverflow', 'Taladros para Overflow');
        totalExtras += leerExtra('extraTaladroSubida', 'Taladro adicional para subida');
        totalExtras += leerExtra('extraTaladroVaciado', 'Taladro especial para vaciado');
        totalExtras += leerExtra('extraTapasNoCorrederas', 'Tapas no correderas');
        totalExtras += leerExtra('extraTapasCorrederas', 'Tapas correderas');
        totalExtras += leerExtra('extraTaladrosAdicionales', 'Taladros adicionales');
        
        console.log(`💰 Total extras: +${totalExtras.toFixed(2)}€`);
        console.log(`📦 ${extrasDesglose.length} extras seleccionados`);
        
        // ========== 4. CREAR OBJETO DE CONFIGURACIÓN SIMPLIFICADO ==========
        const config = {
            timestamp: new Date().toISOString(),
            medidas: {largo, ancho, alto, litros},
            cristal: {grosor, grosorTexto: grosor + 'mm', colorSilicona, tipoRefuerzo},
            precio: precioFinalTexto,
            totalExtras: totalExtras.toFixed(2) + '€',
            extrasDesglose: extrasDesglose
        };
        
        // ========== 5. GUARDAR EN LOCALSTORAGE ==========
        localStorage.setItem('configuracion-acuario', JSON.stringify(config));
        console.log('✅ Configuración guardada correctamente');
        console.log('📦 Datos:', config);
        
        // ========== 6. REDIRIGIR A CONTACTO ==========
        console.log('🔀 Redirigiendo a contacto.html...');
        window.location.href = 'contacto.html';
        
    } catch (error) {
        console.error('❌ ERROR en guardarConfiguracionYSolicitar:', error);
        alert('Error al guardar la configuración. Por favor, revisa la consola (F12) para más detalles.');
    }
}
