let scene, camera, renderer, controls;
let agiCore, grid, particles = [];
let clock = new THREE.Clock();

function initTronEnvironment() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, 0.001);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('tron-container').appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 30;
    controls.maxDistance = 200;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x00ffff, 1);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Grid
    createGrid();
    
    // AGI Core
    createAGICore();
    
    // Particles
    createParticles();
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        const delta = clock.getDelta();
        
        // Update controls
        controls.update();
        
        // Animate core
        agiCore.rotation.x += 0.005;
        agiCore.rotation.y += 0.01;
        
        // Animate particles
        updateParticles(delta);
        
        renderer.render(scene, camera);
    }
    
    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function createGrid() {
    const gridSize = 200;
    const gridDivisions = 50;
    grid = new THREE.GridHelper(gridSize, gridDivisions, 0x00ffff, 0x00ffff);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    grid.position.y = -5;
    scene.add(grid);

    // Add pulse animation
    function animateGrid() {
        grid.material.opacity = 0.1 + 0.05 * Math.sin(Date.now() * 0.001);
        requestAnimationFrame(animateGrid);
    }
    animateGrid();
}

function createAGICore() {
    // Main core
    const coreGeometry = new THREE.IcosahedronGeometry(8, 3);
    const coreMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5,
        shininess: 100,
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });
    agiCore = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(agiCore);

    // Inner core
    const innerCoreGeometry = new THREE.SphereGeometry(4, 32, 32);
    const innerCoreMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3
    });
    const innerCore = new THREE.Mesh(innerCoreGeometry, innerCoreMaterial);
    agiCore.add(innerCore);

    // Energy pulses
    const pulseGeometry = new THREE.SphereGeometry(1, 16, 16);
    const pulseMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.7
    });
    
    for (let i = 0; i < 5; i++) {
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial.clone());
        pulse.scale.set(0.1, 0.1, 0.1);
        pulse.position.set(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15
        );
        pulse.userData = {
            speed: 0.5 + Math.random() * 0.5,
            scale: 5 + Math.random() * 5,
            direction: new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize()
        };
        agiCore.add(pulse);
        particles.push(pulse);
    }
}

function createParticles() {
    const particleCount = 100;
    const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.7
    });

    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
        particle.position.set(
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200
        );
        particle.userData = {
            speed: 0.1 + Math.random() * 0.5,
            direction: new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize()
        };
        scene.add(particle);
        particles.push(particle);
    }
}

function updateParticles(delta) {
    particles.forEach(particle => {
        if (!particle.userData) return;
        
        // Update position
        particle.position.x += particle.userData.direction.x * particle.userData.speed * delta * 60;
        particle.position.y += particle.userData.direction.y * particle.userData.speed * delta * 60;
        particle.position.z += particle.userData.direction.z * particle.userData.speed * delta * 60;
        
        // Bounce off imaginary walls
        if (Math.abs(particle.position.x) > 100) {
            particle.userData.direction.x *= -1;
            particle.position.x = Math.sign(particle.position.x) * 100;
        }
        if (Math.abs(particle.position.y) > 100) {
            particle.userData.direction.y *= -1;
            particle.position.y = Math.sign(particle.position.y) * 100;
        }
        if (Math.abs(particle.position.z) > 100) {
            particle.userData.direction.z *= -1;
            particle.position.z = Math.sign(particle.position.z) * 100;
        }
        
        // Pulse animation for core particles
        if (particle.parent === agiCore && particle.userData.scale) {
            const scale = particle.userData.scale * (0.5 + 0.5 * Math.sin(Date.now() * 0.001 * particle.userData.speed));
            particle.scale.set(scale, scale, scale);
        }
    });
}
