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
    // Distribución más variada y orgánica
    const tamanos = [
        'size-small',    // 1x1 - fotos compactas
        'size-medium',   // 1x2 - fotos verticales medianas
        'size-large',    // 2x2 - fotos destacadas grandes
        'size-tall'      // 1x3 - fotos verticales altas
    ];
    
    // Patrón de repetición para variedad balanceada
    // 40% small, 30% medium, 20% large, 10% tall
    const patron = [
        'size-small', 'size-small', 'size-medium', 'size-small', 
        'size-medium', 'size-large', 'size-small', 'size-medium',
        'size-tall', 'size-small'
    ];
    
    let indiceTamano = 0;
    
    // Generar rutas para todas las fotos
    for (let proyecto = 1; proyecto <= 17; proyecto++) {
        const numFotos = fotosPorProyecto[proyecto];
        
        for (let foto = 1; foto <= numFotos; foto++) {
            const proyectoStr = proyecto.toString().padStart(2, '0');
            const fotoStr = foto.toString().padStart(3, '0');
            
            // Excepción: proyecto 10 foto 3 es .jpeg, las demás son .jpg
            const extension = (proyecto === 10 && foto === 3) ? 'jpeg' : 'jpg';
            
            // Asignar tamaño siguiendo el patrón con algo de aleatoriedad
            const tamanoSeleccionado = patron[indiceTamano % patron.length];
            indiceTamano++;
            
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
    
    console.log('✅ Galería cargada - Layout: CSS Grid collage orgánico');
    console.log('📐 Tamaños: size-small (1x1), size-medium (1x2), size-large (2x2), size-tall (1x3)');
}
