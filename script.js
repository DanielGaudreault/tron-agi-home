// ================ TRON ULTIMATE ================
// The most advanced browser-based Tron experience

// Game Configuration
const CONFIG = {
    // World settings
    gridSize: 200,
    cellSize: 2,
    gridColor: 0x003333,
    lightColor: 0x00ffff,
    buildingDensity: 0.2,
    
    // Player settings
    playerColors: [0x00ffff, 0xff00ff, 0xffff00, 0xff8800],
    moveSpeed: 0.2,
    turnSpeed: 0.08,
    wallHeight: 3,
    wallOpacity: 0.9,
    trailLength: 10,
    
    // Camera settings
    fov: 70,
    cameraDistance: 40,
    cameraHeight: 25,
    cameraAngle: Math.PI / 4,
    
    // Graphics settings
    bloomStrength: 1.5,
    bloomRadius: 0.8,
    bloomThreshold: 0.4,
    exposure: 1.2,
    
    // Game rules
    wallInterval: 100,
    gridBoundary: 1.0,
    buildingPadding: 1.3,
    crashTimeout: 1000
};

// Game State
const gameState = {
    // Core state
    players: {},
    walls: [],
    buildings: [],
    myPlayerId: null,
    playerName: "",
    playerColor: 0x00ffff,
    gameStarted: false,
    gameTime: 0,
    
    // Technical state
    clock: new THREE.Clock(),
    lastWallTime: 0,
    gridBoundary: CONFIG.gridSize/2 - CONFIG.gridBoundary,
    resizeDebounce: null,
    
    // DOM elements
    elements: {
        loadingScreen: document.getElementById('loading-screen'),
        startScreen: document.getElementById('start-screen'),
        gameUI: document.getElementById('game-ui'),
        playerNameInput: document.getElementById('player-name'),
        enterButton: document.getElementById('enter-button'),
        colorOptions: document.querySelectorAll('.color-option'),
        playerNameDisplay: document.querySelector('.player-name'),
        playerScore: document.querySelector('.player-score'),
        playerCount: document.getElementById('player-count'),
        playerPosition: document.getElementById('player-position'),
        gameTime: document.getElementById('game-time')
    }
};

// Three.js Variables
let scene, camera, renderer, composer, bloomPass;
let grid, directionalLight, hemisphereLight;
let effectController = {
    bloomStrength: CONFIG.bloomStrength,
    bloomRadius: CONFIG.bloomRadius,
    bloomThreshold: CONFIG.bloomThreshold
};

// Initialize the game
class TronGame {
    constructor() {
        this.initThreeJS();
        this.initWorld();
        this.initEventListeners();
        this.animate();
    }
    
    initThreeJS() {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000011);
        scene.fog = new THREE.FogExp2(0x000822, 0.002);
        
        // Camera
        camera = new THREE.PerspectiveCamera(
            CONFIG.fov,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = CONFIG.exposure;
        document.body.appendChild(renderer.domElement);
        
        // Post-processing
        this.initPostProcessing();
    }
    
    initPostProcessing() {
        const renderScene = new THREE.RenderPass(scene, camera);
        
        bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            CONFIG.bloomStrength,
            CONFIG.bloomRadius,
            CONFIG.bloomThreshold
        );
        
