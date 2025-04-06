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
        visor.position.z = 1.5 + 0
