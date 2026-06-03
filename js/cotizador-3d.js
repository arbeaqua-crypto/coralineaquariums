// ============================================
// COTIZADOR 3D - VISUALIZADOR THREE.JS
// Coraline Acuarios - Versión BETA
// ============================================

// THREE.js ya está cargado globalmente desde el CDN en cotizador-con-3d.html
// Usar las variables globales expuestas por el HTML: window.threeScene, window.threeCamera, window.threeRenderer
console.log('📦 Cargando cotizador-3d.js...');

// Variables globales para soportes (reutilizar scene/camera/renderer del HTML)
let soporteGroup = null;
let ledGroup = null; // Grupo de tiras LED internas

// Dimensiones actuales del acuario (valores por defecto del formulario)
let currentDimensions = {
    largo: 100,
    ancho: 50,
    alto: 50,
    grosor: 10
};

/**
 * Inicializar la escena 3D
 */
function init3D() {
    const canvas = document.getElementById('canvas3d');
    if (!canvas) {
        console.error('❌ Canvas 3D no encontrado');
        return;
    }

    console.log('🎬 Creando escena Three.js...');

    // Crear escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1628);
    scene.fog = new THREE.Fog(0x0a1628, 50, 200);
    console.log('✅ Escena creada');

    // Crear cámara
    const containerWidth = canvas.parentElement.clientWidth;
    const containerHeight = canvas.parentElement.clientHeight || 600;
    camera = new THREE.PerspectiveCamera(
        50,
        containerWidth / containerHeight,
        0.1,
        1000
    );
    camera.position.set(15, 10, 20);
    console.log(`✅ Cámara creada (${containerWidth}×${containerHeight})`);

    // Crear renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true
    });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    console.log('✅ Renderer creado');

    // Controles de cámara OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2 + 0.3;
    controls.target.set(0, 2.5, 0); // Target ajustado al centro del acuario
    controls.update();
    console.log('✅ OrbitControls configurados');
    
    // Exponer camera y controls globalmente para controles UI
    window.threeCamera = camera;
    window.threeControls = controls;
    window.threeRenderer = renderer;
    window.threeScene = scene;

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4A90E2, 0.5);
    pointLight.position.set(-10, 10, -10);
    scene.add(pointLight);
    console.log('✅ Iluminación añadida');

    // Grid de suelo
    const gridHelper = new THREE.GridHelper(40, 40, 0x2a5880, 0x1a3850);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);
    console.log('✅ Grid de suelo añadido');

    // Crear acuario inicial
    console.log('🐠 Creando acuario inicial...');
    crearAcuario(currentDimensions.largo, currentDimensions.ancho, currentDimensions.alto);

    // Iniciar animación
    console.log('🎬 Iniciando loop de animación...');
    animate();

    // Manejar redimensionamiento
    window.addEventListener('resize', onWindowResize);

    console.log('✅ Visualizador 3D inicializado correctamente');
}

/**
 * Crear o actualizar el acuario 3D
 */
function crearAcuario(largo, ancho, alto) {
    console.log(`🎨 Creando acuario: ${largo}×${ancho}×${alto} cm`);
    
    // Convertir cm a unidades Three.js (dividir por 10 para escala)
    const l = largo / 10;
    const a = ancho / 10;
    const h = alto / 10;

    // Limpiar acuario anterior si existe
    if (acuarioGroup) {
        scene.remove(acuarioGroup);
        acuarioGroup.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }

    // Crear grupo para el acuario
    acuarioGroup = new THREE.Group();

    // Material del vidrio
    const materialVidrio = new THREE.MeshPhysicalMaterial({
        color: 0x4A90E2,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.95,
        thickness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.15
    });

    // Crear las 6 caras del acuario
    
    // Frontal
    const frontalGeo = new THREE.PlaneGeometry(l, h);
    const frontalMesh = new THREE.Mesh(frontalGeo, materialVidrio);
    frontalMesh.position.z = a / 2;
    frontalMesh.castShadow = true;
    frontalMesh.receiveShadow = true;
    acuarioGroup.add(frontalMesh);

    // Trasera
    const traseraMesh = frontalMesh.clone();
    traseraMesh.position.z = -a / 2;
    traseraMesh.rotation.y = Math.PI;
    acuarioGroup.add(traseraMesh);

    // Lateral izquierda
    const lateralGeo = new THREE.PlaneGeometry(a, h);
    const lateralIzqMesh = new THREE.Mesh(lateralGeo, materialVidrio);
    lateralIzqMesh.position.x = -l / 2;
    lateralIzqMesh.rotation.y = Math.PI / 2;
    lateralIzqMesh.castShadow = true;
    lateralIzqMesh.receiveShadow = true;
    acuarioGroup.add(lateralIzqMesh);

    // Lateral derecha
    const lateralDerMesh = lateralIzqMesh.clone();
    lateralDerMesh.position.x = l / 2;
    lateralDerMesh.rotation.y = -Math.PI / 2;
    acuarioGroup.add(lateralDerMesh);

    // Base
    const baseGeo = new THREE.PlaneGeometry(l, a);
    const baseMesh = new THREE.Mesh(baseGeo, materialVidrio);
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.receiveShadow = true;
    acuarioGroup.add(baseMesh);

    // Tapa (opcional, más transparente)
    const tapaMaterial = materialVidrio.clone();
    tapaMaterial.opacity = 0.05;
    const tapaMesh = new THREE.Mesh(baseGeo, tapaMaterial);
    tapaMesh.position.y = h;
    tapaMesh.rotation.x = -Math.PI / 2;
    acuarioGroup.add(tapaMesh);

    // Bordes brillantes
    const edgesMaterial = new THREE.LineBasicMaterial({ 
        color: 0x4A90E2, 
        linewidth: 2 
    });

    [frontalMesh, traseraMesh, lateralIzqMesh, lateralDerMesh, baseMesh].forEach(mesh => {
        const edges = new THREE.EdgesGeometry(mesh.geometry);
        const line = new THREE.LineSegments(edges, edgesMaterial);
        line.position.copy(mesh.position);
        line.rotation.copy(mesh.rotation);
        acuarioGroup.add(line);
    });

    // Posicionar el acuario (centrado en Y=0, elevado para que la base esté en y=0)
    acuarioGroup.position.y = h / 2;

    scene.add(acuarioGroup);
    console.log(`✅ Acuario añadido a la escena (${acuarioGroup.children.length} objetos)`);

    // Actualizar cámara para centrar en el acuario
    ajustarCamara(l, a, h);

    // Guardar dimensiones actuales
    currentDimensions = { largo, ancho, alto, grosor: currentDimensions.grosor };

    // Actualizar info 3D
    actualizarInfo3D();
}

/**
 * Crear o actualizar el agua dentro del acuario
 */
function crearAgua(largo, ancho, alto) {
    const l = largo / 10;
    const a = ancho / 10;
    const h = alto / 10;

    // Limpiar agua anterior
    if (aguaMesh) {
        acuarioGroup.remove(aguaMesh);
        aguaMesh.geometry.dispose();
        aguaMesh.material.dispose();
    }

    // Material del agua
    const materialAgua = new THREE.MeshPhysicalMaterial({
        color: 0x0077be,
        metalness: 0.1,
        roughness: 0.2,
        transmission: 0.9,
        thickness: 0.5,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });

    // Crear el agua (85% de la altura)
    const alturaAgua = h * 0.85;
    const aguaGeo = new THREE.BoxGeometry(l - 0.1, alturaAgua, a - 0.1);
    aguaMesh = new THREE.Mesh(aguaGeo, materialAgua);
    aguaMesh.position.y = (alturaAgua / 2) - (h / 2);
    aguaMesh.castShadow = true;
    aguaMesh.receiveShadow = true;

    acuarioGroup.add(aguaMesh);
}

/**
 * Crear o actualizar refuerzos perimetrales
 */
function crearRefuerzos(largo, ancho, alto) {
    const l = largo / 10;
    const a = ancho / 10;
    const h = alto / 10;

    // Limpiar refuerzos anteriores
    if (refuerzosGroup) {
        acuarioGroup.remove(refuerzosGroup);
        refuerzosGroup.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    refuerzosGroup = new THREE.Group();

    // Material de los refuerzos
    const materialRefuerzo = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.5,
        roughness: 0.5
    });

    // Grosor de refuerzos
    const grosor = 0.05;
    const altura = 0.15;

    // Refuerzo frontal superior
    const refuerzoFrontalGeo = new THREE.BoxGeometry(l, altura, grosor);
    const refuerzoFrontal = new THREE.Mesh(refuerzoFrontalGeo, materialRefuerzo);
    refuerzoFrontal.position.set(0, h / 2 - altura / 2, a / 2);
    refuerzoFrontal.castShadow = true;
    refuerzosGroup.add(refuerzoFrontal);

    // Refuerzo trasero superior
    const refuerzoTrasero = refuerzoFrontal.clone();
    refuerzoTrasero.position.z = -a / 2;
    refuerzosGroup.add(refuerzoTrasero);

    // Refuerzos laterales superiores
    const refuerzoLateralGeo = new THREE.BoxGeometry(grosor, altura, a);
    const refuerzoLateralIzq = new THREE.Mesh(refuerzoLateralGeo, materialRefuerzo);
    refuerzoLateralIzq.position.set(-l / 2, h / 2 - altura / 2, 0);
    refuerzoLateralIzq.castShadow = true;
    refuerzosGroup.add(refuerzoLateralIzq);

    const refuerzoLateralDer = refuerzoLateralIzq.clone();
    refuerzoLateralDer.position.x = l / 2;
    refuerzosGroup.add(refuerzoLateralDer);

    acuarioGroup.add(refuerzosGroup);
}

/**
 * Eliminar refuerzos perimetrales
 */
function eliminarRefuerzos() {
    if (refuerzosGroup) {
        acuarioGroup.remove(refuerzosGroup);
        refuerzosGroup.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        refuerzosGroup = null;
    }
}

/**
 * Crear o actualizar tirantes
 */
function crearTirantes(largo, ancho, alto) {
    const l = largo / 10;
    const a = ancho / 10;
    const h = alto / 10;

    // Limpiar tirantes anteriores
    if (tirantesGroup) {
        acuarioGroup.remove(tirantesGroup);
        tirantesGroup.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    tirantesGroup = new THREE.Group();

    // Material de los tirantes
    const materialTirante = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.6,
        roughness: 0.4
    });

    // Crear tirantes (cilindros verticales)
    const radio = 0.03;
    const tiranteGeo = new THREE.CylinderGeometry(radio, radio, h * 0.9, 8);
    
    // Tirante izquierdo
    const tiranteIzq = new THREE.Mesh(tiranteGeo, materialTirante);
    tiranteIzq.position.set(-l / 3, 0, 0);
    tiranteIzq.castShadow = true;
    tirantesGroup.add(tiranteIzq);

    // Tirante derecho
    const tiranteDer = tiranteIzq.clone();
    tiranteDer.position.x = l / 3;
    tirantesGroup.add(tiranteDer);

    acuarioGroup.add(tirantesGroup);
}

/**
 * Eliminar tirantes
 */
function eliminarTirantes() {
    if (tirantesGroup) {
        acuarioGroup.remove(tirantesGroup);
        tirantesGroup.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        tirantesGroup = null;
    }
}

/**
 * Ajustar cámara para centrar el acuario
 */
function ajustarCamara(l, a, h) {
    const maxDim = Math.max(l, a, h);
    const distance = maxDim * 2.5;
    
    // Posición ajustada para vista centrada (menos X para centrar horizontalmente)
    camera.position.set(distance * 0.32, distance * 0.32, distance * 0.72);
    if (window.threeControls) {
        window.threeControls.target.set(0, h / 2, 0);
        window.threeControls.update();
    }
}

/**
 * Actualizar información 3D en la UI
 */
function actualizarInfo3D() {
    const { largo, ancho, alto } = currentDimensions;
    
    // Dimensiones
    const dimensionesEl = document.getElementById('info-dimensiones');
    if (dimensionesEl) {
        dimensionesEl.textContent = `${largo} × ${ancho} × ${alto} cm`;
    }
    
    // Volumen en litros
    const volumen = (largo * ancho * alto) / 1000;
    const volumenEl = document.getElementById('info-volumen');
    if (volumenEl) {
        volumenEl.textContent = `${Math.round(volumen)} L`;
    }
    
    // Ratio (largo:ancho)
    const ratio = (largo / ancho).toFixed(1);
    const ratioEl = document.getElementById('info-ratio');
    if (ratioEl) {
        ratioEl.textContent = `${ratio}:1`;
    }
}