        composer = new THREE.EffectComposer(renderer);
        composer.addPass(renderScene);
        composer.addPass(bloomPass);
    }
    
    initWorld() {
        // Lighting
        this.setupLighting();
        
        // Create grid
        grid = this.createGrid();
        scene.add(grid);
        
        // Create buildings
        this.createBuildings();
        
        // Initial camera position
        camera.position.set(0, CONFIG.cameraHeight, CONFIG.cameraDistance);
        camera.lookAt(0, 0, 0);
        
        // Simulate loading complete
        setTimeout(() => {
            gameState.elements.loadingScreen.style.opacity = 0;
            setTimeout(() => {
                gameState.elements.loadingScreen.style.display = 'none';
                gameState.elements.startScreen.classList.add('active');
            }, 1000);
        }, 2000);
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x222233);
        scene.add(ambientLight);
        
        // Hemisphere light
        hemisphereLight = new THREE.HemisphereLight(0x00aaff, 0xffaa00, 0.3);
        scene.add(hemisphereLight);
        
        // Directional light (sun)
        directionalLight = new THREE.DirectionalLight(0x00ffff, 1.5);
        directionalLight.position.set(1, 1, 0.5).normalize();
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.bias = -0.0001;
        scene.add(directionalLight);
        
        // Light helper (for debugging)
        // const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
        // scene.add(lightHelper);
    }
    
    createGrid() {
        const group = new THREE.Group();
        const halfSize = CONFIG.gridSize / 2;
        
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(
            CONFIG.gridSize * CONFIG.cellSize,
            CONFIG.gridSize * CONFIG.cellSize,
            CONFIG.gridSize,
            CONFIG.gridSize
        );
        
        // Custom shader material for grid
        const groundMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color1: { value: new THREE.Color(0x001122) },
                color2: { value: new THREE.Color(0x003344) },
                lineColor: { value: new THREE.Color(0x00ffff) },
                lineWidth: { value: 0.05 },
                gridSize: { value: CONFIG.cellSize }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color1;
                uniform vec3 color2;
                uniform vec3 lineColor;
                uniform float lineWidth;
                uniform float gridSize;
                varying vec2 vUv;
                
                void main() {
                    vec2 coord = vUv * gridSize;
                    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
                    float line = min(grid.x, grid.y);
                    float alpha = 1.0 - min(line, 1.0);
                    
                    // Checkerboard pattern
                    float check = mod(floor(coord.x) + floor(coord.y), 2.0);
                    vec3 baseColor = mix(color1, color2, check);
                    
                    // Combine with grid lines
                    vec3 color = mix(baseColor, lineColor, alpha * 0.5);
                    
                    // Add glow effect
                    float glow = smoothstep(0.0, 0.2, alpha);
                    color += lineColor * glow * 0.3;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        group.add(ground);
        
        // Grid border
        const borderGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(
            CONFIG.gridSize * CONFIG.cellSize,
            1,
            CONFIG.gridSize * CONFIG.cellSize
        ));
        const borderMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            linewidth: 2
        });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        border.position.y = 0.01;
        group.add(border);
        
        return group;
    }
    
    createBuildings() {
        const halfSize = CONFIG.gridSize / 2;
        const buildingCount = Math.floor(CONFIG.gridSize * CONFIG.gridSize * CONFIG.buildingDensity / 100);
        
        for (let i = 0; i < buildingCount; i++) {
            // Find valid position (not too close to center or other buildings)
            let x, z, validPosition;
            let attempts = 0;
            
            do {
                validPosition = true;
                x = Math.floor(Math.random() * CONFIG.gridSize - halfSize);
                z = Math.floor(Math.random() * CONFIG.gridSize - halfSize);
                
                // Don't place near center
                if (Math.abs(x) < 20 && Math.abs(z) < 20) {
                    validPosition = false;
                    continue;
                }
                
                // Check distance to other buildings
                for (const building of gameState.buildings) {
                    const dx = x - building.x;
                    const dz = z - building.z;
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    
                    if (distance < 5) { // Minimum distance between buildings
                        validPosition = false;
                        break;
                    }
                }
                
                attempts++;
                if (attempts > 100) break; // Prevent infinite loop
            } while (!validPosition);
            
            if (!validPosition) continue;
            
            // Building dimensions
            const width = Math.floor(Math.random() * 6) + 3;
            const depth = Math.floor(Math.random() * 6) + 3;
            const height = Math.floor(Math.random() * 15) + 5;
            const floors = Math.floor(height / 3);
            const color = CONFIG.buildingColors[Math.floor(Math.random() * CONFIG.buildingColors.length)];
            
            // Create building
            const building = this.createBuilding(x, z, width, depth, height, floors, color);
            scene.add(building);
            
            // Add to game state
            gameState.buildings.push({
                x, z, width, depth, height,
                mesh: building
            });
        }
    }
    
    createBuilding(x, z, width, depth, height, floors, color) {
        const group = new THREE.Group();
        const buildingColor = new THREE.Color(color);
        
        // Main structure
        const geometry = new THREE.BoxGeometry(
            width * CONFIG.cellSize,
            height * CONFIG.cellSize,
            depth * CONFIG.cellSize
        );
        
        // Create slightly darker color for sides
        const sideColor = buildingColor.clone();
        sideColor.multiplyScalar(0.8);
        
        const materials = [
            new THREE.MeshPhongMaterial({ color: sideColor }), // right
            new THREE.MeshPhongMaterial({ color: sideColor }), // left
            new THREE.MeshPhongMaterial({ color: buildingColor }), // top
            new THREE.MeshPhongMaterial({ color: buildingColor }), // bottom
            new THREE.MeshPhongMaterial({ color: sideColor }), // front
            new THREE.MeshPhongMaterial({ color: sideColor })  // back
        ];
        
        const building = new THREE.Mesh(geometry, materials);
        building.position.set(
            x * CONFIG.cellSize,
            (height * CONFIG.cellSize) / 2,
            z * CONFIG.cellSize
        );
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        
        // Add windows
        const windowColor = 0x00ffff;
        const windowSize = 0.8;
        const windowSpacing = 1.2;
        
        for (let floor = 1; floor <= floors; floor++) {
            const floorHeight = (floor / floors) * height * CONFIG.cellSize - (CONFIG.cellSize * 0.5);
            
            // Front and back windows
            for (let w = -width/2 + 0.5; w <= width/2 - 0.5; w += windowSpacing) {
                // Front
                const frontWindow = this.createWindow(
                    w * CONFIG.cellSize,
                    floorHeight,
                    (-depth/2 + 0.1) * CONFIG.cellSize,
                    windowSize,
                    windowColor
                );
                group.add(frontWindow);
                
                // Back
                const backWindow = this.createWindow(
                    w * CONFIG.cellSize,
                    floorHeight,
                    (depth/2 - 0.1) * CONFIG.cellSize,
                    windowSize,
                    windowColor
                );
                group.add(backWindow);
            }
            
            // Side windows (skip corners)
            for (let d = -depth/2 + 1; d <= depth/2 - 1; d += windowSpacing) {
                // Left
                const leftWindow = this.createWindow(
                    (-width/2 + 0.1) * CONFIG.cellSize,
                    floorHeight,
                    d * CONFIG.cellSize,
                    windowSize,
                    windowColor,
                    true
                );
                group.add(leftWindow);
                
                // Right
                const rightWindow = this.createWindow(
                    (width/2 - 0.1) * CONFIG.cellSize,
                    floorHeight,
                    d * CONFIG.cellSize,
                    windowSize,
                    windowColor,
                    true
                );
                group.add(rightWindow);
            }
        }
        
        // Add neon edges
        const edges = new THREE.EdgesGeometry(geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: CONFIG.lightColor,
            linewidth: 2
        });
        const edgesMesh = new THREE.LineSegments(edges, edgeMaterial);
        edgesMesh.position.copy(building.position);
        group.add(edgesMesh);
        
        // Add roof details
        if (height > 10) {
            const roofGeometry = new THREE.CylinderGeometry(
                width * CONFIG.cellSize * 0.3,
                width * CONFIG.cellSize * 0.7,
                CONFIG.cellSize * 2,
                6
            );
            const roofMaterial = new THREE.MeshPhongMaterial({
                color: buildingColor,
                emissive: 0x111111
            });
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(
                x * CONFIG.cellSize,
                height * CONFIG.cellSize + CONFIG.cellSize,
                z * CONFIG.cellSize
            );
            roof.rotation.x = Math.PI / 2;
            group.add(roof);
            
            // Roof antenna
            const antennaGeometry = new THREE.CylinderGeometry(0.1, 0.1, height * 0.3, 8);
            const antennaMaterial = new THREE.MeshPhongMaterial({
                color: 0x888888,
                emissive: 0x00ffff,
                emissiveIntensity: 0.3
            });
            const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
            antenna.position.set(
                x * CONFIG.cellSize,
                height * CONFIG.cellSize + height * 0.15 + CONFIG.cellSize * 2,
                z * CONFIG.cellSize
            );
            group.add(antenna);
        }
        
        return group;
    }
    
    createWindow(x, y, z, size, color, rotate = false) {
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const window = new THREE.Mesh(geometry, material);
        window.position.set(x, y, z);
        
        if (rotate) {
            window.rotation.y = Math.PI / 2;
        } else {
            window.rotation.x = Math.PI / 2;
        }
        
        return window;
    }
    
    createPlayerModel(color) {
        const group = new THREE.Group();
        const playerColor = new THREE.Color(color);
        const emissiveColor = playerColor.clone().multiplyScalar(0.7);
        
        // Body (armored suit)
        const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.6, 2.2, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: playerColor,
            emissive: emissiveColor,
            emissiveIntensity: 0.6,
            shininess: 100,
            flatShading: true
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        body.castShadow = true;
        group.add(body);
        
        // Chest plate
        const chestGeometry = new THREE.SphereGeometry(0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const chestMaterial = new THREE.MeshPhongMaterial({
            color: playerColor,
            emissive: emissiveColor,
            emissiveIntensity: 0.7,
            flatShading: true
        });
        const chest = new THREE.Mesh(chestGeometry, chestMaterial);
        chest.position.z = 0.8;
        chest.rotation.x = Math.PI / 2;
        group.add(chest);
        
        // Head (helmet)
        const headGeometry = new THREE.DodecahedronGeometry(0.7, 1);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: playerColor,
            emissive: emissiveColor,
            emissiveIntensity: 0.8,
            flatShading: true
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.z = 1.5;
        group.add(head);
        
        // Visor
        const visorGeometry = new THREE.CircleGeometry(0.4, 8);
        const visorMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.9
        });
        const visor = new THREE.Mesh(visorGeometry, visorMaterial);
        visor.position.z = 1.5 + 0.71;
        visor.rotation.x = Math.PI / 2;
        group.add(visor);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 6);
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.8, 0, 0.5);
        leftArm.rotation.z = Math.PI / 3;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.8, 0, 0.5);
        rightArm.rotation.z = -Math.PI / 3;
        group.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 6);
        const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        leftLeg.position.set(-0.4, 0, -0.8);
        leftLeg.rotation.x = Math.PI / 6;
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        rightLeg.position.set(0.4, 0, -0.8);
        rightLeg.rotation.x = Math.PI / 6;
        group.add(rightLeg);
        
        // Light trail (particle system)
        const trailParticles = 20;
        const trailGeometry = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(trailParticles * 3);
        const trailColors = new Float32Array(trailParticles * 3);
        
        for (let i = 0; i < trailParticles; i++) {
            const i3 = i * 3;
            trailPositions[i3] = 0;
            trailPositions[i3 + 1] = 0;
            trailPositions[i3 + 2] = -1 - (i * 0.2);
            
            const fade = 1 - (i / trailParticles);
            trailColors[i3] = playerColor.r * fade;
            trailColors[i3 + 1] = playerColor.g * fade;
            trailColors[i3 + 2] = playerColor.b * fade;
        }
        
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
        trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
        
        const trailMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        
        const trail = new THREE.Points(trailGeometry, trailMaterial);
        group.add(trail);
        group.userData.trail = trail;
        
        // Identity disk (on back)
        const diskGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 32);
        const diskMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            emissive: 0x00ffff,
            emissiveIntensity: 0.3
        });
        const disk = new THREE.Mesh(diskGeometry, diskMaterial);
        disk.position.set(0, 0, -0.8);
        disk.rotation.x = Math.PI / 2;
        group.add(disk);
        
        // Disk center
        const diskCenterGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 32);
        const diskCenterMaterial = new THREE.MeshPhongMaterial({
            color: playerColor,
            emissive: playerColor,
            emissiveIntensity: 0.8
        });
        const diskCenter = new THREE.Mesh(diskCenterGeometry, diskCenterMaterial);
        diskCenter.position.set(0, 0, -0.8);
        diskCenter.rotation.x = Math.PI / 2;
        group.add(diskCenter);
        
        // Energy glow
        const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const glowMaterial = new THREE.MeshPhongMaterial({
            color: playerColor,
            emissive: playerColor,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
        
        return group;
    }
    
    createWallSegment(start, end, color) {
        const length = Math.sqrt(
            Math.pow(end.x - start.x, 2) + 
            Math.pow(end.z - start.z, 2)
        );
        
        const angle = Math.atan2(end.z - start.z, end.x - start.x);
        
        const geometry = new THREE.BoxGeometry(
            length, 
            CONFIG.wallHeight, 
            0.5
        );
        
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: CONFIG.wallOpacity,
            side: THREE.DoubleSide
        });
        
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(
            (start.x + end.x) / 2,
            CONFIG.wallHeight / 2,
            (start.z + end.z) / 2
        );
        wall.rotation.y = -angle;
        wall.castShadow = true;
        wall.receiveShadow = true;
        
        // Add edge glow
        const edges = new THREE.EdgesGeometry(geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 2
        });
        const edgesMesh = new THREE.LineSegments(edges, edgeMaterial);
        edgesMesh.position.copy(wall.position);
        edgesMesh.rotation.copy(wall.rotation);
        
        const wallGroup = new THREE.Group();
        wallGroup.add(wall);
        wallGroup.add(edgesMesh);
        
        return wallGroup;
    }
    
    initEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            clearTimeout(gameState.resizeDebounce);
            gameState.resizeDebounce = setTimeout(() => {
                this.onWindowResize();
            }, 100);
        });
        
        // Keyboard controls
        const keys = {};
        window.addEventListener('keydown', (e) => {
            keys[e.code] = true;
            // Prevent arrow keys from scrolling page
            if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', (e) => {
            keys[e.code] = false;
        });
        gameState.keys = keys;
        
        // Color selection
        gameState.elements.colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                gameState.elements.colorOptions.forEach(opt => 
                    opt.classList.remove('selected'));
                option.classList.add('selected');
                gameState.playerColor = parseInt(
                    option.dataset.color.replace('#', '0x'), 
                    16
                );
            });
        });
        
        // Enter button
        gameState.elements.enterButton.addEventListener('click', () => {
            this.startGame();
        });
        
        // Allow Enter key to submit
        gameState.elements.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startGame();
            }
        });
    }
    
    startGame() {
        gameState.playerName = gameState.elements.playerNameInput.value.trim() || 'User';
        
        // Hide start screen
        gameState.elements.startScreen.classList.remove('active');
        
        // Show game UI
        gameState.elements.gameUI.classList.add('active');
        gameState.elements.playerNameDisplay.textContent = gameState.playerName.toUpperCase();
        
        // Create player
        gameState.myPlayerId = 'player-' + Math.random().toString(36).substr(2, 9);
        gameState.players[gameState.myPlayerId] = {
            id: gameState.myPlayerId,
            name: gameState.playerName,
            x: 0,
            z: 0,
            color: gameState.playerColor,
            model: this.createPlayerModel(gameState.playerColor),
            direction: { x: 0, z: 0 },
            speed: CONFIG.moveSpeed,
            lastWallTime: 0,
            trailPositions: new Array(CONFIG.trailLength).fill().map(() => ({ x: 0, z: 0 })),
            trailIndex: 0
        };
        
        scene.add(gameState.players[gameState.myPlayerId].model);
        
        // Add AI players
        this.addAIPlayer('Rinzler', -15, 0, 0xff00ff);
        this.addAIPlayer('Quorra', 15, 0, 0xffff00);
        this.addAIPlayer('CLU', 0, -15, 0xff8800);
        
        gameState.gameStarted = true;
        gameState.clock.start();
    }
    
    addAIPlayer(name, x, z, color) {
        const id = 'ai-' + Math.random().toString(36).substr(2, 9);
        gameState.players[id] = {
            id,
            name,
            x,
            z,
            color,
            model: this.createPlayerModel(color),
            direction: { 
                x: Math.random() > 0.5 ? 1 : -1, 
                z: Math.random() > 0.5 ? 1 : -1 
            },
            speed: CONFIG.moveSpeed * 0.8,
            lastTurn: 0,
            isAI: true,
            trailPositions: new Array(CONFIG.trailLength).fill().map(() => ({ x, z })),
            trailIndex: 0
        };
        scene.add(gameState.players[id].model);
    }
    
    onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    }
    
    updatePlayerMovement(player, deltaTime) {
        const oldX = player.x;
        const oldZ = player.z;
        
        // Handle input
        if (player.id === gameState.myPlayerId) {
            this.handlePlayerInput(player, deltaTime);
        } else if (player.isAI) {
            this.handleAIInput(player, deltaTime);
        }
        
        // Calculate proposed new position
        let newX = player.x + player.direction.x * player.speed;
        let newZ = player.z + player.direction.z * player.speed;
        
        // Store trail position
        player.trailPositions[player.trailIndex] = { x: player.x, z: player.z };
        player.trailIndex = (player.trailIndex + 1) % CONFIG.trailLength;
        
        // Enforce grid boundaries
        newX = Math.max(-gameState.gridBoundary, Math.min(gameState.gridBoundary, newX));
        newZ = Math.max(-gameState.gridBoundary, Math.min(gameState.gridBoundary, newZ));
        
        // Check building collisions
        if (this.checkBuildingCollision(newX, newZ)) {
            // If would collide with building, revert to old position
            newX = oldX;
            newZ = oldZ;
            
            // Change direction for AI players
            if (player.isAI) {
                player.direction.x = -player.direction.x;
                player.direction.z = -player.direction.z;
                player.lastTurn = 0;
            }
        }
        
        // Only create wall if position changed
        if ((newX !== oldX || newZ !== oldZ) && 
            Date.now() - player.lastWallTime > CONFIG.wallInterval) {
            this.createPlayerWall(player, newX, newZ);
            player.lastWallTime = Date.now();
        }
        
        // Update position
        player.x = newX;
        player.z = newZ;
        player.model.position.set(player.x, 0, player.z);
        
        // Update trail particles
        if (player.model.userData.trail) {
            const trail = player.model.userData.trail;
            const positions = trail.geometry.attributes.position.array;
            
            for (let i = 0; i < CONFIG.trailLength; i++) {
                const idx = (player.trailIndex + i) % CONFIG.trailLength;
                const pos = player.trailPositions[idx];
                const i3 = i * 3;
                
                positions[i3] = pos.x - player.x;
                positions[i3 + 1] = 0;
                positions[i3 + 2] = pos.z - player.z - 1;
            }
            
            trail.geometry.attributes.position.needsUpdate = true;
        }
        
        // Rotate model to face direction
        if (player.direction.x !== 0 || player.direction.z !== 0) {
            player.model.rotation.y = Math.atan2(
                player.direction.x, 
                -player.direction.z
            );
        }
        
        // Update camera for human player
        if (player.id === gameState.myPlayerId) {
            this.updateCamera(player);
            this.updateUI(player);
        }
    }
    
    handlePlayerInput(player, deltaTime) {
        const turnSpeed = CONFIG.turnSpeed * deltaTime * 60; // Normalize for framerate
        
        // Reset direction if no input
        if (!(gameState.keys['ArrowUp'] || gameState.keys['KeyW'] || 
              gameState.keys['ArrowDown'] || gameState.keys['KeyS'] ||
              gameState.keys['ArrowLeft'] || gameState.keys['KeyA'] || 
              gameState.keys['ArrowRight'] || gameState.keys['KeyD'])) {
            return;
        }
        
        // Calculate desired direction
        let desiredX = 0;
        let desiredZ = 0;
        
        if (gameState.keys['ArrowUp'] || gameState.keys['KeyW']) desiredZ = -1;
        if (gameState.keys['ArrowDown'] || gameState.keys['KeyS']) desiredZ = 1;
        if (gameState.keys['ArrowLeft'] || gameState.keys['KeyA']) desiredX = -1;
        if (gameState.keys['ArrowRight'] || gameState.keys['KeyD']) desiredX = 1;
        
        // Normalize diagonal movement
        if (desiredX !== 0 && desiredZ !== 0) {
            desiredX *= 0.7071;
            desiredZ *= 0.7071;
        }
        
        // Smooth turning
        player.direction.x = this.lerp(player.direction.x, desiredX, turnSpeed);
        player.direction.z = this.lerp(player.direction.z, desiredZ, turnSpeed);
        
        // Normalize after interpolation
        const len = Math.sqrt(player.direction.x**2 + player.direction.z**2);
        if (len > 0) {
            player.direction.x /= len;
            player.direction.z /= len;
        }
    }
    
    handleAIInput(player, deltaTime) {
        player.lastTurn += deltaTime;
        
        // Turn randomly or when near edge/building
        if (player.lastTurn > 2 || 
            Math.abs(player.x) > gameState.gridBoundary - 5 ||
            Math.abs(player.z) > gameState.gridBoundary - 5 ||
            this.checkBuildingCollision(
                player.x + player.direction.x * 5,
                player.z + player.direction.z * 5
            )) {
            
            // Try to find a clear direction
            const angles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, -3*Math.PI/4, -Math.PI/2, -Math.PI/4];
            const shuffled = [...angles].sort(() => Math.random() - 0.5);
            
            for (const angle of shuffled) {
                const testX = Math.cos(angle);
                const testZ = Math.sin(angle);
                
                if (!this.checkBuildingCollision(
                    player.x + testX * 5,
                    player.z + testZ * 5
                ) && Math.abs(player.x + testX * 10) < gameState.gridBoundary &&
                   Math.abs(player.z + testZ * 10) < gameState.gridBoundary) {
                    player.direction.x = testX;
                    player.direction.z = testZ;
                    break;
                }
            }
            
            player.lastTurn = 0;
        }
    }
    
    checkBuildingCollision(x, z) {
        for (const building of gameState.buildings) {
            const halfWidth = (building.width * CONFIG.cellSize * CONFIG.buildingPadding) / 2;
            const halfDepth = (building.depth * CONFIG.cellSize * CONFIG.buildingPadding) / 2;
            
            if (x > building.x * CONFIG.cellSize - halfWidth &&
                x < building.x * CONFIG.cellSize + halfWidth &&
                z > building.z * CONFIG.cellSize - halfDepth &&
                z < building.z * CONFIG.cellSize + halfDepth) {
                return true;
            }
        }
        return false;
    }
    
    createPlayerWall(player, newX, newZ) {
        const wall = {
            start: { x: player.x, z: player.z },
            end: { x: newX, z: newZ },
            color: player.color,
            owner: player.id,
            mesh: this.createWallSegment(
                { x: player.x, z: player.z },
                { x: newX, z: newZ },
                player.color
            )
        };
        gameState.walls.push(wall);
        scene.add(wall.mesh);
    }
    
    checkCollisions() {
        // Clean up old walls
        if (gameState.walls.length > 200) {
            const toRemove = gameState.walls.splice(0, 50);
            toRemove.forEach(wall => scene.remove(wall.mesh));
        }
        
        // Check all players against walls and boundaries
        Object.values(gameState.players).forEach(player => {
            // Check boundary collisions
            if (Math.abs(player.x) >= gameState.gridBoundary || 
                Math.abs(player.z) >= gameState.gridBoundary) {
                this.handlePlayerCrash(player);
                return;
            }
            
            // Check wall collisions
            for (const wall of gameState.walls) {
                if (wall.owner !== player.id) {
                    if (this.checkWallCollision(player, wall)) {
                        this.handlePlayerCrash(player);
                        break;
                    }
                }
            }
        });
    }
    
    checkWallCollision(player, wall) {
        const playerRadius = 0.8;
        const wallThickness = 0.5;
        
        // Convert wall to line segment
        const wallStart = new THREE.Vector2(wall.start.x, wall.start.z);
        const wallEnd = new THREE.Vector2(wall.end.x, wall.end.z);
        const playerPos = new THREE.Vector2(player.x, player.z);
        
        // Find closest point on wall segment to player
        const closest = this.clampToLineSegment(playerPos, wallStart, wallEnd);
        const distance = playerPos.distanceTo(closest);
        
        return distance < playerRadius + wallThickness/2;
    }
    
    clampToLineSegment(point, lineStart, lineEnd) {
        const x1 = lineStart.x, y1 = lineStart.y;
        const x2 = lineEnd.x, y2 = lineEnd.y;
        const xp = point.x, yp = point.y;
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const l2 = dx*dx + dy*dy;
        
        if (l2 === 0) return lineStart.clone();
        
        let t = ((xp - x1) * dx + (yp - y1) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        
        return new THREE.Vector2(x1 + t * dx, y1 + t * dy);
    }
    
    handlePlayerCrash(player) {
        console.log(`${player.name} crashed!`);
        
        // Visual effect - flash red
        player.model.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.emissive.setHex(0xff0000);
                        mat.color.setHex(0xff0000);
                    });
                } else {
                    child.material.emissive.setHex(0xff0000);
                    child.material.color.setHex(0xff0000);
                }
            }
        });
        
        // Remove from game after delay
        setTimeout(() => {
            scene.remove(player.model);
            delete gameState.players[player.id];
            
            // Update UI
            gameState.elements.playerCount.textContent = Object.keys(gameState.players).length;
            
            // Game over if player crashed
            if (player.id === gameState.myPlayerId) {
                alert("GAME OVER\nYou crashed into a wall!");
                gameState.elements.gameUI.classList.remove('active');
                gameState.elements.startScreen.classList.add('active');
                gameState.gameStarted = false;
            }
        }, CONFIG.crashTimeout);
    }
    
    updateCamera(player) {
        // Calculate camera position based on player direction
        const angle = Math.atan2(player.direction.x, -player.direction.z);
        const offsetX = -Math.sin(angle) * CONFIG.cameraDistance;
        const offsetZ = -Math.cos(angle) * CONFIG.cameraDistance;
        
        camera.position.set(
            player.x + offsetX,
            CONFIG.cameraHeight,
            player.z + offsetZ
        );
        camera.lookAt(player.x, 0, player.z);
    }
    
    updateUI(player) {
        gameState.elements.playerPosition.textContent = 
            `${Math.floor(player.x)},${Math.floor(player.z)}`;
        
        gameState.elements.playerCount.textContent = 
            Object.keys(gameState.players).length;
        
        // Update game time
        const minutes = Math.floor(gameState.gameTime / 60);
        const seconds = Math.floor(gameState.gameTime % 60);
        gameState.elements.gameTime.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = gameState.clock.getDelta();
        
        if (gameState.gameStarted) {
            gameState.gameTime += deltaTime;
            
            // Update all players
            Object.values(gameState.players).forEach(player => {
                this.updatePlayerMovement(player, deltaTime);
            });
            
            // Check for collisions
            this.checkCollisions();
            
            // Update directional light to create moving light effect
            const time = gameState.clock.getElapsedTime();
            directionalLight.position.x = Math.sin(time * 0.2) * 20;
            directionalLight.position.z = Math.cos(time * 0.3) * 20;
            hemisphereLight.position.copy(directionalLight.position);
        }
        
        // Render with post-processing
        composer.render();
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new TronGame();
});
