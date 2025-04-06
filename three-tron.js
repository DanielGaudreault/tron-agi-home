let scene, camera, renderer, controls;
let agiCore, grid;
let isInitialized = false;

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
        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        document.getElementById('tron-container').appendChild(renderer.domElement);

        // Add orbit controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 30;
        controls.maxDistance = 200;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x222222);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x00f0ff, 1);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Create grid
        createGrid();
        
        // Create AGI core
        createAGICore();
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
        
        // Start animation loop
        animate();
        
        isInitialized = true;
        
    } catch (error) {
        console.error("3D initialization failed:", error);
        document.getElementById('loading-screen').innerHTML = `
            <div class="error-screen">
                <div class="error-code">RENDER ERROR 0x${Math.floor(Math.random() * 10000).toString(16)}</div>
                <div class="error-message">3D system failed to initialize</div>
                <button class="retry-btn" onclick="window.location.reload()">RETRY</button>
            </div>
        `;
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
    const coreGeometry = new THREE.IcosahedronGeometry(8, 2);
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
    const innerGeometry = new THREE.SphereGeometry(4, 16, 16);
    const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.3
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    agiCore.add(innerSphere);
}

function animate() {
    if (!isInitialized) return;
    
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Animate AGI core
    if (agiCore) {
        agiCore.rotation.x += 0.005;
        agiCore.rotation.y += 0.01;
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    if (!isInitialized) return;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Make functions available globally
window.initTronEnvironment = initTronEnvironment;
window.onWindowResize = onWindowResize;
