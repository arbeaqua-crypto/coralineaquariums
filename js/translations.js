// Sistema de traducción para Coraline Acuarios
const translations = {
    es: {
        nav: {
            home: "Inicio",
            about: "Nosotros",
            catalog: "Catálogo",
            gallery: "Galería",
            quote: "Cotizar Ahora",
            contact: "Contacto"
        },
        hero: {
            slide1: {
                title: "Fabricación de Acuarios a Medida",
                text: "Diseñamos y construimos el acuario perfecto que más encaja contigo."
            },
            slide2: {
                title: "El Acuario o la Instalación que Necesites",
                text: "Acuarios marinos, de agua dulce, plantados, acuaterrarios, estanques, etc..."
            },
            slide3: {
                title: "Expertos en Vida Acuática",
                text: "Calculamos y diseñamos la filtración que ofrezca el mejor rendimiento a tu acuario."
            },
            slide4: {
                title: "La Calidad Ante Todo",
                text: "Solo utilizamos los mejores materiales para ofrecer el mejor resultado."
            },
            slide5: {
                title: "Todo lo que Necesitas para tu Proyecto",
                text: "Realizamos todos los trabajos, sin intermediarios, en nuestro taller propio."
            },
            slide6: {
                title: "Tu Acuario, Nuestra Pasión",
                text: "No te dejamos solo, puedes contar con nosotros. Te asesoramos en todo siempre que lo necesites."
            }
        },
        about: {
            title: "Quiénes Somos",
            text1: "Coraline Acuarios surge de la pasión por la acuariofília, después de treinta años en este maravilloso hobby nuestro. Todo comienza con una gran afición por los peces ornamentales, que con el tiempo se transforma en oficio.",
            text2: "Trabajando en pequeños comercios y mayoristas del sector, aprendiendo todo lo posible sobre mantenimiento y filtraciones a un nivel profesional, nos muestra que la funcionabilidad de los acuarios comerciales está muy por debajo del rendimiento óptimo.",
            text3: "A día de hoy, en <strong>Coraline Acuarios</strong> diseñamos y hacemos realidad todo tipo de instalación para animales acuáticos desde un enfoque profesional, para que estas filtraciones den su mejor versión, mejorando la calidad de vida de mascotas y aficionados.",
            text4: "En <strong>Coraline Acuarios</strong> hacemos posible tu proyecto aunque lo veas complicado. Para nosotros no lo és.",
            text5: "Todos nuestros trabajos están realizados con el mejor material disponible en el mercado, dando constancia de esto con certificados de calidad que así lo confirman.",
            servicesTitle: "Estos son todos los trabajos que podemos realizar:",
            service1: "Construcción a medida de acuarios y urnas/terrarios",
            service2: "Montaje de estanques exteriores o interiores",
            service3: "Construcción con soldadura de soportes de acero inoxidable",
            service4: "Diseño y montaje de filtraciones específicas según especies",
            service5: "Acabados de todo tipo en carpintería",
            service6: "Construcción de canalización de aguas en PVC",
            service7: "Acondicionamientos en obra y construcción",
            service8: "Transporte y montaje de acuarios en casa del cliente",
            service9: "Desmonte o traslado de acuarios",
            service10: "Mantenimiento de acuarios y estanques",
            service11: "Baterías profesionales para negocios",
            service12: "Urnas para exhibición en ferias",
            service13: "Instalaciones técnicas para centros de investigación",
            viewGallery: "Ver Galería de Proyectos"
        },
        gallery: {
            title: "Nuestros Proyectos",
            subtitle: "Más de 100 acuarios personalizados construidos con pasión y dedicación",
            filterAll: "Todos",
            filterMarine: "Marinos",
            filterFresh: "Agua Dulce",
            filterPlanted: "Plantados",
            filterCommercial: "Comerciales",
            backButton: "Volver a Inicio",
            project1: "Acuario Marino 200L",
            project2: "Acuario Plantado 150L",
            project3: "Instalación Comercial",
            project4: "Aquascaping Premium",
            project5: "Batería Profesional",
            project6: "Acuario Personalizado"
        },
        catalog: {
            title: "Nuestros Acuarios",
            subtitle: "Selecciona el tipo de acuario que te interesa",
            freshwater: {
                title: "Agua Dulce",
                desc: "Perfectos para peces tropicales, plantas acuáticas y especies de agua dulce"
            },
            marine: {
                title: "Marinos",
                desc: "Para ecosistemas marinos, corales y peces de arrecife"
            },
            planted: {
                title: "Plantados (Aquascaping)",
                desc: "Diseñados específicamente para jardines acuáticos y plantas"
            },
            commercial: {
                title: "Comerciales",
                desc: "Para oficinas, restaurantes, hoteles y espacios públicos"
            },
            viewPrices: "Ver Modelos y Precios"
        },
        modal: {
            titleFreshwater: "Acuarios de Agua Dulce - Precios Estándar",
            titleMarine: "Acuarios Marinos - Precios Estándar",
            titlePlanted: "Acuarios Plantados - Precios Estándar",
            titleCommercial: "Acuarios Comerciales - Precios Estándar",
            dimensions: "Medidas",
            capacity: "Capacidad",
            price: "Precio",
            liters: "litros",
            note: "*Precios orientativos. Incluyen acuario de vidrio de alta calidad con juntas de silicona profesional.",
            customNote: "¿Necesitas otras medidas? Usa nuestro cotizador personalizado para obtener un presupuesto a medida.",
            customBtn: "Configurar Acuario Personalizado"
        },
        quote: {
            title: "Cotizador de Acuarios a Media",
            subtitle: "Calcula el precio de tu acuario personalizado en segundos",
            dimensions: "Dimensiones del Acuario",
            hint: "Introduce las medidas deseadas en centímetros",
            length: "Largo (cm)",
            width: "Ancho (cm)",
            height: "Alto (cm)",
            thickness: "Grosor del cristal",
            reinforcements: "Refuerzos Estructurales",
            perimeter: "Utilizar refuerzos perimetrales",
            brace: "Utilizar tirante como refuerzo (obligatorio perimetral antes)",
            calculate: "Calcular Precio",
            volume: "Volumen",
            optical: "Acabados en Cristal Óptico",
            opticalHint: "Selecciona las piezas que deseas en acabado óptico premium",
            front: "Frontal",
            back: "Trasera",
            leftSide: "Lateral Izquierdo",
            rightSide: "Lateral Derecho",
            finalPrice: "Precio Final (IVA incluido)",
            newQuote: "🔄 Nueva Cotización",
            requestQuote: "Solicitar Presupuesto Personalizado"
        },
        quoter: {
            title: "Cotizador de Acuarios a Medida",
            subtitle: "Configura tu acuario ideal y recibe un presupuesto orientativo"
        },
        form: {
            yourData: "Tus Datos",
            fullName: "Nombre completo *",
            email: "Email *",
            phone: "Teléfono",
            city: "Ciudad",
            configuration: "Configuración del Acuario",
            aquariumType: "Tipo de Acuario *",
            selectType: "Selecciona un tipo",
            typeFresh: "Agua Dulce",
            typeMarine: "Marino",
            typePlanted: "Plantado (Aquascaping)",
            typeCommercial: "Comercial",
            length: "Largo (cm) *",
            height: "Alto (cm) *",
            depth: "Fondo (cm) *",
            glassThickness: "Grosor del vidrio",
            recommendedGlass: "Grosor recomendado según dimensiones:",
            glassHelp: "El grosor se calcula automáticamente basado en la altura y longitud del acuario para garantizar la seguridad estructural.",
            glass6mm: "6mm (acuarios pequeños)",
            glass8mm: "8mm (estándar)",
            glass10mm: "10mm (acuarios medianos)",
            glass12mm: "12mm (acuarios grandes)",
            glass15mm: "15mm (acuarios muy grandes)",
            glassQuality: "Calidad del vidrio",
            glassNormal: "Vidrio Normal (float)",
            glassLowIron: "Vidrio Low Iron (extra transparente)",
            additionalOptions: "Opciones Adicionales",
            optionCabinet: "Mueble a medida",
            optionLid: "Tapa de cristal",
            optionSump: "Sump (filtro externo)",
            optionLighting: "Sistema de iluminación LED",
            optionBackground: "Fondo decorado 3D",
            optionDrilling: "Taladros para tubería",
            comments: "Comentarios o requisitos especiales",
            commentsPlaceholder: "Cuéntanos cualquier detalle adicional sobre tu proyecto...",
            estimatedPrice: "Precio Estimado",
            priceNote: "*Este es un precio orientativo. Recibirás un presupuesto detallado y personalizado por email.",
            calculateBtn: "Calcular Precio",
            submitBtn: "Solicitar Presupuesto Detallado",
            validationError: "Por favor, completa todos los campos obligatorios con valores válidos.",
            successMessage: "¡Gracias por tu solicitud! Se abrirá tu cliente de correo para enviar la consulta. Si no se abre automáticamente, por favor envíanos un email a info@coralineacuarios.com con tu configuración.",
            calculating: "Calculando precio...",
            totalPrice: "Precio Total",
            volume: "Volumen",
            fillAllFields: "Por favor completa todos los campos",
            invalidDimensions: "Las dimensiones deben ser mayores a 0",
            errorCalculation: "Error al calcular el precio. Inténtalo de nuevo."
        },
        contact: {
            title: "Contacto",
            email: "Email",
            phone: "Teléfono",
            location: "Ubicación"
        },
        footer: {
            rights: "Todos los derechos reservados"
        },
        currency: "€"
    },
    en: {
        nav: {
            home: "Home",
            about: "About Us",
            catalog: "Catalog",
            gallery: "Gallery",
            quote: "Get Quote",
            contact: "Contact"
        },
        hero: {
            slide1: {
                title: "Custom Aquarium Manufacturing",
                text: "We design and build the perfect aquarium that best suits you."
            },
            slide2: {
                title: "We Create Installations for All Types of Aquatic Animals",
                text: "Marine aquariums, freshwater, aquaterrariums, ponds, etc..."
            },
            slide3: {
                title: "We Are Experts in Everything Related to Aquatic Life",
                text: "We calculate and design the filtration that offers the best performance for your aquarium."
            },
            slide4: {
                title: "Quality of Our Work Above All",
                text: "We only use the best materials to deliver the best results."
            },
            slide5: {
                title: "Everything You Need for Your Project",
                text: "We do all the work, without intermediaries, in our own workshop."
            },
            slide6: {
                title: "It's Your Aquarium, and Also Our Passion",
                text: "We don't leave you alone, you can count on us. We advise you on everything whenever you need it."
            }
        },
        about: {
            title: "About Us",
            text1: "Coraline Aquariums arises from a passion for aquariums, after thirty years in this wonderful hobby of ours. It all begins with a great passion for ornamental fish, which over time transforms into a profession.",
            text2: "Working in small shops and wholesale businesses in the sector, learning everything possible about maintenance and filtration at a professional level, shows us that the functionality of commercial aquariums is far below optimal performance.",
            text3: "Today, at <strong>Coraline Aquariums</strong> we design and make all types of installations for aquatic animals from a professional approach, so that these filtration systems give their best performance, improving the quality of life of pets and enthusiasts.",
            text4: "At <strong>Coraline Aquariums</strong> we make your project possible even if you find it complicated. For us, it probably isn't.",
            text5: "All our work is done with the best materials available on the market, with quality certificates that confirm this.",
            servicesTitle: "These are all the services we can provide:",
            service1: "Custom construction of aquariums and display cases/terrariums",
            service2: "Installation of outdoor or indoor ponds",
            service3: "Welded construction of stainless steel supports",
            service4: "Design and installation of species-specific filtration systems",
            service5: "All types of carpentry finishes",
            service6: "Construction of PVC water channeling",
            service7: "Construction work and conditioning",
            service8: "Transport and installation of aquariums at client's home",
            service9: "Dismantling or relocation of aquariums",
            service10: "Maintenance of aquariums and ponds",
            service11: "Professional setups for businesses",
            service12: "Display cases for fairs",
            service13: "Technical installations for research centers",
            viewGallery: "View Project Gallery"
        },
        gallery: {
            title: "Our Projects",
            subtitle: "Over 100 personalized aquariums built with passion and dedication",
            filterAll: "All",
            filterMarine: "Marine",
            filterFresh: "Freshwater",
            filterPlanted: "Planted",
            filterCommercial: "Commercial",
            backButton: "Back to Home",
            project1: "200L Marine Aquarium",
            project2: "150L Planted Aquarium",
            project3: "Commercial Installation",
            project4: "Premium Aquascaping",
            project5: "Professional Setup",
            project6: "Custom Aquarium"
        },
        catalog: {
            title: "Our Aquariums",
            subtitle: "Select the type of aquarium you're interested in",
            freshwater: {
                title: "Freshwater",
                desc: "Perfect for tropical fish, aquatic plants and freshwater species"
            },
            marine: {
                title: "Marine",
                desc: "For marine ecosystems, corals and reef fish"
            },
            planted: {
                title: "Planted (Aquascaping)",
                desc: "Specifically designed for aquatic gardens and plants"
            },
            commercial: {
                title: "Commercial",
                desc: "For offices, restaurants, hotels and public spaces"
            },
            viewPrices: "View Models & Prices"
        },
        modal: {
            titleFreshwater: "Freshwater Aquariums - Standard Prices",
            titleMarine: "Marine Aquariums - Standard Prices",
            titlePlanted: "Planted Aquariums - Standard Prices",
            titleCommercial: "Commercial Aquariums - Standard Prices",
            dimensions: "Dimensions",
            capacity: "Capacity",
            price: "Price",
            liters: "liters",
            note: "*Indicative prices. Include high-quality glass aquarium with professional silicone joints.",
            customNote: "Need different dimensions? Use our custom quoter to get a tailored budget.",
            customBtn: "Configure Custom Aquarium"
        },
        quote: {
            title: "Custom Aquarium Quoter",
            subtitle: "Calculate the price of your personalized aquarium in seconds",
            dimensions: "Aquarium Dimensions",
            hint: "Enter the desired measurements in centimeters",
            length: "Length (cm)",
            width: "Width (cm)",
            height: "Height (cm)",
            thickness: "Glass thickness",
            reinforcements: "Structural Reinforcements",
            perimeter: "Use perimeter reinforcements",
            brace: "Use brace as reinforcement (perimeter required first)",
            calculate: "Calculate Price",
            volume: "Volume",
            optical: "Optical Glass Finishes",
            opticalHint: "Select the pieces you want in premium optical finish",
            front: "Front",
            back: "Back",
            leftSide: "Left Side",
            rightSide: "Right Side",
            finalPrice: "Final Price (VAT included)",
            newQuote: "🔄 New Quote",
            requestQuote: "Request Custom Quote"
        },
        quoter: {
            title: "Custom Aquarium Quoter",
            subtitle: "Configure your ideal aquarium and receive an estimated budget"
        },
        form: {
            yourData: "Your Information",
            fullName: "Full name *",
            email: "Email *",
            phone: "Phone",
            city: "City",
            configuration: "Aquarium Configuration",
            aquariumType: "Aquarium Type *",
            selectType: "Select a type",
            typeFresh: "Freshwater",
            typeMarine: "Marine",
            typePlanted: "Planted (Aquascaping)",
            typeCommercial: "Commercial",
            length: "Length (cm) *",
            height: "Height (cm) *",
            depth: "Depth (cm) *",
            glassThickness: "Glass thickness",
            recommendedGlass: "Recommended thickness based on dimensions:",
            glassHelp: "The thickness is automatically calculated based on the aquarium's height and length to ensure structural safety.",
            glass6mm: "6mm (small aquariums)",
            glass8mm: "8mm (standard)",
            glass10mm: "10mm (medium aquariums)",
            glass12mm: "12mm (large aquariums)",
            glass15mm: "15mm (very large aquariums)",
            glassQuality: "Glass quality",
            glassNormal: "Normal Glass (float)",
            glassLowIron: "Low Iron Glass (extra transparent)",
            additionalOptions: "Additional Options",
            optionCabinet: "Custom cabinet",
            optionLid: "Glass lid",
            optionSump: "Sump (external filter)",
            optionLighting: "LED lighting system",
            optionBackground: "3D decorated background",
            optionDrilling: "Pipe drilling",
            comments: "Comments or special requirements",
            commentsPlaceholder: "Tell us any additional details about your project...",
            estimatedPrice: "Estimated Price",
            priceNote: "*This is an indicative price. You will receive a detailed and personalized quote by email.",
            calculateBtn: "Calculate Price",
            submitBtn: "Request Detailed Quote",
            validationError: "Please complete all required fields with valid values.",
            successMessage: "Thank you for your request! Your email client will open to send the inquiry. If it doesn't open automatically, please email us at info@coralineacuarios.com with your configuration.",
            calculating: "Calculating price...",
            totalPrice: "Total Price",
            volume: "Volume",
            fillAllFields: "Please fill all fields",
            invalidDimensions: "Dimensions must be greater than 0",
            errorCalculation: "Error calculating price. Please try again."
        },
        contact: {
            title: "Contact",
            email: "Email",
            phone: "Phone",
            location: "Location"
        },
        footer: {
            rights: "All rights reserved"
        },
        currency: "€"
    }
};

