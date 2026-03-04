// ============= GALERÍA DE PROYECTOS - FILAS CON SCROLL HORIZONTAL =============

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

document.addEventListener('DOMContentLoaded', () => {
    cargarGaleria();
    activarDragScroll();
});

// Cargar las imágenes organizadas por proyecto en filas horizontales
function cargarGaleria() {
    const container = document.getElementById('galleryGrid');
    if (!container) return;

    container.innerHTML = '';
    container.className = 'gallery-container';

    console.log('🎨 Cargando galería por proyectos con scroll horizontal');

    // Crear una fila por cada proyecto
    for (let numProyecto = 1; numProyecto <= 17; numProyecto++) {
        const numFotos = fotosPorProyecto[numProyecto];
        
        // Crear fila del proyecto
        const projectRow = document.createElement('div');
        projectRow.className = 'project-row';
        projectRow.setAttribute('data-project', numProyecto);

        // Container de fotos con scroll horizontal
        const photosContainer = document.createElement('div');
        photosContainer.className = 'project-photos';

        // Agregar fotos del proyecto
        for (let numFoto = 1; numFoto <= numFotos; numFoto++) {
            const proyectoStr = numProyecto.toString().padStart(2, '0');
            const fotoStr = numFoto.toString().padStart(3, '0');
            
            // Excepción: proyecto 10 foto 3 es .jpeg
            const extension = (numProyecto === 10 && numFoto === 3) ? 'jpeg' : 'jpg';
            const rutaImagen = `images/proyectos/proyecto_${proyectoStr}_${fotoStr}.${extension}`;

            const img = document.createElement('img');
            img.src = rutaImagen;
            img.alt = `Proyecto ${numProyecto} - Foto ${numFoto}`;
            img.className = 'project-photo';
            img.loading = 'lazy';
            img.onerror = function() { this.src = 'images/placeholder.jpg'; };

            photosContainer.appendChild(img);
        }

        projectRow.appendChild(photosContainer);
        container.appendChild(projectRow);
    }
    
    console.log('✅ Galería cargada - 17 proyectos con scroll horizontal arrastrando');
}

// Activar funcionalidad de arrastrar para hacer scroll
function activarDragScroll() {
    const scrollContainers = document.querySelectorAll('.project-photos');
    
    scrollContainers.forEach(container => {
        let isDown = false;
        let startX;
        let scrollLeft;

        container.addEventListener('mousedown', (e) => {
            isDown = true;
            container.classList.add('active');
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            container.style.cursor = 'grabbing';
        });

        container.addEventListener('mouseleave', () => {
            isDown = false;
            container.classList.remove('active');
            container.style.cursor = 'grab';
        });

        container.addEventListener('mouseup', () => {
            isDown = false;
            container.classList.remove('active');
            container.style.cursor = 'grab';
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2; // Velocidad de scroll
            container.scrollLeft = scrollLeft - walk;
        });
    });
    
    console.log('✅ Drag-to-scroll activado en', scrollContainers.length, 'filas');
}
