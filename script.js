// ===== TRON 3D CITY =====
let scene, camera, renderer, controls;
let city = [];
let isos = [];
let programs = [];
let lightCycles = [];

init();

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000022, 0.001);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x00ffff, 1);
    directionalLight.position.set(0, 1, 0);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(500, 100, 0x00ffff, 0x00ffff);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Create city
    createTronCity();

    // Create initial inhabitants
    createISOs(10);
    createPrograms(20);
    createLightCycles(5);

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('click', spawnISO);

    // Start animation
    animate();
}

function createTronCity() {
    // Base platform
    const baseGeometry = new THREE.BoxGeometry(200, 5, 200);
    const baseMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x111111,
        emissive: 0x003333,
        emissiveIntensity: 0.5
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -2.5;
    base.receiveShadow = true;
    scene.add(base);

    // Towers
    for (let i = 0; i < 15; i++) {
        const height = 20 + Math.random() * 80;
        const towerGeometry = new THREE.CylinderGeometry(5, 8, height, 6);
        const towerMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            emissive: 0x006666,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8
        });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.x = (Math.random() - 0.5) * 180;
        tower.position.z = (Math.random() - 0.5) * 180;
        tower.position.y = height / 2;
        tower.castShadow = true;
        scene.add(tower);
        city.push(tower);

        // Add glowing rings
        const ringGeometry = new THREE.TorusGeometry(6, 0.5, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7
        });
        for (let r = 1; r < 4; r++) {
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(tower.position);
            ring.position.y = r * (height / 4);
            ring.rotation.x = Math.PI / 2;
            scene.add(ring);
            city.push(ring);
        }
    }

    // Bridges between towers
    for (let i = 0; i < 10; i++) {
        const bridgeGeometry = new THREE.BoxGeometry(40, 1, 5);
        const bridgeMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            emissive: 0x00ffff,
            emissiveIntensity: 0.2
        });
        const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        
        // Connect two random towers
        const tower1 = city[Math.floor(Math.random() * city.length)];
        const tower2 = city[Math.floor(Math.random() * city.length)];
        
        if (tower1 && tower2 && tower1 !== tower2) {
            bridge.position.x = (tower1.position.x + tower2.position.x) / 2;
            bridge.position.y = (tower1.position.y + tower2.position.y) / 2;
            bridge.position.z = (tower1.position.z + tower2.position.z) / 2;
            
            // Rotate to face the other tower
            bridge.lookAt(tower2.position);
            bridge.rotation.x = Math.PI / 2;
            
            // Scale to distance
            const distance = tower1.position.distanceTo(tower2.position);
            bridge.scale.x = distance / 40;
            
            bridge.receiveShadow = true;
            scene.add(bridge);
            city.push(bridge);
        }
    }
}

function createISOs(count) {
    for (let i = 0; i < count; i++) {
        const isoGeometry = new THREE.IcosahedronGeometry(2, 0);
        const isoMaterial = new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            emissive: 0x990099,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        const iso = new THREE.Mesh(isoGeometry, isoMaterial);
        
        // Random position above ground
        iso.position.x = (Math.random() - 0.5) * 180;
        iso.position.z = (Math.random() - 0.5) * 180;
        iso.position.y = 10 + Math.random() * 50;
        
        // Animation properties
        iso.userData = {
            speed: 0.1 + Math.random() * 0.3,
            direction: new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize()
        };
        
        iso.castShadow = true;
        scene.add(iso);
        isos.push(iso);
    }
    updateHUD();
}

function spawnISO() {
    createISOs(1);
}

function createPrograms(count) {
    const programTypes = [
        { color: 0x00ffff, shape: 'box' },
        { color: 0x00ff00, shape: 'cylinder' },
        { color: 0xffff00, shape: 'cone' }
    ];
    
    for (let i = 0; i < count; i++) {
        const type = programTypes[Math.floor(Math.random() * programTypes.length)];
        let geometry;
        
        switch(type.shape) {
            case 'box':
                geometry = new THREE.BoxGeometry(3, 3, 3);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 6);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(2, 4, 4);
                break;
        }
        
        const material = new THREE.MeshPhongMaterial({
            color: type.color,
            emissive: type.color,
            emissiveIntensity: 0.3
        });
        
        const program = new THREE.Mesh(geometry, material);
        
        // Position on streets or platforms
        program.position.x = (Math.random() - 0.5) * 180;
        program.position.z = (Math.random() - 0.5) * 180;
        program.position.y = 2.5;
        
        // Random rotation
        program.rotation.y = Math.random() * Math.PI * 2;
        
        program.castShadow = true;
        scene.add(program);
        programs.push(program);
    }
    updateHUD();
}

function createLightCycles(count) {
    for (let i = 0; i < count; i++) {
        const cycleGeometry = new THREE.BoxGeometry(8, 2, 3);
        const cycleMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x0066ff,
            emissiveIntensity: 0.8
        });
        const cycle = new THREE.Mesh(cycleGeometry, cycleMaterial);
        
        // Position on grid
        cycle.position.x = (Math.random() - 0.5) * 180;
        cycle.position.z = (Math.random() - 0.5) * 180;
        cycle.position.y = 1.5;
        
        // Trail
        const trailGeometry = new THREE.BoxGeometry(0.5, 0.1, 20);
        const trailMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.z = -10;
        cycle.add(trail);
        
        // Movement properties
        cycle.userData = {
            speed: 0.5 + Math.random(),
            direction: new THREE.Vector3(
                Math.random() - 0.5,
                0,
                Math.random() - 0.5
            ).normalize(),
            trailLength: 20,
            trailPieces: []
        };
        
        cycle.castShadow = true;
        scene.add(cycle);
        lightCycles.push(cycle);
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update ISOs
    isos.forEach(iso => {
        iso.position.add(iso.userData.direction.clone().multiplyScalar(iso.userData.speed));
        
        // Bounce off boundaries
        if (iso.position.x < -90 || iso.position.x > 90) {
            iso.userData.direction.x *= -1;
        }
        if (iso.position.y < 5 || iso.position.y > 80) {
            iso.userData.direction.y *= -1;
        }
        if (iso.position.z < -90 || iso.position.z > 90) {
            iso.userData.direction.z *= -1;
        }
        
        // Random direction changes
        if (Math.random() < 0.01) {
            iso.userData.direction.add(
                new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize().multiplyScalar(0.1)
            ).normalize();
        }
    });
    
    // Update Light Cycles
    lightCycles.forEach(cycle => {
        cycle.position.add(cycle.userData.direction.clone().multiplyScalar(cycle.userData.speed));
        
        // Turn at boundaries
        if (cycle.position.x < -90 || cycle.position.x > 90) {
            cycle.userData.direction.x *= -1;
            cycle.lookAt(
                cycle.position.clone().add(cycle.userData.direction)
            );
        }
        if (cycle.position.z < -90 || cycle.position.z > 90) {
            cycle.userData.direction.z *= -1;
            cycle.lookAt(
                cycle.position.clone().add(cycle.userData.direction)
            );
        }
        
        // Random turns
        if (Math.random() < 0.005) {
            cycle.userData.direction.x = Math.random() - 0.5;
            cycle.userData.direction.z = Math.random() - 0.5;
            cycle.userData.direction.normalize();
            cycle.lookAt(
                cycle.position.clone().add(cycle.userData.direction)
            );
        }
    });
    
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateHUD() {
    document.getElementById('iso-count').textContent = isos.length;
    document.getElementById('program-count').textContent = programs.length;
    document.getElementById('power-level').textContent = 
        `${Math.min(100, Math.floor(isos.length * 10))}%`;
}
