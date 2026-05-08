/**
 * Funciones de desglose para cotizador 3D.
 * Guarda el presupuesto detallado en localStorage para contacto.html.
 */

function toggleDesglose() {
    const content = document.getElementById('desgloseContent');
    const icon = document.getElementById('desgloseToggleIcon');

    if (!content || !icon) return;

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '-';
    } else {
        content.style.display = 'none';
        icon.textContent = '+';
    }
}

function enviarPresupuestoDetallado() {
    const precioFinalEl = document.getElementById('precioFinal');
    const precioFinalTexto = precioFinalEl ? precioFinalEl.textContent.trim() : '';
    const precioTotal = parseFloat(precioFinalTexto.replace('EUR', '').replace('€', '').replace(',', '.'));

    if (!precioTotal || isNaN(precioTotal)) {
        alert('Por favor, calcula el precio primero antes de enviar el presupuesto.');
        return;
    }

    const subtotal = Math.round((precioTotal / 1.21) * 100) / 100;
    const iva = Math.round((precioTotal - subtotal) * 100) / 100;

    const desglose = {
        acuarioBase: {
            descripcion: 'Acuario personalizado',
            precio: subtotal
        },
        items: [],
        subtotal: subtotal,
        iva: iva,
        total: precioTotal
    };

    localStorage.setItem('presupuesto-detallado', JSON.stringify(desglose));
    window.location.href = 'contacto.html';
}

function generarDesgloseCompleto() {
    const desgloseDiv = document.getElementById('desgloseGenerado');
    if (!desgloseDiv) return;

    const precioFinalEl = document.getElementById('precioFinal');
    const precioFinalTexto = precioFinalEl ? precioFinalEl.textContent.trim() : '';
    const precioTotal = parseFloat(precioFinalTexto.replace('EUR', '').replace('€', '').replace(',', '.'));

    if (!precioTotal || isNaN(precioTotal)) {
        desgloseDiv.innerHTML = '<p style="color:#f44336;">Por favor, calcula el precio primero.</p>';
        return;
    }

    const subtotal = Math.round((precioTotal / 1.21) * 100) / 100;
    const iva = Math.round((precioTotal - subtotal) * 100) / 100;

    desgloseDiv.innerHTML = `
        <table style="width:100%; border-collapse:collapse; background:white;">
            <tr style="background:#f0f0f0;">
                <td style="padding:10px; border:1px solid #ddd;"><strong>Concepto</strong></td>
                <td style="padding:10px; border:1px solid #ddd; text-align:right;"><strong>Precio</strong></td>
            </tr>
            <tr>
                <td style="padding:10px; border:1px solid #ddd;">Acuario personalizado</td>
                <td style="padding:10px; border:1px solid #ddd; text-align:right;">${subtotal.toFixed(2)}EUR</td>
            </tr>
            <tr style="background:#f0f0f0;">
                <td style="padding:10px; border:1px solid #ddd;"><strong>Subtotal</strong></td>
                <td style="padding:10px; border:1px solid #ddd; text-align:right;"><strong>${subtotal.toFixed(2)}EUR</strong></td>
            </tr>
            <tr>
                <td style="padding:10px; border:1px solid #ddd;">IVA (21%)</td>
                <td style="padding:10px; border:1px solid #ddd; text-align:right;">${iva.toFixed(2)}EUR</td>
            </tr>
            <tr style="background:#667eea; color:white;">
                <td style="padding:10px; border:1px solid #667eea;"><strong>TOTAL</strong></td>
                <td style="padding:10px; border:1px solid #667eea; text-align:right;"><strong>${precioTotal.toFixed(2)}EUR</strong></td>
            </tr>
        </table>
    `;
}