/**
 * Loop de animación
 */
function animate() {
    animationId = requestAnimationFrame(animate);
    if (window.threeControls && window.threeControls.update) {
        window.threeControls.update();
    }
    renderer.render(scene, camera);
}

/**
 * Manejar redimensionamiento de ventana
 */
function onWindowResize() {
    const canvas = document.getElementById('canvas3d');
    if (!canvas || !canvas.parentElement) return;

    const containerWidth = canvas.parentElement.clientWidth;
    const containerHeight = canvas.parentElement.clientHeight || 600;

    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(containerWidth, containerHeight);
}

/**
 * Actualizar visualización 3D desde el formulario
 */
function actualizarDesdeFormulario() {
    const largo = parseFloat(document.getElementById('largo')?.value) || 120;
    const ancho = parseFloat(document.getElementById('ancho')?.value) || 50;
    const alto = parseFloat(document.getElementById('alto')?.value) || 60;
    const perimetrales = document.getElementById('perimetrales')?.checked || false;
    const tirantes = document.getElementById('tirantes')?.checked || false;

    // Validar rangos
    if (largo < 30 || largo > 500 || ancho < 30 || ancho > 150 || alto < 30 || alto > 200) {
        console.warn('Dimensiones fuera de rango');
        return;
    }

    // Actualizar acuario
    crearAcuario(largo, ancho, alto);
    
    // Crear agua por defecto
    crearAgua(largo, ancho, alto);
    
    // Actualizar refuerzos
    if (perimetrales) {
        crearRefuerzos(largo, ancho, alto);
    } else {
        eliminarRefuerzos();
    }
    
    // Actualizar tirantes
    if (tirantes && perimetrales) {
        crearTirantes(largo, ancho, alto);
    } else {
        eliminarTirantes();
    }
    
    // Actualizar soporte si está activado
    if (typeof actualizarSoporteEn3D === 'function') {
        actualizarSoporteEn3D();
    }
}

/**
 * Función de inicialización principal
 */
function inicializarTodo() {
    console.log('🚀 Iniciando cotizador 3D...');
    
    // Verificar que el canvas existe
    const canvas = document.getElementById('canvas3d');
    if (!canvas) {
        console.error('❌ Canvas 3D no encontrado. Esperando...');
        setTimeout(inicializarTodo, 100);
        return;
    }
    
    console.log('✅ Canvas encontrado, inicializando Three.js...');
    
    try {
        // Inicializar 3D
        init3D();
        console.log('✅ Scene 3D inicializada');
        
        // Conectar eventos del formulario
        const inputLargo = document.getElementById('largo');
        const inputAncho = document.getElementById('ancho');
        const inputAlto = document.getElementById('alto');
        const checkPerimetrales = document.getElementById('perimetrales');
        const checkTirantes = document.getElementById('tirantes');
        
        // Debounce para evitar demasiadas actualizaciones
        let timeoutId;
        const debouncedUpdate = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(actualizarDesdeFormulario, 300);
        };
        
        if (inputLargo) inputLargo.addEventListener('input', debouncedUpdate);
        if (inputAncho) inputAncho.addEventListener('input', debouncedUpdate);
        if (inputAlto) inputAlto.addEventListener('input', debouncedUpdate);
        if (checkPerimetrales) checkPerimetrales.addEventListener('change', actualizarDesdeFormulario);
        if (checkTirantes) checkTirantes.addEventListener('change', actualizarDesdeFormulario);
        
        console.log('✅ Event listeners conectados');
        
        // Crear acuario inicial inmediatamente
        console.log('🎨 Creando acuario inicial...');
        actualizarDesdeFormulario();
        
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
    }
}

/**
 * Detectar cuando el DOM esté listo y ejecutar
 */
// COMENTADO: Ya no necesitamos auto-inicializar porque el HTML ya tiene su propia init3D()
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', inicializarTodo);
// } else {
//     // DOM ya está listo, ejecutar inmediatamente
//     inicializarTodo();
// }

// COMENTADO: No usar ES6 export en scripts no-module
// export { 
//     crearAcuario, 
//     crearAgua, 
//     crearRefuerzos, 
//     crearTirantes,
//     eliminarRefuerzos,
//     eliminarTirantes,
//     actualizarDesdeFormulario 
// };

console.log('✅ cotizador-3d.js cargado - funciones de soporte disponibles');

// ============================================
// FUNCIONES PARA SOPORTES / MESAS
// ============================================

// soporteGroup ya está declarado en la línea 11

/**
 * Toggle de la sección de soporte
 */
function toggleSeccionSoporte() {
    const checkbox = document.getElementById('necesitaSoporte');
    const opciones = document.getElementById('opcionesSoporte');
    
    if (checkbox.checked) {
        opciones.style.display = 'block';
        actualizarSoporteEn3D();
    } else {
        opciones.style.display = 'none';
        eliminarSoporte();
    }
}

/**
 * Actualizar opciones de acabado
 */
function actualizarOpcionesAcabado() {
    // Mostrar/ocultar selector de color según acabado seleccionado
    const radios = document.getElementsByName('acabadoEstructura');
    const selectorColor = document.getElementById('selectorColorEstructura');
    
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'color' && selectorColor) {
                selectorColor.style.display = 'block';
            } else if (selectorColor) {
                selectorColor.style.display = 'none';
            }
        });
    });
    
    // Verificar estado inicial
    const radioSeleccionado = Array.from(radios).find(r => r.checked);
    if (radioSeleccionado && radioSeleccionado.value === 'color' && selectorColor) {
        selectorColor.style.display = 'block';
    }
}

/**
 * Actualizar el soporte/mesa en la visualización 3D
 */
window.actualizarSoporteEn3D = function() {
    console.log('🔧 actualizarSoporteEn3D() llamada');
    
    // Revisar si la estructura de acero está seleccionada
    const checkEstructuraAcero = document.getElementById('checkEstructuraAcero');
    console.log('📦 Checkbox estructura encontrado:', checkEstructuraAcero !== null);
    
    if (!checkEstructuraAcero) {
        console.log('❌ No se encontró el checkbox checkEstructuraAcero');
        return;
    }
    
    console.log('☑️ Checkbox checked:', checkEstructuraAcero.checked);
    
    if (!checkEstructuraAcero.checked) {
        console.log('⚠️ Checkbox no está marcado - eliminando soporte');
        eliminarSoporte();
        return;
    }
    
    if (!window.threeScene) {
        console.log('❌ window.threeScene no está disponible');
        return;
    }
    
    const largo = parseFloat(document.getElementById('largo').value) || 120;
    const ancho = parseFloat(document.getElementById('ancho').value) || 50;
    const alto = parseFloat(document.getElementById('alto').value) || 60;
    
    console.log(`📐 Creando estructura metálica para acuario ${largo}×${ancho}×${alto}`);
    
    // Crear estructura metálica
    crearEstructuraMetalica(largo, ancho, alto);
    
    // Actualizar desglose si está visible
    if (typeof actualizarDesglose === 'function' && window.ultimoCalculo) {
        actualizarDesglose(window.ultimoCalculo);
    }
}

/**
 * Eliminar soporte de la escena
 */
function eliminarSoporte() {
    if (soporteGroup && window.threeScene) {
        window.threeScene.remove(soporteGroup);
        soporteGroup.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        soporteGroup = null;
        console.log('✅ Soporte eliminado');
    }
    // También eliminar forrado si existe
    if (typeof eliminarForradoMelamina3D === 'function') {
        eliminarForradoMelamina3D();
    }
    // Eliminar LEDs si existen
    eliminarIluminacionLed3D();
    // Ocultar control de puertas
    const controlPuertas = document.getElementById('controlPuertas3D');
    if (controlPuertas) controlPuertas.style.display = 'none';
}

/**
 * Controles de cámara
 */
const initialCameraPos = { x: 15, y: 10, z: 20 };
const initialTarget = { x: 0, y: 0, z: 0 };

window.moverCamara = function(direccion) {
    const cam = window.threeCamera;
    const ctrl = window.threeControls;
    
    if (!cam || !ctrl) {
        console.error('Cámara o controles no inicializados');
        return;
    }
    
    const moveAmount = 5;
    
    console.log(`🕹️ Moviendo cámara: ${direccion}`);
    console.log('Target antes:', ctrl.target.x, ctrl.target.y, ctrl.target.z);
    
    switch(direccion) {
        case 'arriba':
            ctrl.target.y += moveAmount;
            break;
        case 'abajo':
            ctrl.target.y -= moveAmount;
            break;
        case 'izquierda':
            ctrl.target.x -= moveAmount;
            break;
        case 'derecha':
            ctrl.target.x += moveAmount;
            break;
        case 'reset':
            cam.position.set(initialCameraPos.x, initialCameraPos.y, initialCameraPos.z);
            ctrl.target.set(initialTarget.x, initialTarget.y, initialTarget.z);
            break;
    }
    
    ctrl.update();
    console.log('Target después:', ctrl.target.x, ctrl.target.y, ctrl.target.z);
}

/**
 * Crear estructura metálica según imágenes de referencia
 */