// Estado actual del idioma
let currentLanguage = 'es';

// Función para cambiar el idioma
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);
    
    // Actualizar botones de idioma
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });
    
    // Traducir todos los elementos
    translatePage();
}

// Función para traducir la página
function translatePage() {
    const lang = translations[currentLanguage];
    
    // Traducir elementos con data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const keys = key.split('.');
        let translation = lang;
        
        for (const k of keys) {
            translation = translation[k];
            if (!translation) break;
        }
        
        if (translation) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                // Para placeholders
                if (element.hasAttribute('data-i18n-placeholder')) {
                    element.placeholder = translation;
                }
            } else {
                element.innerHTML = translation;
            }
        }
    });
    
    // Traducir placeholders específicos
    const notasTextarea = document.getElementById('notas');
    if (notasTextarea) {
        notasTextarea.placeholder = lang.form.commentsPlaceholder;
    }
    
    // Actualizar título de la página
    document.title = currentLanguage === 'es' 
        ? 'Coraline Acuarios - Acuarios a Medida' 
        : 'Coraline Aquariums - Custom Aquariums';
    
    // Si hay un modal abierto, actualizarlo
    const pricesModal = document.getElementById('pricesModal');
    if (pricesModal && pricesModal.style.display === 'block') {
        const tipo = pricesModal.dataset.currentType;
        if (tipo) {
            updateModalContent(tipo);
        }
    }
}

