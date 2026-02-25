// ============= GALERÍA DE PROYECTOS =============

// Array de proyectos (AQUÍ AGREGAS TUS FOTOS)
const proyectos = [
    {
        img: 'images/proyectos/proyecto1.jpg',
        titulo: 'Acuario Marino 300L',
        ubicacion: 'Barcelona, 2024',
        categoria: 'marino'
    },
    {
        img: 'images/proyectos/proyecto2.jpg',
        titulo: 'Acuario Plantado 200L',
        ubicacion: 'Madrid, 2024',
        categoria: 'plantado'
    },
    {
        img: 'images/proyectos/proyecto3.jpg',
        titulo: 'Acuario Comercial 500L',
        ubicacion: 'Valencia, 2023',
        categoria: 'comercial'
    },
    {
        img: 'images/proyectos/proyecto4.jpg',
        titulo: 'Acuario Agua Dulce 150L',
        ubicacion: 'Sevilla, 2024',
        categoria: 'dulce'
    },
    {
        img: 'images/proyectos/proyecto5.jpg',
        titulo: 'Acuario Marino 400L',
        ubicacion: 'Bilbao, 2023',
        categoria: 'marino'
    },
    {
        img: 'images/proyectos/proyecto6.jpg',
        titulo: 'Acuario Plantado 120L',
        ubicacion: 'Málaga, 2024',
        categoria: 'plantado'
    }
    // Agregar más proyectos según necesites
];

let currentImageIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    cargarGaleria();
    configurarFiltros();
    configurarLightbox();
});

// Cargar las imágenes en el grid
function cargarGaleria() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    grid.innerHTML = '';

    proyectos.forEach((proyecto, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.setAttribute('data-category', proyecto.categoria);
        item.setAttribute('data-index', index);

        item.innerHTML = `
            <img src="${proyecto.img}" alt="${proyecto.titulo}" onerror="this.src='images/placeholder.jpg'">
            <div class="gallery-overlay">
                <h3>${proyecto.titulo}</h3>
                <p>${proyecto.ubicacion}</p>
            </div>
        `;

        item.addEventListener('click', () => abrirLightbox(index));
        grid.appendChild(item);
    });
}

// Configurar filtros
function configurarFiltros() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Actualizar botón activo
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filtrar elementos
            const filter = btn.getAttribute('data-filter');
            const items = document.querySelectorAll('.gallery-item');

            items.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });
}

// Configurar lightbox
function configurarLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');

    // Cerrar lightbox
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarLightbox);
    }

    // Cerrar al hacer click fuera de la imagen
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                cerrarLightbox();
            }
        });
    }

    // Navegación
    if (prevBtn) {
        prevBtn.addEventListener('click', imagenAnterior);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', imagenSiguiente);
    }

    // Teclado
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') cerrarLightbox();
        if (e.key === 'ArrowLeft') imagenAnterior();
        if (e.key === 'ArrowRight') imagenSiguiente();
    });
}

function abrirLightbox(index) {
    currentImageIndex = index;
    mostrarImagenLightbox();
    
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function mostrarImagenLightbox() {
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const proyecto = proyectos[currentImageIndex];

    if (lightboxImg && proyecto) {
        lightboxImg.src = proyecto.img;
        lightboxCaption.innerHTML = `<strong>${proyecto.titulo}</strong><br>${proyecto.ubicacion}`;
    }
}

function imagenAnterior() {
    currentImageIndex--;
    if (currentImageIndex < 0) {
        currentImageIndex = proyectos.length - 1;
    }
    mostrarImagenLightbox();
}

function imagenSiguiente() {
    currentImageIndex++;
    if (currentImageIndex >= proyectos.length) {
        currentImageIndex = 0;
    }
    mostrarImagenLightbox();
}