function crearEstructuraMetalica(largoAcuario, anchoAcuario, altoAcuario) {
    console.log('🏗️ crearEstructuraMetalica() llamada con:', largoAcuario, anchoAcuario, altoAcuario);
    
    // Eliminar estructura anterior
    eliminarSoporte();
    
    soporteGroup = new THREE.Group();
    console.log('📦 Grupo de soporte creado');
    
    // Detectar qué acabado está seleccionado (nuevo sistema de checkboxes)
    let acabado = 'brillo'; // por defecto
    let subTipo = null;
    
    if (document.getElementById('acabadoPulidoMatizado')?.checked) {
        acabado = 'brillo';
        subTipo = 'pulido'; // Acabado único pulido/matizado
        console.log('✨ Acabado: Pulido / Matizado (cromado brillante)');
    } else if (document.getElementById('acabadoColor')?.checked) {
        acabado = 'color';
        // Leer selector blanco/negro
        const selector = document.getElementById('colorAcero');
        subTipo = selector ? selector.value : 'blanco';
        console.log(`🎨 Acabado: Color ${subTipo}`);
        console.log(`   🔍 Selector value: "${subTipo}"`);
    } else if (document.getElementById('acabadoSinPulir')?.checked) {
        acabado = 'sinPulir';
        console.log('⚪ Acabado: Sin pulir');
    } else {
        console.log('⚠️ Ningún acabado seleccionado - usando pulido espejo por defecto');
        subTipo = 'pulido';
    }
    
    // Material según acabado
    let materialTubular;
    switch(acabado) {
        case 'brillo':
            // Acabado pulido/matizado - base blanca brillante con emissive para evitar gris
            materialTubular = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.80,
                roughness: 0.08,
                emissive: 0xffffff,
                emissiveIntensity: 0.3
            });
            console.log('   🔷 Material: Pulido brillante (blanco puro, metalness 0.80, emissive)');
            break;
        case 'color':
            if (subTipo === 'negro') {
                // Color negro → negro mate
                materialTubular = new THREE.MeshStandardMaterial({
                    color: 0x1a1a1a,  // Negro oscuro
                    metalness: 0.2,   // Poco metálico
                    roughness: 0.7    // Mate
                });
            } else {
                // Color blanco → blanco mate
                materialTubular = new THREE.MeshStandardMaterial({
                    color: 0xf5f5f5,  // Blanco suave
                    metalness: 0.2,   // Poco metálico
                    roughness: 0.7    // Mate
                });
            }
            break;
        case 'sinPulir':
            // Sin pulir → gris oscuro mate
            materialTubular = new THREE.MeshStandardMaterial({
                color: 0x666666,  // Gris oscuro
                metalness: 0.4,   // Algo metálico
                roughness: 0.8    // Muy mate
            });
            break;
    }
    
    console.log('🎨 Material creado');
    
    // Convertir a unidades Three.js
    const l = largoAcuario / 10;
    const a = anchoAcuario / 10;
    
    // Dimensiones de la estructura (acuario - 4cm)
    const zonaEstancaEstrActiva = document.getElementById('zonaEstanca')?.checked || false;
    const recorteZE = zonaEstancaEstrActiva ? 2.0 : 0; // 20cm = 2.0 unidades
    const largoEstructura = l - 0.4 - recorteZE;  // -0.4 = -4cm base, -2.0 si zona estanca
    const anchoEstructura = a - 0.4;
    // Desplazar estructura a la izquierda para que el hueco quede a la derecha
    const offsetXEstructura = zonaEstancaEstrActiva ? -recorteZE / 2 : 0;
    
    // Tubular cuadrado 35mm × 35mm = 0.35 unidades
    const grosorTubular = 0.35;
    
    // Altura TOTAL del soporte incluyendo pies: 85cm = 8.5 unidades
    const alturaTotal = 8.5;
    
    // Altura de pies niveladores: 5cm = 0.5 unidades
    const alturaPies = 0.5;
    
    // Altura de marcos
    const alturaMarcoSuperior = grosorTubular;  // 0.35
    const alturaMarcoInferior = grosorTubular;  // 0.35
    
    // Altura de patas = Total - Pies - MarcoInf - MarcoSup
    const alturaPatas = alturaTotal - alturaPies - alturaMarcoInferior - alturaMarcoSuperior;
    
    console.log(`📐 Estructura: largo=${largoEstructura.toFixed(2)}, ancho=${anchoEstructura.toFixed(2)}${zonaEstancaEstrActiva ? ' [zona estanca: -20cm, offset X=' + offsetXEstructura.toFixed(2) + ']' : ''}`);
    console.log(`📐 Alturas: Total=${alturaTotal}, Pies=${alturaPies}, MarcoInf=${alturaMarcoInferior}, Patas=${alturaPatas.toFixed(2)}, MarcoSup=${alturaMarcoSuperior}`);
    
    // === SISTEMA DE COORDENADAS LOCALES (dentro de soporteGroup) ===
    // Y=0 = suelo
    // Pies: Y = 0 a 0.5 (centro en Y=0.25)
    // Marco inferior: Y = 0.5 a 0.85 (centro en Y=0.675)
    // Patas: Y = 0.85 a (0.85+alturaPatas)
    // Marco superior: Y = (alturaTotal - alturaMarcoSuperior/2) = centro del marco superior
    
    const posYPies = alturaPies / 2;  // Centro de pies
    const posYMarcoInferior = alturaPies + alturaMarcoInferior / 2;  // Centro marco inferior
    const posYPatas = alturaPies + alturaMarcoInferior + alturaPatas / 2;  // Centro de patas
    const posYMarcoSuperior = alturaTotal - alturaMarcoSuperior / 2;  // Centro marco superior
    
    console.log(`📐 Posiciones Y locales: Pies=${posYPies}, MarcoInf=${posYMarcoInferior.toFixed(2)}, Patas=${posYPatas.toFixed(2)}, MarcoSup=${posYMarcoSuperior.toFixed(2)}`);
    
    // **MARCO SUPERIOR** (donde apoya el acuario)
    crearMarcoRectangular(
        largoEstructura, 
        anchoEstructura, 
        grosorTubular,
        materialTubular,
        posYMarcoSuperior,
        'superior',
        largoAcuario
    );
    
    // **MARCO INFERIOR** (donde apoya el sump)
    crearMarcoRectangular(
        largoEstructura,
        anchoEstructura,
        grosorTubular,
        materialTubular,
        posYMarcoInferior,
        'inferior',
        largoAcuario
    );
    
    // **PATAS VERTICALES**
    crearPatasVerticales(
        largoEstructura,
        anchoEstructura,
        alturaPatas,
        grosorTubular,
        materialTubular,
        posYPatas,  // Centro de las patas
        largoAcuario
    );
    
    // **PIES NIVELADORES** (solo si está activada la opción)
    const piesNiveladoresActivos = document.getElementById('piesNiveladores')?.checked || false;
    console.log('🦶 Pies niveladores activados:', piesNiveladoresActivos);
    
    if (piesNiveladoresActivos) {
        crearPiesNiveladores(
            largoEstructura,
            anchoEstructura,
            alturaPies,
            grosorTubular,
            materialTubular,
            posYPies,  // Centro de los pies
            largoAcuario
        );
        console.log('✅ Pies niveladores creados en 3D');
    } else {
        console.log('⏭️ Pies niveladores omitidos (opción desactivada)');
    }
    
    // Posicionar grupo completo para que marco superior toque la BASE del acuario
    // VERIFICAR POSICIÓN REAL DEL ACUARIO
    const acuarioEnScene = window.threeScene.children.find(obj => obj.isGroup && obj.children.some(child => child.userData?.tipo === 'cristal'));
    let posicionRealAcuario = 0;
    let posicionRealBase = 0;
    if (acuarioEnScene) {
        posicionRealAcuario = acuarioEnScene.position.y;
        const baseAcuario = acuarioEnScene.children.find(child => child.userData?.pieza === 'base');
        if (baseAcuario) {
            posicionRealBase = posicionRealAcuario + baseAcuario.position.y - (baseAcuario.geometry.parameters.height / 2);
        }
    }
    
    // Marco superior tiene su CENTRO en Y = posYMarcoSuperior
    // La CARA SUPERIOR del marco está en Y = posYMarcoSuperior + alturaMarcoSuperior/2
    const caraSupMarco = posYMarcoSuperior + alturaMarcoSuperior / 2;
    
    // Posicionar soporte para que toque la cara INFERIOR real de la base del acuario
    // Si zona estanca activa: bajar 9.5mm para dejar espacio a la tapa superior
    const descensoZonaEstanca = zonaEstancaEstrActiva ? 0.095 : 0;
    soporteGroup.position.y = posicionRealBase - caraSupMarco - descensoZonaEstanca;
    soporteGroup.userData.descensoZonaEstanca = descensoZonaEstanca;
    // Desplazar estructura a la izquierda si zona estanca activa
    soporteGroup.position.x = offsetXEstructura;
    
    console.log(`✅ Soporte posicionado en Y=${soporteGroup.position.y.toFixed(2)}`);
    console.log(`   🔍 Acuario group real Y: ${posicionRealAcuario.toFixed(2)}`);
    console.log(`   🔍 Base acuario cara inferior real: Y=${posicionRealBase.toFixed(2)}`);
    console.log(`   📏 Cara superior marco global: Y=${(soporteGroup.position.y + caraSupMarco).toFixed(2)} (debe coincidir con base)`);
    
    window.threeScene.add(soporteGroup);
    console.log(`✅ Estructura metálica creada (${acabado}) y añadida a scene`);
    
    // Actualizar forrado melamina si está activo
    if (typeof window.actualizarForradoMelamina3D === 'function') {
        window.actualizarForradoMelamina3D();
    }
    
    // Actualizar iluminación LED si está activa
    crearIluminacionLed3D(largoAcuario, anchoAcuario);
}

/**
 * Crear marco rectangular (superior o inferior)
 */
function crearMarcoRectangular(largo, ancho, grosor, material, posY, tipo, largoAcuario) {
    // Desplazamiento de 2cm (0.2 unidades) hacia el centro para dejar espacio a madera y puertas
    const insetMadera = 0.2;
    
    // Tubos largos (frontal/trasero) mantienen longitud completa para llegar entre laterales desplazados
    // Tubos anchos (laterales) se acortan 2*inset para llegar entre frontales desplazados
    const tuboLargo = new THREE.BoxGeometry(largo, grosor, grosor);
    const tuboAncho = new THREE.BoxGeometry(grosor, grosor, ancho - (insetMadera * 2));
    
    // Marco perimetral (4 lados) - todos desplazados 2cm hacia el centro
    // Frontal
    const frontal = new THREE.Mesh(tuboLargo, material);
    frontal.position.set(0, posY, ancho/2 - insetMadera);
    frontal.castShadow = true;
    soporteGroup.add(frontal);
    
    // Trasera
    const trasera = new THREE.Mesh(tuboLargo, material);
    trasera.position.set(0, posY, -ancho/2 + insetMadera);
    trasera.castShadow = true;
    soporteGroup.add(trasera);
    
    // Lateral izquierdo
    const lateralIzq = new THREE.Mesh(tuboAncho, material);
    lateralIzq.position.set(-largo/2 + insetMadera, posY, 0);
    lateralIzq.castShadow = true;
    soporteGroup.add(lateralIzq);
    
    // Lateral derecho
    const lateralDer = new THREE.Mesh(tuboAncho, material);
    lateralDer.position.set(largo/2 - insetMadera, posY, 0);
    lateralDer.castShadow = true;
    soporteGroup.add(lateralDer);
    
    // **TRAVESAÑOS**
    if (tipo === 'superior') {
        // Marco superior: 1 travesaño si ≤100cm, 2 si >100cm
        if (largoAcuario <= 100) {
            const travesano = new THREE.Mesh(tuboAncho, material);
            travesano.position.set(0, posY, 0);
            travesano.castShadow = true;
            soporteGroup.add(travesano);
        } else {
            // 2 travesaños equidistantes
            const travesano1 = new THREE.Mesh(tuboAncho, material);
            travesano1.position.set(-largo/4, posY, 0);
            travesano1.castShadow = true;
            soporteGroup.add(travesano1);
            
            const travesano2 = new THREE.Mesh(tuboAncho, material);
            travesano2.position.set(largo/4, posY, 0);
            travesano2.castShadow = true;
            soporteGroup.add(travesano2);
        }
    } else if (tipo === 'inferior') {
        // Marco inferior: travesaños cada ~35cm
        const numTravesanos = Math.ceil(largoAcuario / 35);
        const separacion = largo / (numTravesanos + 1);
        
        for (let i = 1; i <= numTravesanos; i++) {
            const travesano = new THREE.Mesh(tuboAncho, material);
            travesano.position.set(-largo/2 + (separacion * i), posY, 0);
            travesano.castShadow = true;
            soporteGroup.add(travesano);
        }
    }
    
    console.log(`✅ Marco ${tipo} creado con inset de ${insetMadera * 10}cm para madera`);
}

/**
 * Crear patas verticales
 */
function crearPatasVerticales(largo, ancho, altura, grosor, material, posY, largoAcuario) {
    const pataGeo = new THREE.BoxGeometry(grosor, altura, grosor);
    
    // Determinar número y posición de patas según largo del acuario
    const patas = calcularPosicionesPatas(largo, ancho, largoAcuario);
    
    patas.forEach(pos => {
        const pata = new THREE.Mesh(pataGeo, material);
        pata.position.set(pos.x, posY, pos.z);  // posY ya es el centro correcto
        pata.castShadow = true;
        soporteGroup.add(pata);
    });
}

/**
 * Calcular posiciones de patas según dimensiones
 */
function calcularPosicionesPatas(largo, ancho, largoAcuario) {
    const patas = [];
    const insetMadera = 0.2; // 2cm hacia el centro para coincidir con marcos
    const desplazamientoFrontal = 1.0; // 10cm hacia atrás para bisagras de puertas (a lo ancho/Z)
    
    // 4 patas base - alineadas con esquinas de marcos desplazados
    // Frontales (en las esquinas X, pero desplazadas hacia ATRÁS en Z para bisagras)
    patas.push({ x: -largo/2 + insetMadera, z: ancho/2 - insetMadera - desplazamientoFrontal });  // Frontal izq
    patas.push({ x: largo/2 - insetMadera, z: ancho/2 - insetMadera - desplazamientoFrontal });   // Frontal der
    
    // Traseras (alineadas con esquinas de marco trasero)
    patas.push({ x: -largo/2 + insetMadera, z: -ancho/2 + insetMadera });  // Trasera izq
    patas.push({ x: largo/2 - insetMadera, z: -ancho/2 + insetMadera });   // Trasera der
    
    // 5ª pata: trasera central si largo ≥ 150cm
    if (largoAcuario >= 150) {
        patas.push({ x: 0, z: -ancho/2 + insetMadera });  // Trasera central
    }
    
    // A partir de 250cm: más patas traseras intermedias
    if (largoAcuario >= 250) {
        patas.push({ x: -largo/4, z: -ancho/2 + insetMadera });  // Trasera izq-central
        patas.push({ x: largo/4, z: -ancho/2 + insetMadera });   // Trasera der-central
    }
    
    return patas;
}

/**
 * Crear pies niveladores
 */
function crearPiesNiveladores(largo, ancho, altura, grosorTubular, material, posY, largoAcuario) {
    const radioPie = grosorTubular * 0.6;
    const pieGeo = new THREE.CylinderGeometry(radioPie, radioPie * 1.2, altura, 8);
    
    const materialPie = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.5,
        roughness: 0.5
    });
    
    const patas = calcularPosicionesPatas(largo, ancho, largoAcuario);
    
    patas.forEach(pos => {
        const pie = new THREE.Mesh(pieGeo, materialPie);
        pie.position.set(pos.x, posY, pos.z);  // posY ya es el centro correcto
        pie.castShadow = true;
        soporteGroup.add(pie);
    });
}

