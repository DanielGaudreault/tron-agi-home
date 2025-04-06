// Global variables
let scene, camera, renderer, controls;
let agiCore, grid, particles = [];
let clock = new THREE.Clock();
let isInitialized = false;

// Initialize TRON environment
function initTronEnvironment() {
    try {
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050510);
        scene.fog = new THREE.FogExp2(0x050510, 0.001);

        // Create camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 50, 100);

        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('tron-container').appendChild(renderer.domElement);

        // Add orbit controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 30;
        controls.maxDistance = 200;
        controls.maxPolarAngle = Math.PI * 0.9;
        controls.minPolarAngle = Math.PI * 0.1;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x222222);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x00f0ff, 1);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        scene.add(directionalLight);

        // Create grid
        createGrid();
        
        // Create AGI core
        createAGICore();
        
        // Create particles
        createParticles();
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
        
        // Start animation loop
        animate();
        
        isInitialized = true;
        
    } catch (error) {
        console.error("Failed to initialize 3D environment:", error);
        showSystemError("3D rendering initialization failed");
    }
}

function createGrid() {
    const size = 200;
    const divisions = 50;
    grid = new THREE.GridHelper(size, divisions, 0x00f0ff, 0x00f0ff);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    grid.position.y = -5;
    scene.add(grid);

    // Add pulse animation
    function animateGrid() {
        if (!isInitialized) return;
        grid.material.opacity = 0.1 + 0.05 * Math.sin(Date.now() * 0.001);
        requestAnimationFrame(animateGrid);
    }
    animateGrid();
}

function createAGICore() {
    // Main core structure
    const coreGeometry = new THREE.IcosahedronGeometry(8, 3);
    const coreMaterial = new THREE.MeshPhongMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.5,
        shininess: 100,
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });
    agiCore = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(agiCore);

    // Inner energy sphere
    const innerGeometry = new THREE.SphereGeometry(4, 32, 32);
    const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.3
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    agiCore.add(innerSphere);

    // Energy particles
    const particleCount = 15;
    const particleGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.7
    });
    
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
        
        // Random position on sphere surface
        const radius = 10 + Math.random() * 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        particle.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );
        
        particle.userData = {
            speed: 0.5 + Math.random(),
            direction: new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize(),
            baseRadius: radius,
            angle: Math.random() * Math.PI * 2
        };
        
        agiCore.add(particle);
        particles.push(particle);
    }
}

function createParticles() {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    
    const color = new THREE.Color(0x00f0ff);
    
    for (let i = 0; i < particleCount; i++) {
        // Random positions in a sphere
        const radius = 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        
        sizes[i] = 1 + Math.random() * 2;
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        particles.push({
            position: new THREE.Vector3(
                positions[i * 3],
                positions[i * 3 + 1],
                positions[i * 3 + 2]
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            )
        });
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });
    
    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}

function animate() {
    if (!isInitialized) return;
    
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Update controls
    controls.update();
    
    // Animate AGI core
    if (agiCore) {
        agiCore.rotation.x += 0.005;
        agiCore.rotation.y += 0.01;
        
        // Animate core particles
        particles.forEach(particle => {
            if (particle.parent === agiCore && particle.userData) {
                // Orbit animation
                particle.userData.angle += particle.userData.speed * delta;
                
                particle.position.x = particle.userData.baseRadius * Math.sin(particle.userData.angle);
                particle.position.z = particle.userData.baseRadius * Math.cos(particle.userData.angle);
                
                // Pulsing scale
                const scale = 0.5 + 0.5 * Math.sin(Date.now() * 0.001 * particle.userData.speed);
                particle.scale.set(scale, scale, scale);
            }
        });
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    if (!isInitialized) return;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function showSystemError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'system-error';
    errorElement.innerHTML = `
        <div class="error-code">SYSTEM ERROR 0x${Math.floor(Math.random() * 10000).toString(16)}</div>
        <div class="error-message">${message}</div>
    `;
    document.getElementById('tron-container').appendChild(errorElement);
}

// Make functions available globally
window.initTronEnvironment = initTronEnvironment;
window.onWindowResize = onWindowResize;