// Función para actualizar el contenido del modal según el idioma
function updateModalContent(tipo) {
    const lang = translations[currentLanguage];
    const modalTitle = document.getElementById('modalTitle');
    
    // Solo actualizar si el modal existe
    if (!modalTitle) return;
    
    const titulos = {
        'dulce': 'titleFreshwater',
        'marino': 'titleMarine',
        'plantado': 'titlePlanted',
        'comercial': 'titleCommercial'
    };
    
    modalTitle.textContent = lang.modal[titulos[tipo]];
    
    // Regenerar tabla con traducciones
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
    
    const pricesContent = document.getElementById('pricesContent');
    if (pricesContent) {
        pricesContent.innerHTML = html;
    }
    
    // Actualizar nota del footer
    const modalFooterNote = document.querySelector('.modal-footer .note');
    if (modalFooterNote) {
        modalFooterNote.textContent = lang.modal.note;
    }
}

// Inicializar idioma al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Cargar idioma guardado o detectar del navegador
    const savedLanguage = localStorage.getItem('preferredLanguage');
    const browserLanguage = navigator.language.split('-')[0];
    
    if (savedLanguage) {
        currentLanguage = savedLanguage;
    } else if (browserLanguage === 'en') {
        currentLanguage = 'en';
    }
    
    // Configurar botones de idioma
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            changeLanguage(this.dataset.lang);
        });
    });
    
    // Aplicar idioma inicial
    changeLanguage(currentLanguage);
});