// ============================================
// ILUMINACIÓN LED INTERNA 3D
// ============================================

/**
 * Calcula el número de tiras LED según el largo del acuario
 * ≤100cm: 1, >100cm: 2, >200cm: 3, etc.
 */
function calcularNumeroLeds(largoCm) {
    return Math.max(1, Math.ceil(largoCm / 100));
}

/**
 * Crear tiras LED 3D dentro de la mesa
 * Barras de 40cm largo × 1cm grosor, pegadas bajo el marco superior
 */
function crearIluminacionLed3D(largoAcuario, anchoAcuario) {
    eliminarIluminacionLed3D();
    
    if (!soporteGroup) {
        console.log('⚠️ No hay soporteGroup para añadir LEDs');
        return;
    }
    
    const ilumActiva = (document.getElementById('iluminacionModular')?.checked || false) ||
                       (document.getElementById('iluminacionMesaMelamina')?.checked || false);
    if (!ilumActiva) {
        console.log('⏭️ Iluminación LED no activa');
        return;
    }
    
    const l = largoAcuario || parseFloat(document.getElementById('largo')?.value) || 100;
    const a = anchoAcuario || parseFloat(document.getElementById('ancho')?.value) || 40;
    
    const largoCm = l; // en cm
    const numLeds = calcularNumeroLeds(largoCm);
    
    console.log(`💡 Creando ${numLeds} tira(s) LED para acuario de ${largoCm}cm`);
    
    ledGroup = new THREE.Group();
    ledGroup.name = 'iluminacionLedGroup';
    
    // Dimensiones en unidades 3D (1 unidad = 10cm)
    const largoLed = 4.0;     // 40cm
    const grosorLed = 0.10;   // 1cm
    const anchoLed = 0.20;    // 2cm de ancho (perfil de la barra)
    
    // Posición Y: pegada a la parte baja del marco superior
    // Marco superior: centro en posYMarcoSuperior, grosor = grosorTubular = 0.35
    const grosorTubular = 0.35;
    const alturaTotal = 8.5;
    const posYMarcoSuperior = alturaTotal - grosorTubular / 2;
    const posYLed = posYMarcoSuperior - grosorTubular / 2 - grosorLed / 2; // Justo debajo del marco
    
    // Largo/ancho de la estructura
    const largoEst = l / 10; // cm a unidades 3D
    const anchoEst = a / 10;
    
    // Color blanco frío 10000K (azulado tenue)
    const colorLedFrio = 0xd4e5ff; // Blanco frío azulado
    
    // Material LED: emissive fuerte para que brille
    const materialLed = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: colorLedFrio,
        emissiveIntensity: 5.0,
        metalness: 0.0,
        roughness: 0.1
    });
    
    // Distribuir las tiras: largo / (numLeds + 1) = separación
    const separacion = largoEst / (numLeds + 1);
    
    for (let i = 0; i < numLeds; i++) {
        const posX = -largoEst / 2 + separacion * (i + 1); // Distribuidas equidistantemente
        
        // Barra LED
        const geoLed = new THREE.BoxGeometry(largoLed, grosorLed, anchoLed);
        const meshLed = new THREE.Mesh(geoLed, materialLed);
        meshLed.position.set(posX, posYLed, 0); // Centrada en Z (ancho)
        meshLed.name = `tiraled_${i}`;
        ledGroup.add(meshLed);
        
        // Múltiples PointLights distribuidas a lo largo de la barra para reflejo alargado
        const numLucesPorBarra = 5;
        const intensidadPorLuz = 2.0 / numLucesPorBarra; // Repartir intensidad total
        for (let j = 0; j < numLucesPorBarra; j++) {
            const offsetX = (j / (numLucesPorBarra - 1) - 0.5) * largoLed; // De -2.0 a +2.0
            const pointLight = new THREE.PointLight(colorLedFrio, intensidadPorLuz, 8, 1.5);
            pointLight.position.set(posX + offsetX, posYLed - 0.3, 0);
            pointLight.name = `ledLight_${i}_${j}`;
            ledGroup.add(pointLight);
        }
        
        console.log(`   💡 LED ${i + 1}: X=${posX.toFixed(2)}, Y=${posYLed.toFixed(2)} (${numLucesPorBarra} luces)`);
    }
    
    soporteGroup.add(ledGroup);
    console.log(`✅ ${numLeds} tira(s) LED creadas`);
}

/**
 * Eliminar iluminación LED 3D
 */
function eliminarIluminacionLed3D() {
    if (ledGroup && soporteGroup) {
        soporteGroup.remove(ledGroup);
        ledGroup.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        ledGroup = null;
        console.log('🗑️ LEDs eliminados');
    }
}

/**
 * Actualizar iluminación LED 3D (llamada desde UI)
 */
function actualizarIluminacionLed3D() {
    const l = parseFloat(document.getElementById('largo')?.value) || 100;
    const a = parseFloat(document.getElementById('ancho')?.value) || 40;
    crearIluminacionLed3D(l, a);
}

window.actualizarIluminacionLed3D = actualizarIluminacionLed3D;
window.calcularNumeroLeds = calcularNumeroLeds;

// ============================================
// FORRADO MELAMINA 3D
// ============================================

let forradoGroup = null;
let puertasPivots = []; // Array de pivots de puertas para animación abrir/cerrar
let puertasAbiertas = false;

/**
 * Determinar color de melamina según selección del usuario
 */
function obtenerColorMelamina() {
    // Caso 1: Estructura con forrado
    const forradoCheck = document.getElementById('forradoEstructuraMelamina')?.checked;
    if (forradoCheck) {
        const colorForrado = document.getElementById('colorForradoEstructura')?.value || 'blanco';
        return colorForrado === 'negro' ? 0x111111 : 0xd9d0c5;
    }
    
    // Caso 2: Mesa melamina
    const mesaCheck = document.getElementById('checkMesaMelamina')?.checked;
    if (mesaCheck) {
        const negroCheck = document.getElementById('mesaMelaminaNegro')?.checked;
        return negroCheck ? 0x111111 : 0xd9d0c5;
    }
    
    return 0xd9d0c5; // Blanco satinado por defecto
}

/**
 * Crear material melamina
 */
function crearMaterialMelamina(colorHex) {
    return new THREE.MeshStandardMaterial({
        color: colorHex,
        metalness: 0.08,
        roughness: 0.35,
        side: THREE.DoubleSide
    });
}

/**
 * Crear el forrado de melamina completo (puertas, laterales, trasera, bandeja)
 */
