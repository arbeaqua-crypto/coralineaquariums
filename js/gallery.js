// ============= GALERÍA DE PROYECTOS - COLLAGE MASONRY =============

// Generar array de proyectos automáticamente
// 92 fotos: proyecto_01_001.jpg hasta proyecto_17_004.jpg
const proyectos = generarArrayDeProyectos();

function generarArrayDeProyectos() {
    const fotos = [];
    
    // Estructura de carpetas: cantidad de fotos por proyecto
    const fotosPorProyecto = {
        1: 2,
        2: 5,
        3: 11,
        4: 3,
        5: 6,
        6: 4,
        7: 5,
        8: 3,
        9: 4,
        10: 3,
        11: 9,
        12: 10,
        13: 5,
        14: 5,
        15: 3,
        16: 10,
        17: 4
    };
    
    // Tamaños posibles para crear variedad en el collage
    // Distribución balanceada: 30% pequeñas, 40% medianas, 20% grandes, 10% altas
    const tamanos = [
        'size-small', 'size-small', 'size-small',      // 30%
        'size-medium', 'size-medium', 'size-medium', 'size-medium',  // 40%
        'size-large', 'size-large',                    // 20%
        'size-tall'                                    // 10%
    ];
    
    let contadorTamano = 0;
    
    // Generar rutas para todas las fotos
    for (let proyecto = 1; proyecto <= 17; proyecto++) {
        const numFotos = fotosPorProyecto[proyecto];
        
        for (let foto = 1; foto <= numFotos; foto++) {
            const proyectoStr = proyecto.toString().padStart(2, '0');
            const fotoStr = foto.toString().padStart(3, '0');
            
            // Excepción: proyecto 10 foto 3 es .jpeg, las demás son .jpg
            const extension = (proyecto === 10 && foto === 3) ? 'jpeg' : 'jpg';
            
            // Asignar tamaño de forma cíclica pero con algo de aleatoriedad
            const indiceAleatorio = Math.floor(Math.random() * tamanos.length);
            const tamanoSeleccionado = tamanos[indiceAleatorio];
            
            fotos.push({
                img: `images/proyectos/proyecto_${proyectoStr}_${fotoStr}.${extension}`,
                proyecto: proyecto,
                size: tamanoSeleccionado
            });
        }
    }
    
    return fotos;
}

document.addEventListener('DOMContentLoaded', () => {
    cargarGaleria();
});

// Cargar las imágenes en el grid masonry
function cargarGaleria() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    grid.innerHTML = '';

    console.log('🎨 Cargando galería masonry con', proyectos.length, 'fotos');

    proyectos.forEach((proyecto, index) => {
        const item = document.createElement('div');
        item.className = `gallery-item ${proyecto.size}`;
        item.setAttribute('data-index', index);

        item.innerHTML = `
            <img src="${proyecto.img}" alt="Proyecto ${proyecto.proyecto}" onerror="this.src='images/placeholder.jpg'" loading="lazy">
        `;

        grid.appendChild(item);
    });
    
    console.log('✅ Galería cargada - Layout: masonry con 4 columnas');
}
