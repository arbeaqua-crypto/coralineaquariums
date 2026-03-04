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
    setupScrollDetection();
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
        photosContainer.setAttribute('data-project-id', numProyecto);

        // Container de miniaturas
        const thumbnailsContainer = document.createElement('div');
        thumbnailsContainer.className = 'project-thumbnails';

        // Agregar fotos del proyecto y sus miniaturas
        for (let numFoto = 1; numFoto <= numFotos; numFoto++) {
            const proyectoStr = numProyecto.toString().padStart(2, '0');
            const fotoStr = numFoto.toString().padStart(3, '0');
            
            // Excepción: proyecto 10 foto 3 es .jpeg
            const extension = (numProyecto === 10 && numFoto === 3) ? 'jpeg' : 'jpg';
            const rutaImagen = `images/proyectos/proyecto_${proyectoStr}_${fotoStr}.${extension}`;

            // Foto principal
            const img = document.createElement('img');
            img.src = rutaImagen;
            img.alt = `Proyecto ${numProyecto} - Foto ${numFoto}`;
            img.className = 'project-photo';
            img.loading = 'lazy';
            img.onerror = function() { this.src = 'images/placeholder.jpg'; };
            img.setAttribute('data-photo-index', numFoto - 1);

            photosContainer.appendChild(img);

            // Miniatura
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            if (numFoto === 1) thumbnail.classList.add('active');
            thumbnail.setAttribute('data-photo-index', numFoto - 1);
            thumbnail.setAttribute('data-project-id', numProyecto);
            thumbnail.addEventListener('click', () => {
                scrollToPhoto(numProyecto, numFoto - 1);
            });

            thumbnailsContainer.appendChild(thumbnail);
        }

        projectRow.appendChild(photosContainer);
        projectRow.appendChild(thumbnailsContainer);
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

// Scroll a una foto específica
function scrollToPhoto(projectId, photoIndex) {
    const photosContainer = document.querySelector(`.project-photos[data-project-id="${projectId}"]`);
    if (!photosContainer) return;

    const photos = photosContainer.querySelectorAll('.project-photo');
    const targetPhoto = photos[photoIndex];
    if (!targetPhoto) return;

    // Calcular posición para centrar la foto
    const containerWidth = photosContainer.offsetWidth;
    const photoLeft = targetPhoto.offsetLeft;
    const photoWidth = targetPhoto.offsetWidth;
    const scrollPosition = photoLeft - (containerWidth / 2) + (photoWidth / 2);

    photosContainer.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
    });

    // Actualizar miniatura activa
    updateActiveThumbnail(projectId, photoIndex);
}

// Actualizar miniatura activa
function updateActiveThumbnail(projectId, photoIndex) {
    const thumbnails = document.querySelectorAll(`.thumbnail[data-project-id="${projectId}"]`);
    thumbnails.forEach((thumb, index) => {
        if (index === photoIndex) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}

// Detectar qué foto está visible durante el scroll
function setupScrollDetection() {
    const scrollContainers = document.querySelectorAll('.project-photos');
    
    scrollContainers.forEach(container => {
        container.addEventListener('scroll', () => {
            const projectId = container.getAttribute('data-project-id');
            const photos = container.querySelectorAll('.project-photo');
            const containerRect = container.getBoundingClientRect();
            const containerCenter = containerRect.left + containerRect.width / 2;

            let closestIndex = 0;
            let closestDistance = Infinity;

            photos.forEach((photo, index) => {
                const photoRect = photo.getBoundingClientRect();
                const photoCenter = photoRect.left + photoRect.width / 2;
                const distance = Math.abs(photoCenter - containerCenter);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            });

            updateActiveThumbnail(projectId, closestIndex);
        });
    });
}