function crearForradoMelamina3D(largoAcuario, anchoAcuario) {
    // Limpiar forrado anterior
    eliminarForradoMelamina3D();
    
    if (!soporteGroup || !window.threeScene) return;
    
    forradoGroup = new THREE.Group();
    puertasPivots = [];
    
    const colorMelamina = obtenerColorMelamina();
    const material = crearMaterialMelamina(colorMelamina);
    
    // Convertir a unidades Three.js (cm → unidades /10)
    const l = largoAcuario / 10;  // largo acuario en unidades
    const a = anchoAcuario / 10;  // ancho acuario en unidades
    
    // Grosor melamina: 19mm = 0.19 unidades
    const grosorMelamina = 0.19;
    
    // La estructura es 2cm (0.2u) más pequeña que el acuario por cada lado
    // → estructura ocupa: largo-0.4 × ancho-0.4
    // Al añadir forrado de 19mm ≈ 2cm, los vértices casi coinciden con el cristal
    
    // Altura total del soporte: 85cm = 8.5u
    const alturaTotal = 8.5;
    // Pies: 5cm = 0.5u
    const alturaPies = 0.5;
    // Grosor marco tubular: 3.5cm = 0.35u
    const grosorTubular = 0.35;
    
    // Posiciones Y de los marcos (relativas a soporteGroup)
    const posYMarcoInferior = alturaPies + grosorTubular / 2;  // centro marco inf
    const posYMarcoSuperior = alturaTotal - grosorTubular / 2;  // centro marco sup
    
    // La melamina cubre hasta la base del acuario por arriba
    const margen = 0.03; // 3mm
    
    // Detectar si hay patas niveladoras activas
    const piesNiveladoresActivos = document.getElementById('piesNiveladores')?.checked || false;
    
    // Borde inferior: 
    // - SIN patas: cara inferior del marco inferior (el punto más bajo de la estructura)
    // - CON patas: 3mm del suelo (cubrir patas y pies)
    const yInferior = piesNiveladoresActivos 
        ? margen  // 3mm del suelo
        : (posYMarcoInferior - grosorTubular / 2 + margen);  // cara inferior marco inferior + 3mm
    // Borde superior: cara superior del marco superior (toca base del acuario) - margen
    const ySuperior = posYMarcoSuperior + grosorTubular / 2 - margen;
    
    const alturaPieza = ySuperior - yInferior;
    const centroYPieza = yInferior + alturaPieza / 2;
    
    // Detectar si es mesa melamina (necesario antes de crear puertas)
    const esMesaMelamina = document.getElementById('checkMesaMelamina')?.checked || false;
    
    // Dimensiones de la estructura (2cm menos por lado que acuario)
    const largoEstructura = l - 0.4;
    const anchoEstructura = a - 0.4;
    
    // Detección tipo acuario (marino/dulce) - necesario antes de zona estanca
    const tipoAcuarioMesaGlobal = document.getElementById('tipoAcuarioMesa')?.value || 'marino';
    const esMarinoDulce = esMesaMelamina && tipoAcuarioMesaGlobal === 'marino';
    const esAguaDulceMesa = esMesaMelamina && tipoAcuarioMesaGlobal === 'dulce';
    
    // === PUERTAS FRONTALES ===
    // Zona estanca: las puertas se encogen 20cm y aparece un fijo a la derecha
    // Activa si: mesa melamina MARINO + zonaEstancaMesa, O estructura con forrado + zonaEstanca
    // Agua dulce NO lleva zona estanca
    const zonaEstancaMesa = esMesaMelamina && !esAguaDulceMesa && (document.getElementById('zonaEstancaMesa')?.checked || false);
    const zonaEstancaEstructura = !esMesaMelamina && (document.getElementById('zonaEstanca')?.checked || false);
    const zonaEstancaActiva = zonaEstancaMesa || zonaEstancaEstructura;
    const recorteZonaEstanca = zonaEstancaActiva ? 2.0 : 0; // 20cm en unidades 3D
    
    // Puertas: 19mm más altas si hay tapa (mesa melamina o zona estanca estructura)
    const tieneTapa = esMesaMelamina || zonaEstancaActiva;
    const alturaPuerta = tieneTapa ? alturaPieza + grosorMelamina : alturaPieza;
    const centroYPuerta = tieneTapa ? centroYPieza + grosorMelamina / 2 : centroYPieza;
    
    const largoPuertas = largoAcuario - (zonaEstancaActiva ? 20 : 0); // largo disponible para puertas en cm
    
    const numPuertas = Math.ceil(largoPuertas / 65);
    const anchoPuertaCm = largoPuertas / numPuertas;
    const separacionPuertas = 0.01; // 1mm entre puertas
    const anchoPuerta = (anchoPuertaCm / 10) - separacionPuertas; // ancho real de cada puerta
    
    console.log(`🚪 Puertas: ${numPuertas} de ${anchoPuertaCm.toFixed(1)}cm (${anchoPuerta.toFixed(3)}u)${zonaEstancaActiva ? ' [zona estanca: -20cm]' : ''}`);
    
    // Posición Z frontal: el forrado va por fuera de la estructura
    const zFrontal = anchoEstructura / 2 + grosorMelamina / 2;
    
    // Offset X: con zona estanca, las puertas empiezan desde la izquierda naturalmente
    const offsetXPuertas = 0;
    
    for (let i = 0; i < numPuertas; i++) {
        const puertaGeo = new THREE.BoxGeometry(anchoPuerta, alturaPuerta, grosorMelamina);
        const puertaMesh = new THREE.Mesh(puertaGeo, material.clone());
        puertaMesh.castShadow = true;
        puertaMesh.receiveShadow = true;
        
        // Posición X de cada puerta (centradas en el largo disponible, desplazadas si zona estanca)
        const inicioX = -l / 2 + (anchoPuertaCm / 10) / 2 + offsetXPuertas;
        const posX = inicioX + i * (anchoPuertaCm / 10);
        
        // Crear pivot para rotación (bisagra)
        const pivot = new THREE.Group();
        pivot.userData = { tipo: 'puerta', indice: i, numTotal: numPuertas };
        
        // Posición del pivot = borde de la bisagra
        if (numPuertas === 1) {
            pivot.position.set(posX - anchoPuerta / 2, centroYPuerta, zFrontal);
            puertaMesh.position.set(anchoPuerta / 2, 0, 0);
        } else if (numPuertas === 2) {
            if (i === 0) {
                pivot.position.set(posX - anchoPuerta / 2, centroYPuerta, zFrontal);
                puertaMesh.position.set(anchoPuerta / 2, 0, 0);
            } else {
                pivot.position.set(posX + anchoPuerta / 2, centroYPuerta, zFrontal);
                puertaMesh.position.set(-anchoPuerta / 2, 0, 0);
            }
        } else {
            if (i === 0) {
                pivot.position.set(posX - anchoPuerta / 2, centroYPuerta, zFrontal);
                puertaMesh.position.set(anchoPuerta / 2, 0, 0);
            } else if (i === numPuertas - 1) {
                pivot.position.set(posX + anchoPuerta / 2, centroYPuerta, zFrontal);
                puertaMesh.position.set(-anchoPuerta / 2, 0, 0);
            } else {
                pivot.position.set(posX, centroYPuerta, zFrontal);
                puertaMesh.position.set(0, 0, 0);
                pivot.userData.desmontable = true;
            }
        }
        
        pivot.add(puertaMesh);
        forradoGroup.add(pivot);
        puertasPivots.push(pivot);
    }
    
    // === FIJO FRONTAL ZONA ESTANCA (si activa) ===
    if (zonaEstancaActiva) {
        const anchoFijo = 2.0; // 20cm
        const fijoGeo = new THREE.BoxGeometry(anchoFijo, alturaPuerta, grosorMelamina);
        const fijoMesh = new THREE.Mesh(fijoGeo, material.clone());
        fijoMesh.castShadow = true;
        fijoMesh.receiveShadow = true;
        // Posición X: extremo derecho
        const xFijo = l / 2 - anchoFijo / 2;
        fijoMesh.position.set(xFijo, centroYPuerta, zFrontal);
        fijoMesh.userData = { tipo: 'fijoZonaEstanca' };
        forradoGroup.add(fijoMesh);
        console.log(`   🔒 Fijo frontal zona estanca: 20cm × ${(alturaPuerta * 10).toFixed(1)}cm`);
    }
    
    // === LATERALES (2 piezas) ===
    const anchoLateral = a - 0.2; // quitar 2cm por la parte frontal
    const lateralGeo = new THREE.BoxGeometry(grosorMelamina, alturaPieza, anchoLateral);
    
    // Lateral izquierdo (siempre fijo)
    const lateralIzq = new THREE.Mesh(lateralGeo, material.clone());
    const xLateral = largoEstructura / 2 + grosorMelamina / 2;
    const zLateral = -0.1; // centrado con el recorte frontal
    lateralIzq.position.set(-xLateral, centroYPieza, zLateral);
    lateralIzq.castShadow = true;
    lateralIzq.receiveShadow = true;
    forradoGroup.add(lateralIzq);
    
    // Lateral derecho: si zona estanca activa → es una puerta que se abre
    if (zonaEstancaActiva) {
        const lateralDerMesh = new THREE.Mesh(lateralGeo, material.clone());
        lateralDerMesh.castShadow = true;
        lateralDerMesh.receiveShadow = true;
        
        // Pivot en el borde trasero del lateral derecho (bisagra atrás)
        const pivotLateral = new THREE.Group();
        pivotLateral.userData = { tipo: 'puertaLateral', lado: 'derecho' };
        // Pivot en la esquina trasera-derecha
        pivotLateral.position.set(xLateral, centroYPieza, zLateral - anchoLateral / 2);
        // Mesh desplazado desde el pivot hacia el frente
        lateralDerMesh.position.set(0, 0, anchoLateral / 2);
        pivotLateral.add(lateralDerMesh);
        forradoGroup.add(pivotLateral);
        puertasPivots.push(pivotLateral);
        console.log(`   🚪 Lateral derecho como puerta (zona estanca)`);
    } else {
        const lateralDer = new THREE.Mesh(lateralGeo, material.clone());
        lateralDer.position.set(xLateral, centroYPieza, zLateral);
        lateralDer.castShadow = true;
        lateralDer.receiveShadow = true;
        forradoGroup.add(lateralDer);
    }
    
    // === DIVISOR INTERNO ZONA ESTANCA ===
    if (zonaEstancaActiva) {
        // Pieza interna igual que el lateral, a 20cm del borde derecho
        const divisorGeo = new THREE.BoxGeometry(grosorMelamina, alturaPieza, anchoLateral);
        const divisor = new THREE.Mesh(divisorGeo, material.clone());
        const xDivisor = l / 2 - 2.0; // 20cm desde el borde derecho
        divisor.position.set(xDivisor, centroYPieza, zLateral);
        divisor.castShadow = true;
        divisor.receiveShadow = true;
        divisor.userData = { tipo: 'divisorZonaEstanca' };
        forradoGroup.add(divisor);
        console.log(`   🔲 Divisor zona estanca en X=${xDivisor.toFixed(2)} (20cm del borde dcho)`);
    }
    
    // === DIVISOR CENTRAL AGUA DULCE ===
    if (esAguaDulceMesa) {
        // Pieza idéntica al lateral, colocada en el centro (X=0)
        const divisorDulceGeo = new THREE.BoxGeometry(grosorMelamina, alturaPieza, anchoLateral);
        const divisorDulce = new THREE.Mesh(divisorDulceGeo, material.clone());
        divisorDulce.position.set(0, centroYPieza, zLateral);
        divisorDulce.castShadow = true;
        divisorDulce.receiveShadow = true;
        divisorDulce.userData = { tipo: 'divisorCentralDulce' };
        forradoGroup.add(divisorDulce);
        console.log(`   🔲 Divisor central agua dulce en X=0 (divide en 2 partes iguales)`);
    }
    
    // === TRASERA ===
    // Largo de la trasera = largo acuario - 2cm por cada lado (no solapa sobre laterales)
    const largoTrasera = l - 0.4;
    // Agua dulce mesa: trasera reducida a 25cm de alto, apoyada en la base
    const alturaTrasera = esAguaDulceMesa ? 2.5 : alturaPieza;  // 25cm o altura completa
    const traseraGeo = new THREE.BoxGeometry(largoTrasera, alturaTrasera, grosorMelamina);
    const trasera = new THREE.Mesh(traseraGeo, material.clone());
    const zTrasera = -(anchoEstructura / 2 + grosorMelamina / 2);
    const yTrasera = esAguaDulceMesa
        ? yInferior + alturaTrasera / 2  // desde la base de laterales/puertas
        : centroYPieza;
    trasera.position.set(0, yTrasera, zTrasera);
    trasera.castShadow = true;
    trasera.receiveShadow = true;
    forradoGroup.add(trasera);
    
    // === TRASERA SUPERIOR AGUA DULCE (25cm pegada a la tapa) ===
    if (esAguaDulceMesa) {
        const alturaTraseraSup = 2.0;  // 20cm
        const traseraSuperiorGeo = new THREE.BoxGeometry(largoTrasera, alturaTraseraSup, grosorMelamina);
        const traseraSuperior = new THREE.Mesh(traseraSuperiorGeo, material.clone());
        // Borde superior toca ySuperior
        const yTraseraSup = ySuperior - alturaTraseraSup / 2;
        traseraSuperior.position.set(0, yTraseraSup, zTrasera);
        traseraSuperior.castShadow = true;
        traseraSuperior.receiveShadow = true;
        traseraSuperior.userData = { tipo: 'traseraSuperiorDulce' };
        forradoGroup.add(traseraSuperior);
        console.log(`   🔲 Trasera superior agua dulce: ${(largoTrasera * 10).toFixed(1)}cm × 25cm, pegada a tapa`);
    }
    
    // === BANDEJA INTERIOR ===
    // Mismas dimensiones que el marco inferior, grosor 19mm de alto
    const insetMadera = 0.2; // mismo inset que los marcos
    const largoBandeja = largoEstructura;
    const anchoBandeja = anchoEstructura;
    const bandejaGeo = new THREE.BoxGeometry(largoBandeja, grosorMelamina, anchoBandeja);
    const bandeja = new THREE.Mesh(bandejaGeo, material.clone());
    // Agua dulce mesa: la bandeja baja al borde inferior de laterales/puertas. Normal: sobre marco inferior
    const yBandeja = esAguaDulceMesa
        ? yInferior + grosorMelamina / 2  // alineada con la base de laterales/puertas
        : posYMarcoInferior + grosorTubular / 2 + grosorMelamina / 2;  // sobre marco inferior
    bandeja.position.set(0, yBandeja, 0);
    bandeja.castShadow = true;
    bandeja.receiveShadow = true;
    forradoGroup.add(bandeja);
    
    // === PIEZAS EXCLUSIVAS DE MESA MELAMINA (no forrado sobre estructura) ===
    
    // === TAPA SUPERIOR ZONA ESTANCA ESTRUCTURA ===
    // Si hay zona estanca en estructura (sin mesa melamina), añadir tapa arriba
    if (!esMesaMelamina && zonaEstancaActiva) {
        const largoTapaZE = l;  // largo completo del acuario
        const anchoTapaZE = a - 0.2;  // ancho acuario - 2cm
        const tapaZEGeo = new THREE.BoxGeometry(largoTapaZE, grosorMelamina, anchoTapaZE);
        const tapaZE = new THREE.Mesh(tapaZEGeo, material.clone());
        const yTapaZE = ySuperior + grosorMelamina / 2;
        const zTapaZE = -0.1;
        tapaZE.position.set(0, yTapaZE, zTapaZE);
        tapaZE.castShadow = true;
        tapaZE.receiveShadow = true;
        tapaZE.userData = { tipo: 'tapaZonaEstanca' };
        forradoGroup.add(tapaZE);
        
        console.log(`   📋 Tapa zona estanca estructura: ${(largoTapaZE * 10).toFixed(1)}cm × ${(anchoTapaZE * 10).toFixed(1)}cm × 19mm`);
    }
    
    if (esMesaMelamina) {
        // === TAPA SUPERIOR ===
        // largo_acuario × (ancho_acuario - 2cm) × 19mm
        // Retranqueada 2cm por delante para que las puertas encajen bajo el cristal
        const largoTapa = l;  // largo completo del acuario
        const anchoTapa = a - 0.2;  // ancho acuario - 2cm
        const tapaGeo = new THREE.BoxGeometry(largoTapa, grosorMelamina, anchoTapa);
        const tapa = new THREE.Mesh(tapaGeo, material.clone());
        // La tapa monta ENCIMA de todo, en la cara superior (donde apoya el acuario)
        const yTapa = ySuperior + grosorMelamina / 2;
        // Desplazada 1cm hacia atrás (centro del ancho menos los 2cm frontales)
        const zTapa = -0.1;
        tapa.position.set(0, yTapa, zTapa);
        tapa.castShadow = true;
        tapa.receiveShadow = true;
        tapa.userData = { tipo: 'tapaMesa' };
        forradoGroup.add(tapa);
        
        console.log(`   📋 Tapa mesa: ${(largoTapa * 10).toFixed(1)}cm × ${(anchoTapa * 10).toFixed(1)}cm × 19mm, Y=${yTapa.toFixed(3)}`);
        
        // === REFUERZO FRONTAL SUPERIOR ===
        // Solo en acuario marino (no en agua dulce)
        // Variables para piezas que necesitan las mismas dimensiones
        const alturaRefuerzo = 1.2;  // 12cm
        const largoRefuerzo = zonaEstancaActiva ? l - recorteZonaEstanca : l;
        const offsetXRefuerzo = zonaEstancaActiva ? -recorteZonaEstanca / 2 : 0;
        const zRefuerzo = zFrontal - 0.2;
        
        if (esMarinoDulce) {
            // Pieza en la parte superior frontal, 12cm de alto × 19mm grosor
            // Con zona estanca: se encoge 20cm igual que las puertas
            const refuerzoGeo = new THREE.BoxGeometry(largoRefuerzo, alturaRefuerzo, grosorMelamina);
            const refuerzo = new THREE.Mesh(refuerzoGeo, material.clone());
            // Posición Y: la parte superior del refuerzo toca la parte inferior de la tapa
            const yRefuerzo = yTapa - grosorMelamina / 2 - alturaRefuerzo / 2;
            refuerzo.position.set(offsetXRefuerzo, yRefuerzo, zRefuerzo);
            refuerzo.castShadow = true;
            refuerzo.receiveShadow = true;
            refuerzo.userData = { tipo: 'refuerzoFrontal' };
            forradoGroup.add(refuerzo);
            
            console.log(`   🔧 Refuerzo frontal: ${(largoRefuerzo * 10).toFixed(1)}cm × 12cm × 19mm${zonaEstancaActiva ? ' (encogido -20cm)' : ''}`);
        }
        // === ZÓCALO FRONTAL (pie de la mesa) ===
        // Solo para marino. En agua dulce se elimina (la bandeja ya baja al suelo)
        if (esMarinoDulce) {
            const yBaseBandeja = yBandeja - grosorMelamina / 2;  // cara inferior de la bandeja
            const alturaZocalo = yBaseBandeja - yInferior;
            const zocaloGeo = new THREE.BoxGeometry(largoRefuerzo, alturaZocalo, grosorMelamina);
            const zocalo = new THREE.Mesh(zocaloGeo, material.clone());
            const yZocalo = yInferior + alturaZocalo / 2;
            zocalo.position.set(offsetXRefuerzo, yZocalo, zRefuerzo);
            zocalo.castShadow = true;
            zocalo.receiveShadow = true;
            zocalo.userData = { tipo: 'zocaloFrontal' };
            forradoGroup.add(zocalo);
            
            console.log(`   🔧 Zócalo frontal: ${(largoRefuerzo * 10).toFixed(1)}cm × ${(alturaZocalo * 10).toFixed(1)}cm`);
        
            // === ZÓCALO LATERAL DERECHO (solo con zona estanca + marino) ===
            if (zonaEstancaActiva) {
                // Igual de alto que el zócalo frontal, va a lo ancho, en la parte derecha
                // Desplazado 2cm hacia el interior
                const anchoZocaloLat = a - 0.2; // ancho acuario - 2cm (igual que laterales)
                const zocaloLatGeo = new THREE.BoxGeometry(grosorMelamina, alturaZocalo, anchoZocaloLat);
                const zocaloLat = new THREE.Mesh(zocaloLatGeo, material.clone());
                // Posición X: en el lateral derecho, desplazado 2cm hacia el interior
                const xZocaloLat = xLateral - 0.2;
                zocaloLat.position.set(xZocaloLat, yZocalo, zLateral);
                zocaloLat.castShadow = true;
                zocaloLat.receiveShadow = true;
                zocaloLat.userData = { tipo: 'zocaloLateralDerecho' };
                forradoGroup.add(zocaloLat);
                
                console.log(`   🔧 Zócalo lateral dcho: ${(anchoZocaloLat * 10).toFixed(1)}cm × ${(alturaZocalo * 10).toFixed(1)}cm (desplazado 2cm interior)`);
            }
        }
    }
    
    // === REGLETA 8 ENCHUFES ===
    // Fuera del bloque mesa melamina para funcionar con ambas opciones
    // Activa si: mesa melamina (marino o dulce) con regleta, O estructura con regletaEstructura
    const regletaMesa = document.getElementById('regletaMesaMelamina')?.checked || false;
    const regletaDulce = document.getElementById('regletaMesaDulce')?.checked || false;
    const regletaEstr = document.getElementById('regletaEstructura')?.checked || false;
    const regletaActiva = (esMesaMelamina && (regletaMesa || regletaDulce)) || (!esMesaMelamina && regletaEstr);
    if (regletaActiva) {
        // Dimensiones regleta real: ~50cm largo × 5.5cm ancho × 4cm alto
        const largoRegleta = 5.0;   // 50cm
        const anchoRegleta = 0.55;  // 5.5cm
        const altoRegleta = 0.40;   // 4cm
        
        // Material base regleta: plástico blanco
        const materialRegleta = new THREE.MeshStandardMaterial({
            color: 0xf0f0f0,
            roughness: 0.6,
            metalness: 0.05
        });
        
        // Material enchufes: gris oscuro
        const materialEnchufe = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.4,
            metalness: 0.1
        });
        
        // Material interruptor: rojo
        const materialInterruptor = new THREE.MeshStandardMaterial({
            color: 0xcc2222,
            emissive: 0x331111,
            emissiveIntensity: 0.3,
            roughness: 0.3,
            metalness: 0.1
        });
        
        const regletaGroup = new THREE.Group();
        regletaGroup.name = 'regletaGroup';
        
        // Cuerpo principal de la regleta
        const cuerpoGeo = new THREE.BoxGeometry(largoRegleta, altoRegleta, anchoRegleta);
        const cuerpo = new THREE.Mesh(cuerpoGeo, materialRegleta);
        regletaGroup.add(cuerpo);
        
        // 8 enchufes distribuidos a lo largo (huecos circulares representados como cilindros)
        const separacionEnchufes = largoRegleta / 9; // 8 enchufes, 9 espacios
        for (let e = 0; e < 8; e++) {
            const posXE = -largoRegleta / 2 + separacionEnchufes * (e + 1);
            
            // Base del enchufe (cuadrado hundido)
            const baseGeo = new THREE.BoxGeometry(0.38, 0.05, 0.38);
            const base = new THREE.Mesh(baseGeo, materialEnchufe);
            base.position.set(posXE, altoRegleta / 2 + 0.025, 0);
            regletaGroup.add(base);
            
            // Dos agujeros del enchufe (cilindros pequeños)
            const holeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8);
            const hole1 = new THREE.Mesh(holeGeo, materialEnchufe);
            hole1.position.set(posXE - 0.08, altoRegleta / 2 + 0.03, 0);
            regletaGroup.add(hole1);
            
            const hole2 = new THREE.Mesh(holeGeo, materialEnchufe);
            hole2.position.set(posXE + 0.08, altoRegleta / 2 + 0.03, 0);
            regletaGroup.add(hole2);
        }
        
        // Interruptor en un extremo
        const interruptorGeo = new THREE.BoxGeometry(0.35, 0.08, 0.25);
        const interruptor = new THREE.Mesh(interruptorGeo, materialInterruptor);
        interruptor.position.set(-largoRegleta / 2 + 0.25, altoRegleta / 2 + 0.04, 0);
        regletaGroup.add(interruptor);
        
        // Posicionar según zona estanca
        if (zonaEstancaActiva) {
            // VERTICAL: en el compartimento de equipos electrónicos (zona derecha)
            regletaGroup.rotation.z = Math.PI / 2; // rotar para que quede vertical
            regletaGroup.rotation.y = Math.PI;     // 180° para que enchufes miren hacia el lateral exterior
            // X: pegada al divisor (l/2 - 2.0)
            const xDivisor = l / 2 - 2.0;
            const xRegleta = xDivisor + 0.3; // 3cm hacia la derecha para no quedar atrapada
            // Posición Y: bajada 25cm desde la parte superior
            const yRegleta = ySuperior - 2.5;
            // Posición Z: 20cm hacia el fondo
            regletaGroup.position.set(xRegleta, yRegleta, -2.0);
            console.log(`   🔌 Regleta VERTICAL zona estanca: X=${xRegleta.toFixed(2)}, Y=${yRegleta.toFixed(2)}`);
        } else {
            // VERTICAL: solo girar Z 90° para poner vertical, enchufes siguen mirando arriba→frente
            regletaGroup.rotation.z = Math.PI / 2;
            // Posición Y: parte alta de la regleta 3cm por debajo de la tapa
            const yRegleta = ySuperior - 0.3 - largoRegleta / 2;
            // Posición X: pegada a la derecha
            const xRegleta = l / 2 - altoRegleta / 2 - 0.15;
            // Posición Z: pegada a la trasera
            const zTras = -(anchoEstructura / 2) + anchoRegleta / 2 + 0.3;
            regletaGroup.position.set(xRegleta, yRegleta, zTras);
            console.log(`   🔌 Regleta VERTICAL arriba-derecha: X=${xRegleta.toFixed(2)}, Y=${yRegleta.toFixed(2)}`);
        }
        
        regletaGroup.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        forradoGroup.add(regletaGroup);
    }
    
    // === VENTILADOR RENOVACIÓN DE AIRE ===
    const ventiladorMesaCheck = document.getElementById('ventiladorMesaMarino')?.checked || false;
    const ventiladorEstrCheck = document.getElementById('ventiladorEstructura')?.checked || false;
    const ventiladorActivo = (esMesaMelamina && ventiladorMesaCheck) || (!esMesaMelamina && ventiladorEstrCheck);
    if (ventiladorActivo && !esAguaDulceMesa) {
        const tipoVentiladorSel = ventiladorMesaCheck ? 'tipoVentiladorMesa' : 'tipoVentiladorEstructura';
        const tipoVentilador3D = document.getElementById(tipoVentiladorSel)?.value || 'simple';
        const numVentiladores = tipoVentilador3D === 'doble' ? 2 : 1;

        // Dimensiones ventilador PC: 12cm × 12cm × 2.5cm
        const tamFan = 1.2;       // 12cm lado
        const profFan = 0.25;     // 2.5cm profundidad
        const marcoAncho = 0.12;  // 1.2cm ancho del marco

        // Materiales
        const materialMarcoFan = new THREE.MeshStandardMaterial({
            color: 0x222222, roughness: 0.7, metalness: 0.3
        });
        const materialAspa = new THREE.MeshStandardMaterial({
            color: 0x333333, roughness: 0.5, metalness: 0.2
        });
        const materialHubFan = new THREE.MeshStandardMaterial({
            color: 0x111111, roughness: 0.4, metalness: 0.4
        });

        for (let v = 0; v < numVentiladores; v++) {
            const fanGroup = new THREE.Group();
            fanGroup.name = 'ventiladorGroup_' + v;

            // --- Marco cuadrado (4 barras) ---
            const half = tamFan / 2;
            // Barras horizontales (arriba y abajo)
            const barHGeo = new THREE.BoxGeometry(tamFan, marcoAncho, profFan);
            const topBar = new THREE.Mesh(barHGeo, materialMarcoFan);
            topBar.position.set(0, half - marcoAncho / 2, 0);
            fanGroup.add(topBar);
            const bottomBar = new THREE.Mesh(barHGeo, materialMarcoFan);
            bottomBar.position.set(0, -half + marcoAncho / 2, 0);
            fanGroup.add(bottomBar);
            // Barras verticales (izquierda y derecha)
            const barVGeo = new THREE.BoxGeometry(marcoAncho, tamFan - 2 * marcoAncho, profFan);
            const leftBar = new THREE.Mesh(barVGeo, materialMarcoFan);
            leftBar.position.set(-half + marcoAncho / 2, 0, 0);
            fanGroup.add(leftBar);
            const rightBar = new THREE.Mesh(barVGeo, materialMarcoFan);
            rightBar.position.set(half - marcoAncho / 2, 0, 0);
            fanGroup.add(rightBar);

            // --- Anillo circular interior (torus) ---
            const radioRing = (tamFan - 2 * marcoAncho) / 2 - 0.02;
            const torusGeo = new THREE.TorusGeometry(radioRing, 0.03, 8, 32);
            const torusMesh = new THREE.Mesh(torusGeo, materialMarcoFan);
            fanGroup.add(torusMesh);

            // --- Hub central (cilindro) ---
            const hubRadio = 0.15;
            const hubGeo = new THREE.CylinderGeometry(hubRadio, hubRadio, profFan * 0.8, 16);
            hubGeo.rotateX(Math.PI / 2);
            const hubMesh = new THREE.Mesh(hubGeo, materialHubFan);
            fanGroup.add(hubMesh);

            // --- Aspas del ventilador (7 aspas) ---
            const numAspas = 7;
            const aspaLargo = radioRing - hubRadio - 0.04;
            const aspaAncho = 0.20;  // 2cm de ancho
            const aspaGrosor = 0.02; // 2mm

            for (let b = 0; b < numAspas; b++) {
                const angulo = (b / numAspas) * Math.PI * 2;
                const aspaGeo = new THREE.BoxGeometry(aspaLargo, aspaAncho, aspaGrosor);
                const aspa = new THREE.Mesh(aspaGeo, materialAspa);

                const rMedia = hubRadio + aspaLargo / 2 + 0.02;
                aspa.position.set(
                    Math.cos(angulo) * rMedia,
                    Math.sin(angulo) * rMedia,
                    0
                );
                // Orientar radialmente + giro de paso (efecto hélice)
                aspa.rotation.z = angulo;
                aspa.rotation.x = 0.35;
                fanGroup.add(aspa);
            }

            // --- Posicionar en la trasera, lado izquierdo, zona alta ---
            // Interior de trasera: Z = -(anchoEstructura/2)
            const zFan = -(anchoEstructura / 2) + profFan / 2 + 0.02;
            // X: lado izquierdo, 7cm desde borde para librar pilar estructura (3.5cm tubo + margen)
            const xFan = -l / 2 + tamFan / 2 + 0.7 + v * (tamFan + 0.15);
            // Y: 5cm debajo de la tapa
            const yFan = ySuperior - 0.5 - tamFan / 2;

            fanGroup.position.set(xFan, yFan, zFan);

            fanGroup.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            forradoGroup.add(fanGroup);
        }
        console.log('🌀 Ventilador(es) 3D: ' + numVentiladores + ' × 12cm en trasera izquierda');
    }
    
    // Posicionar forrado: misma Y que el soporte, pero X siempre centrado (0)
    // El forrado cubre todo el largo del acuario incluyendo zona estanca
    forradoGroup.position.y = soporteGroup.position.y;
    forradoGroup.position.x = 0;
    forradoGroup.position.z = 0;
    
    // Mesa melamina: bajar todo 19mm para que la tapa quede justo debajo del cristal
    if (esMesaMelamina) {
        forradoGroup.position.y -= grosorMelamina;
    }
    // Zona estanca estructura: bajar forrado 9.5mm para alinear con estructura
    if (zonaEstancaActiva && !esMesaMelamina) {
        forradoGroup.position.y -= 0.095;
    }
    
    window.threeScene.add(forradoGroup);
    
    // Si las puertas estaban abiertas, re-aplicar
    if (puertasAbiertas) {
        aplicarEstadoPuertas(true);
    }
    
    console.log(`✅ Forrado melamina creado: ${numPuertas} puertas, 2 laterales, trasera, bandeja${esMesaMelamina ? ', tapa, refuerzo frontal' : ''}`);
}

// Variable global para el grupo del sump
let sumpGroup = null;

/**
 * Calcular grosor del cristal del sump: 2 grosores por debajo del acuario principal, mínimo 6mm
 * Escala: 6, 8, 10, 12, 15, 19
 */
function calcularGrosorSump() {
    const grosores = [6, 8, 10, 12, 15, 19];
    const codigoGrosor = parseInt(document.getElementById('grosor')?.value) || 3;
    // Código: 1=6mm, 2=8mm, 3=10mm, 4=12mm, 5=15mm, 6=19mm
    const idxAcuario = Math.min(codigoGrosor - 1, grosores.length - 1);
    const idxSump = Math.max(0, idxAcuario - 2); // 2 grosores por debajo, mínimo 0 (6mm)
    return grosores[idxSump];
}

/**
 * Crear sump (sumidero) en 3D dentro del mueble
 * Disponible cuando se activa el checkbox de sump
 */
function crearSump3D(largoAcuario, anchoAcuario) {
    // Eliminar sump anterior si existe
    eliminarSump3D();
    
    const sumpCheck = document.getElementById('checkSump')?.checked || false;
    if (!sumpCheck) return;

    const idsRebosadero = [
        'rebosaderoGeneral',
        'rebosaderoEsquinero',
        'rebosaderoEtapa',
        'rebosaderoDiagonal',
        'rebosaderoColumna',
        'rebosaderoExterno'
    ];
    const hayRebosadero = idsRebosadero.some(id => document.getElementById(id)?.checked);
    if (!hayRebosadero) return;

    const mesaActiva = document.getElementById('checkMesaMelamina')?.checked || false;
    
    // Detectar zona estanca activa
    const zonaEstancaMesaActiva = mesaActiva && (document.getElementById('zonaEstancaMesa')?.checked || false);
    const zonaEstancaEstrActiva = (document.getElementById('zonaEstanca')?.checked || false);
    const zonaEstancaActiva = zonaEstancaMesaActiva || zonaEstancaEstrActiva;
    
    // Dimensiones del sump
    let largoSump = (largoAcuario - 30) / 10;  // largo acuario -30cm, en unidades 3D
    if (zonaEstancaActiva) {
        largoSump -= 0.4; // 4cm menos por la derecha para librar la zona estanca
    }
    const anchoSump = (anchoAcuario - 9) / 10;   // ancho acuario -9cm, en unidades 3D
    const alturaFrontal = 3.5;  // 35cm siempre
    const alturaLateral = 4.5;  // 45cm siempre (laterales y trasera)
    const grosorMm = calcularGrosorSump();
    const t = grosorMm / 100;  // grosor en unidades 3D (ej: 8mm = 0.08)
    
    if (largoSump <= 0 || anchoSump <= 0) return;
    
    sumpGroup = new THREE.Group();
    sumpGroup.name = 'sumpGroup';
    
    // Material cristal transparente para sump
    const matSump = new THREE.MeshPhysicalMaterial({
        color: 0xE0F5FF,
        metalness: 0.05,
        roughness: 0.05,
        transmission: 0.92,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1
    });
    
    // Material silicona negra para juntas
    const matSilicona = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.8,
        metalness: 0.0
    });
    const siliconaGrosor = 0.02; // 2mm de ancho visible
    
    // Vinilo en sump
    const viniloSumpCheck = document.getElementById('viniloSump')?.checked || false;
    const colorViniloSump = document.getElementById('colorViniloSump')?.value || 'blanco';
    let matVinilo = null;
    if (viniloSumpCheck) {
        const colorVinHex = colorViniloSump === 'negro' ? 0x111111 : 0xF5F5F0;
        matVinilo = new THREE.MeshStandardMaterial({
            color: colorVinHex,
            roughness: 0.4,
            metalness: 0.05,
            side: THREE.DoubleSide
        });
    }
    
    // --- BASE del sump ---
    const baseGeo = new THREE.BoxGeometry(largoSump, t, anchoSump);
    const base = new THREE.Mesh(baseGeo, matSump.clone());
    base.position.set(0, t / 2, 0);
    sumpGroup.add(base);
    
    // --- FRONTAL (40cm de alto) ---
    const frontalGeo = new THREE.BoxGeometry(largoSump, alturaFrontal, t);
    const frontal = new THREE.Mesh(frontalGeo, matSump.clone());
    frontal.position.set(0, t + alturaFrontal / 2, anchoSump / 2 - t / 2);
    sumpGroup.add(frontal);
    
    // --- TRASERA (50cm de alto) ---
    const traseraGeo = new THREE.BoxGeometry(largoSump, alturaLateral, t);
    const trasera = new THREE.Mesh(traseraGeo, viniloSumpCheck ? matVinilo.clone() : matSump.clone());
    trasera.position.set(0, t + alturaLateral / 2, -(anchoSump / 2 - t / 2));
    sumpGroup.add(trasera);
    
    // --- LATERAL IZQUIERDO (50cm de alto) ---
    const profundidadLat = anchoSump - 2 * t;
    const latIzqGeo = new THREE.BoxGeometry(t, alturaLateral, profundidadLat);
    const latIzq = new THREE.Mesh(latIzqGeo, viniloSumpCheck ? matVinilo.clone() : matSump.clone());
    latIzq.position.set(-(largoSump / 2 - t / 2), t + alturaLateral / 2, 0);
    sumpGroup.add(latIzq);
    
    // --- LATERAL DERECHO (45cm de alto) ---
    const latDer = new THREE.Mesh(latIzqGeo.clone(), viniloSumpCheck ? matVinilo.clone() : matSump.clone());
    latDer.position.set(largoSump / 2 - t / 2, t + alturaLateral / 2, 0);
    sumpGroup.add(latDer);
    
    // --- ETAPA 1: Divisor interno, ~17% desde lateral derecho, 35cm de alto ---
    const offsetEtapa1 = largoSump * 0.171; // proporcional al largo
    const alturaEtapa1 = 3.5; // 35cm
    const etapa1Geo = new THREE.BoxGeometry(t, alturaEtapa1, profundidadLat);
    const etapa1 = new THREE.Mesh(etapa1Geo, matSump.clone());
    etapa1.position.set(largoSump / 2 - t / 2 - offsetEtapa1, t + alturaEtapa1 / 2, 0);
    sumpGroup.add(etapa1);
    
    // --- ETAPA 2: Divisor interno, ~50% desde lateral derecho, 25cm de alto ---
    const offsetEtapa2 = largoSump * 0.5; // proporcional al largo
    const alturaEtapa2 = 2.5; // 25cm
    const etapa2Geo = new THREE.BoxGeometry(t, alturaEtapa2, profundidadLat);
    const etapa2 = new THREE.Mesh(etapa2Geo, matSump.clone());
    etapa2.position.set(largoSump / 2 - t / 2 - offsetEtapa2, t + alturaEtapa2 / 2, 0);
    sumpGroup.add(etapa2);
    
    // --- ETAPA 3: Paralela a frontal, de etapa1 a etapa2, 22cm alto, 1.5cm levantada ---
    const xEtapa1 = largoSump / 2 - t / 2 - offsetEtapa1;
    const xEtapa2 = largoSump / 2 - t / 2 - offsetEtapa2;
    const largoEtapas34 = Math.abs(xEtapa1 - xEtapa2) - t; // entre caras internas
    const centroXEtapas34 = (xEtapa1 + xEtapa2) / 2;
    const alturaEtapa3 = 2.2; // 22cm
    const etapa3Geo = new THREE.BoxGeometry(largoEtapas34, alturaEtapa3, t);
    const etapa3 = new THREE.Mesh(etapa3Geo, matSump.clone());
    // 1/3 del ancho interior desde el frontal
    const zEtapa3 = anchoSump / 2 - t - profundidadLat / 3;
    etapa3.position.set(centroXEtapas34, t + 0.15 + alturaEtapa3 / 2, zEtapa3);
    sumpGroup.add(etapa3);
    
    // --- ETAPA 4: Paralela a frontal, de etapa1 a etapa2, 19cm alto, toca base ---
    const alturaEtapa4 = 1.9; // 19cm
    const etapa4Geo = new THREE.BoxGeometry(largoEtapas34, alturaEtapa4, t);
    const etapa4 = new THREE.Mesh(etapa4Geo, matSump.clone());
    // 2/3 del ancho interior desde el frontal
    const zEtapa4 = anchoSump / 2 - t - 2 * profundidadLat / 3;
    etapa4.position.set(centroXEtapas34, t + alturaEtapa4 / 2, zEtapa4);
    sumpGroup.add(etapa4);
    
    // --- JUNTAS DE SILICONA NEGRA ---
    // Líneas verticales en las 4 esquinas interiores (donde cristales se unen)
    const esquinas = [
        // Esquina frontal-izquierda
        { x: -(largoSump / 2 - t), z: anchoSump / 2 - t, h: alturaFrontal },
        // Esquina frontal-derecha
        { x: largoSump / 2 - t, z: anchoSump / 2 - t, h: alturaFrontal },
        // Esquina trasera-izquierda
        { x: -(largoSump / 2 - t), z: -(anchoSump / 2 - t), h: alturaLateral },
        // Esquina trasera-derecha
        { x: largoSump / 2 - t, z: -(anchoSump / 2 - t), h: alturaLateral }
    ];
    esquinas.forEach(function(esq) {
        const sGeo = new THREE.BoxGeometry(siliconaGrosor, esq.h, siliconaGrosor);
        const sMesh = new THREE.Mesh(sGeo, matSilicona);
        sMesh.position.set(esq.x, t + esq.h / 2, esq.z);
        sumpGroup.add(sMesh);
    });
    
    // Líneas horizontales en base (perímetro interior donde cristales tocan la base)
    // Frontal base
    const sBaseFrontalGeo = new THREE.BoxGeometry(largoSump - 2 * t, siliconaGrosor, siliconaGrosor);
    const sBaseFrontal = new THREE.Mesh(sBaseFrontalGeo, matSilicona);
    sBaseFrontal.position.set(0, t + siliconaGrosor / 2, anchoSump / 2 - t);
    sumpGroup.add(sBaseFrontal);
    // Trasera base
    const sBaseTrasera = new THREE.Mesh(sBaseFrontalGeo.clone(), matSilicona);
    sBaseTrasera.position.set(0, t + siliconaGrosor / 2, -(anchoSump / 2 - t));
    sumpGroup.add(sBaseTrasera);
    // Lateral izquierdo base
    const sBaseLatGeo = new THREE.BoxGeometry(siliconaGrosor, siliconaGrosor, profundidadLat);
    const sBaseLatIzq = new THREE.Mesh(sBaseLatGeo, matSilicona);
    sBaseLatIzq.position.set(-(largoSump / 2 - t), t + siliconaGrosor / 2, 0);
    sumpGroup.add(sBaseLatIzq);
    // Lateral derecho base
    const sBaseLatDer = new THREE.Mesh(sBaseLatGeo.clone(), matSilicona);
    sBaseLatDer.position.set(largoSump / 2 - t, t + siliconaGrosor / 2, 0);
    sumpGroup.add(sBaseLatDer);
    
    // --- JUNTAS SILICONA ETAPAS INTERNAS ---
    // Etapa 1: verticales donde toca frontal, trasera y base
    const xE1 = largoSump / 2 - t / 2 - offsetEtapa1;
    // Verticales etapa1-frontal y etapa1-trasera
    [{z: anchoSump / 2 - t}, {z: -(anchoSump / 2 - t)}].forEach(function(p) {
        const sg = new THREE.BoxGeometry(siliconaGrosor, alturaEtapa1, siliconaGrosor);
        const sm = new THREE.Mesh(sg, matSilicona);
        sm.position.set(xE1, t + alturaEtapa1 / 2, p.z);
        sumpGroup.add(sm);
    });
    // Base etapa1
    const sBaseE1 = new THREE.Mesh(new THREE.BoxGeometry(siliconaGrosor, siliconaGrosor, profundidadLat), matSilicona);
    sBaseE1.position.set(xE1, t + siliconaGrosor / 2, 0);
    sumpGroup.add(sBaseE1);
    
    // Etapa 2: verticales donde toca frontal, trasera y base
    const xE2 = largoSump / 2 - t / 2 - offsetEtapa2;
    [{z: anchoSump / 2 - t}, {z: -(anchoSump / 2 - t)}].forEach(function(p) {
        const sg = new THREE.BoxGeometry(siliconaGrosor, alturaEtapa2, siliconaGrosor);
        const sm = new THREE.Mesh(sg, matSilicona);
        sm.position.set(xE2, t + alturaEtapa2 / 2, p.z);
        sumpGroup.add(sm);
    });
    // Base etapa2
    const sBaseE2 = new THREE.Mesh(new THREE.BoxGeometry(siliconaGrosor, siliconaGrosor, profundidadLat), matSilicona);
    sBaseE2.position.set(xE2, t + siliconaGrosor / 2, 0);
    sumpGroup.add(sBaseE2);
    
    // Etapa 3: horizontales donde toca etapa1, etapa2 y base (levantada 1.5cm)
    // Vertical en contacto con etapa1
    var sgE3v = new THREE.BoxGeometry(siliconaGrosor, alturaEtapa3, siliconaGrosor);
    var smE3v1 = new THREE.Mesh(sgE3v, matSilicona);
    smE3v1.position.set(xE1, t + 0.15 + alturaEtapa3 / 2, zEtapa3);
    sumpGroup.add(smE3v1);
    // Vertical en contacto con etapa2
    var smE3v2 = new THREE.Mesh(sgE3v.clone(), matSilicona);
    smE3v2.position.set(xE2, t + 0.15 + alturaEtapa3 / 2, zEtapa3);
    sumpGroup.add(smE3v2);
    // Base etapa3 (a 1.5cm del suelo)
    var sBaseE3 = new THREE.Mesh(new THREE.BoxGeometry(largoEtapas34, siliconaGrosor, siliconaGrosor), matSilicona);
    sBaseE3.position.set(centroXEtapas34, t + 0.15 + siliconaGrosor / 2, zEtapa3);
    sumpGroup.add(sBaseE3);
    
    // Etapa 4: horizontales donde toca etapa1, etapa2 y base
    var sgE4v = new THREE.BoxGeometry(siliconaGrosor, alturaEtapa4, siliconaGrosor);
    var smE4v1 = new THREE.Mesh(sgE4v, matSilicona);
    smE4v1.position.set(xE1, t + alturaEtapa4 / 2, zEtapa4);
    sumpGroup.add(smE4v1);
    var smE4v2 = new THREE.Mesh(sgE4v.clone(), matSilicona);
    smE4v2.position.set(xE2, t + alturaEtapa4 / 2, zEtapa4);
    sumpGroup.add(smE4v2);
    // Base etapa4
    var sBaseE4 = new THREE.Mesh(new THREE.BoxGeometry(largoEtapas34, siliconaGrosor, siliconaGrosor), matSilicona);
    sBaseE4.position.set(centroXEtapas34, t + siliconaGrosor / 2, zEtapa4);
    sumpGroup.add(sBaseE4);
    
    // --- Posicionar sump ---
    
    const grosorMelamina = 0.19;
    const grosorTubular = 0.35;
    const alturaPies = 0.5;
    
    const posYMarcoInferior = alturaPies + grosorTubular / 2;
    
    // Y de la bandeja (cara superior) en coordenadas del soporte
    const yBandejaSup = posYMarcoInferior + grosorTubular / 2 + grosorMelamina;
    
    let yGlobal;
    let xGlobal = 0;
    let zGlobal = 0.3;

    if (soporteGroup) {
        // Posición Y global: soporte.position.y + yBandejaSup
        // Tanto mesa melamina como estructura forrada bajan 19mm el forrado, compensar siempre
        // +6mm para que el cristal base apoye sobre la bandeja y no se hunda
        yGlobal = soporteGroup.position.y + yBandejaSup - grosorMelamina + 0.06;

        // Posición X: centrada, pero desplazar a la izquierda si hay zona estanca
        if (zonaEstancaActiva) {
            xGlobal = -1.0; // 10cm hacia la izquierda para librar la zona estanca
        }
    } else {
        // Sin soporte/mesa: mostrar debajo de la urna principal para poder visualizarlo
        yGlobal = -(alturaLateral + 0.4);
        zGlobal = 0;
    }
    
    sumpGroup.position.set(xGlobal, yGlobal, zGlobal);
    
    sumpGroup.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
    window.threeScene.add(sumpGroup);
    console.log(`🐠 Sump 3D creado: ${(largoSump * 10).toFixed(0)}cm × ${(anchoSump * 10).toFixed(0)}cm, cristal ${grosorMm}mm, frontal 40cm, laterales 50cm${zonaEstancaActiva ? ' [desplazado -7cm por zona estanca]' : ''}${viniloSumpCheck ? ' [vinilo ' + colorViniloSump + ']' : ''}`);
}

/**
 * Eliminar sump de la escena
 */
function eliminarSump3D() {
    if (sumpGroup && window.threeScene) {
        window.threeScene.remove(sumpGroup);
        sumpGroup.traverse(function(child) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(function(mat) { mat.dispose(); });
                } else {
                    child.material.dispose();
                }
            }
        });
        sumpGroup = null;
    }
}

/**
 * Actualizar sump 3D (llamado desde checkbox)
 */
window.actualizarSump3D = function() {
    const largo = parseFloat(document.getElementById('largo')?.value) || 120;
    const ancho = parseFloat(document.getElementById('ancho')?.value) || 50;
    crearSump3D(largo, ancho);
};

/**
 * Eliminar forrado melamina de la escena
 */
/**
 * Guarda desglose en localStorage para que contacto.html lo incluya en email
 * Se llama cuando usuario hace click en "Enviar PDF por correo"
 */
function enviarPresupuestoDetallado() {
    try {
        // Obtener precio del DOM
        const precioEl = document.getElementById('precioFinal');
        const precioTexto = precioEl ? precioEl.textContent.replace(/[^\d.,]/g, '').replace(',', '.') : '0';
        const precio = parseFloat(precioTexto) || 0;
        
        // Calcular subtotal e IVA (inverso: si total es 336.04 con 21% IVA, subtotal = 336.04 / 1.21)
        const subtotal = precio / 1.21;
        const iva = precio - subtotal;
        
        // Crear desglose simple
        const desglose = {
            acuarioBase: {
                descripcion: 'Acuario personalizado',
                precio: Math.round(subtotal * 100) / 100
            },
            items: [],
            subtotal: Math.round(subtotal * 100) / 100,
            iva: Math.round(iva * 100) / 100,
            total: precio
        };
        
        // Guardar en localStorage para contacto.html
        localStorage.setItem('presupuesto-detallado', JSON.stringify(desglose));
        console.log('✅ Desglose guardado:', desglose);
        
    } catch (error) {
        console.error('❌ Error al guardar desglose:', error);
    }
}

function eliminarForradoMelamina3D() {
    if (forradoGroup && window.threeScene) {
        window.threeScene.remove(forradoGroup);
        forradoGroup.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        forradoGroup = null;
        puertasPivots = [];
    }
}

/**
 * Aplicar estado abierto/cerrado a las puertas
 */
function aplicarEstadoPuertas(abrir) {
    const angulo = abrir ? (110 * Math.PI / 180) : 0; // 110° en radianes
    
    puertasPivots.forEach(pivot => {
        const data = pivot.userData;
        
        if (data.tipo === 'puertaLateral') {
            // Lateral derecho como puerta (zona estanca): abre hacia fuera
            pivot.rotation.y = abrir ? angulo : 0;
        } else if (data.desmontable) {
            // Puertas centrales: se quitan (invisible al abrir)
            pivot.visible = !abrir;
        } else {
            // Puertas con bisagra: rotar
            if (data.numTotal === 1) {
                pivot.rotation.y = abrir ? -angulo : 0;
            } else if (data.indice === 0) {
                pivot.rotation.y = abrir ? -angulo : 0;
            } else if (data.indice === data.numTotal - 1) {
                pivot.rotation.y = abrir ? angulo : 0;
            }
        }
    });
    
    puertasAbiertas = abrir;
    console.log(`🚪 Puertas ${abrir ? 'abiertas (110°)' : 'cerradas'}`);
}

/**
 * Toggle abrir/cerrar puertas (llamado desde checkbox en UI)
 */
window.aplicarEstadoPuertas = aplicarEstadoPuertas;
window.togglePuertas3D = function() {
    const checkbox = document.getElementById('checkPuertas3D');
    if (checkbox) {
        aplicarEstadoPuertas(checkbox.checked);
    }
};

/**
 * Actualizar forrado melamina en 3D
 * Se llama cuando cambia el forrado, mesa, o colores
 */
window.actualizarForradoMelamina3D = function() {
    const forradoActivo = document.getElementById('forradoEstructuraMelamina')?.checked && 
                          document.getElementById('colorForradoEstructura')?.value !== '';
    const mesaActiva = document.getElementById('checkMesaMelamina')?.checked;
    
    if (forradoActivo || mesaActiva) {
        const largo = parseFloat(document.getElementById('largo')?.value) || 120;
        const ancho = parseFloat(document.getElementById('ancho')?.value) || 50;
        const alto = parseFloat(document.getElementById('alto')?.value) || 60;
        
        // Si es mesa melamina y no hay estructura, crear estructura interna invisible
        if (mesaActiva && !soporteGroup) {
            crearEstructuraMetalica(largo, ancho, alto);
            // Hacer la estructura invisible (la melamina la cubre)
            if (soporteGroup) {
                soporteGroup.traverse((child) => {
                    if (child.isMesh) child.visible = false;
                });
            }
        }
        
        crearForradoMelamina3D(largo, ancho);
        
        // Actualizar sump si está activo
        crearSump3D(largo, ancho);
        
        // Actualizar iluminación LED si está activa (también funciona con mesa melamina)
        crearIluminacionLed3D(largo, ancho);
        
        // Mostrar checkbox de puertas
        const controlPuertas = document.getElementById('controlPuertas3D');
        if (controlPuertas) controlPuertas.style.display = 'flex';
    } else {
        eliminarForradoMelamina3D();

        const sumpActivo = document.getElementById('checkSump')?.checked || false;
        const largo = parseFloat(document.getElementById('largo')?.value) || 120;
        const ancho = parseFloat(document.getElementById('ancho')?.value) || 50;
        if (sumpActivo) {
            crearSump3D(largo, ancho);
        } else {
            eliminarSump3D();
        }
        
        // Ocultar checkbox de puertas
        const controlPuertas = document.getElementById('controlPuertas3D');
        if (controlPuertas) controlPuertas.style.display = 'none';
        
        // Resetear estado
        puertasAbiertas = false;
        const checkbox = document.getElementById('checkPuertas3D');
        if (checkbox) checkbox.checked = false;
    }
};

// Hacer funciones disponibles globalmente
window.toggleSeccionSoporte = toggleSeccionSoporte;
window.actualizarOpcionesAcabado = actualizarOpcionesAcabado;

// Inicializar event listeners para acabados cuando cargue el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', actualizarOpcionesAcabado);
} else {
    actualizarOpcionesAcabado();
}
