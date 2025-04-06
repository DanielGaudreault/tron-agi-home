// ================ TRON: GRID REVOLUTION ================
// Complete working version with border walls and enhanced visuals

// Game Configuration
const CONFIG = {
    // World settings
    gridSize: 150,
    cellSize: 2,
    gridColor: 0x003333,
    lightColor: 0x00ffff,
    buildingDensity: 0.15,
    
    // Player settings
    playerColors: [0x00ffff, 0xff00ff, 0xffff00, 0xff8800],
    moveSpeed: 0.15,
    wallHeight: 3,
    wallOpacity: 0.9,
    trailLength: 15,
    
    // Camera settings
    fov: 75,
    cameraDistance: 40,
    cameraHeight: 20,
    cameraAngle: Math.PI / 4,
    
    // Border walls
    borderWallHeight: 10,
    borderWallThickness: 2
};

// Game State
const gameState = {
    players: {},
    walls: [],
    buildings: [],
    borderWalls: [],
    myPlayerId: null,
    playerName: "",
    gameStarted: false,
    clock: new THREE.Clock(),
    keys: {}
};

// Three.js Variables
let scene, camera, renderer;

// Initialize the game
function initGame() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.fog = new THREE.FogExp2(0x000822, 0.0015);
    
    // Camera
    camera = new THREE.PerspectiveCamera(
        CONFIG.fov,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    // Lighting
    setupLighting();
    
    // Create game world
    createWorld();
    
    // Event listeners
    setupEventListeners();
    
    // Start game loop
    animate();
}

function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x222233);
    scene.add(ambientLight);
    
    // Directional light (main light source)
    const directionalLight = new THREE.DirectionalLight(0x00ffff, 1.2);
    directionalLight.position.set(1, 1, 0.5).normalize();
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0x0066ff, 0.5);
    fillLight.position.set(-1, 0.5, -0.5).normalize();
    scene.add(fillLight);
}

function createWorld() {
    // Create grid
    scene.add(createGrid());
    
    // Create buildings
    createBuildings();
    
    // Create border walls
    createBorderWalls();
    
    // Initial camera position
    camera.position.set(0, CONFIG.cameraHeight, CONFIG.cameraDistance);
    camera.lookAt(0, 0, 0);
}

function createGrid() {
    const group = new THREE.Group();
    const halfSize = CONFIG.gridSize / 2;
    
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(
        CONFIG.gridSize * CONFIG.cellSize,
        CONFIG.gridSize * CONFIG.cellSize,
        CONFIG.gridSize,
        CONFIG.gridSize
    );
    
    // Custom ground material with subtle grid
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: CONFIG.gridColor,
        emissive: 0x001111,
        emissiveIntensity: 0.3,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    group.add(ground);
    
    // Grid helper for precise lines
    const gridHelper = new THREE.GridHelper(
        CONFIG.gridSize * CONFIG.cellSize,
        CONFIG.gridSize,
        CONFIG.lightColor,
        CONFIG.lightColor
    );
    gridHelper.position.y = 0.1;
    group.add(gridHelper);
    
    return group;
}

function createBorderWalls() {
    const halfSize = CONFIG.gridSize / 2 * CONFIG.cellSize;
    const height = CONFIG.borderWallHeight;
    const thickness = CONFIG.borderWallThickness;
    const color = 0x005588;
    
    // North wall
    const northWall = new THREE.Mesh(
        new THREE.BoxGeometry(CONFIG.gridSize * CONFIG.cellSize + thickness*2, height, thickness),
        new THREE.MeshPhongMaterial({
            color: color,
            emissive: 0x004488,
            transparent: true,
            opacity: 0.9
        })
    );
    northWall.position.set(0, height/2, halfSize + thickness/2);
    scene.add(northWall);
    gameState.borderWalls.push(northWall);
    
    // South wall
    const southWall = new THREE.Mesh(
        new THREE.BoxGeometry(CONFIG.gridSize * CONFIG.cellSize + thickness*2, height, thickness),
        new THREE.MeshPhongMaterial({
            color: color,
            emissive: 0x004488,
            transparent: true,
            opacity: 0.9
        })
    );
    southWall.position.set(0, height/2, -halfSize - thickness/2);
    scene.add(southWall);
    gameState.borderWalls.push(southWall);
    
    // East wall
    const eastWall = new THREE.Mesh(
        new THREE.BoxGeometry(thickness, height, CONFIG.gridSize * CONFIG.cellSize),
        new THREE.MeshPhongMaterial({
            color: color,
            emissive: 0x004488,
            transparent: true,
            opacity: 0.9
        })
    );
    eastWall.position.set(halfSize + thickness/2, height/2, 0);
    scene.add(eastWall);
    gameState.borderWalls.push(eastWall);
    
    // West wall
    const westWall = new THREE.Mesh(
        new THREE.BoxGeometry(thickness, height, CONFIG.gridSize * CONFIG.cellSize),
        new THREE.MeshPhongMaterial({
            color: color,
            emissive: 0x004488,
            transparent: true,
            opacity: 0.9
        })
    );
    westWall.position.set(-halfSize - thickness/2, height/2, 0);
    scene.add(westWall);
    gameState.borderWalls.push(westWall);
    
    // Add glowing edges to all border walls
    gameState.borderWalls.forEach(wall => {
        const edges = new THREE.EdgesGeometry(wall.geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 })
        );
        line.position.copy(wall.position);
        scene.add(line);
    });
}

function createBuildings() {
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
                
                if (distance < 8) { // Minimum distance between buildings
                    validPosition = false;
                    break;
                }
            }
            
            attempts++;
            if (attempts > 100) break; // Prevent infinite loop
        } while (!validPosition);
        
        if (!validPosition) continue;
        
        // Building dimensions
        const width = Math.floor(Math.random() * 6) + 4;
        const depth = Math.floor(Math.random() * 6) + 4;
        const height = Math.floor(Math.random() * 20) + 10;
        const floors = Math.floor(height / 4);
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

function createBuilding(x, z, width, depth, height, floors, color) {
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
        new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.7 }), // right
        new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.7 }), // left
        new THREE.MeshStandardMaterial({ color: buildingColor, roughness: 0.5 }), // top
        new THREE.MeshStandardMaterial({ color: buildingColor, roughness: 0.5 }), // bottom
        new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.7 }), // front
        new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.7 })  // back
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
    const windowColor = 0x00aaff;
    const windowSize = 0.8;
    const windowSpacing = 1.5;
    
    for (let floor = 1; floor <= floors; floor++) {
        const floorHeight = (floor / floors) * height * CONFIG.cellSize - (CONFIG.cellSize * 0.5);
        
        // Front and back windows
        for (let w = -width/2 + 0.5; w <= width/2 - 0.5; w += windowSpacing) {
            // Front
            const frontWindow = createWindow(
                w * CONFIG.cellSize,
                floorHeight,
                (-depth/2 + 0.1) * CONFIG.cellSize,
                windowSize,
                windowColor
            );
            group.add(frontWindow);
            
            // Back
            const backWindow = createWindow(
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
            const leftWindow = createWindow(
                (-width/2 + 0.1) * CONFIG.cellSize,
                floorHeight,
                d * CONFIG.cellSize,
                windowSize,
                windowColor,
                true
            );
            group.add(leftWindow);
            
            // Right
            const rightWindow = createWindow(
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
    if (height > 15) {
        const roofGeometry = new THREE.CylinderGeometry(
            width * CONFIG.cellSize * 0.4,
            width * CONFIG.cellSize * 0.8,
            CONFIG.cellSize * 3,
            8
        );
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: buildingColor,
            emissive: 0x111111,
            roughness: 0.6
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
        const antennaMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            emissive: 0x00ffff,
            emissiveIntensity: 0.3
        });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(
            x * CONFIG.cellSize,
            height * CONFIG.cellSize + height * 0.15 + CONFIG.cellSize * 3,
            z * CONFIG.cellSize
        );
        group.add(antenna);
    }
    
    return group;
}

function createWindow(x, y, z, size, color, rotate = false) {
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        metalness: 0.5,
        roughness: 0.2
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

function createPlayerModel(color) {
    const group = new THREE.Group();
    const playerColor = new THREE.Color(color);
    const emissiveColor = playerColor.clone().multiplyScalar(0.7);
    
    // Body (armored suit)
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.6, 2.2, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: playerColor,
        emissive: emissiveColor,
        emissiveIntensity: 0.6,
        metalness: 0.5,
        roughness: 0.4
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    body.castShadow = true;
    group.add(body);
    
    // Chest plate
    const chestGeometry = new THREE.SphereGeometry(0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const chestMaterial = new THREE.MeshStandardMaterial({
        color: playerColor,
        emissive: emissiveColor,
        emissiveIntensity: 0.7,
        metalness: 0.6,
        roughness: 0.3
    });
    const chest = new THREE.Mesh(chestGeometry, chestMaterial);
    chest.position.z = 0.8;
    chest.rotation.x = Math.PI / 2;
    group.add(chest);
    
    // Head (helmet)
    const headGeometry = new THREE.DodecahedronGeometry(0.7, 1);
    const headMaterial = new THREE.MeshStandardMaterial({
        color: playerColor,
        emissive: emissiveColor,
        emissiveIntensity: 0.8,
        metalness: 0.7,
        roughness: 0.2
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.z = 1.5;
    group.add(head);
    
    // Visor
    const visorGeometry = new THREE.CircleGeometry(0.4, 8);
    const visorMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.9,
        metalness: 0.9,
        roughness: 0.1
    });
    const visor = new THREE.Mesh(visorGeometry, visorMaterial);
    visor.position.z = 1.5 + 0.71;
    visor.rotation.x = Math.PI / 2;
    group.add(visor);
    
    // Light trail (particle system)
    const trailParticles = CONFIG.trailLength;
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
    const diskMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        emissive: 0x00ffff,
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.2
    });
    const disk = new THREE.Mesh(diskGeometry, diskMaterial);
    disk.position.set(0, 0, -0.8);
    disk.rotation.x = Math.PI / 2;
    group.add(disk);
    
    // Disk center
    const diskCenterGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 32);
    const diskCenterMaterial = new THREE.MeshStandardMaterial({
        color: playerColor,
        emissive: playerColor,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1
    });
    const diskCenter = new THREE.Mesh(diskCenterGeometry, diskCenterMaterial);
    diskCenter.position.set(0, 0, -0.8);
    diskCenter.rotation.x = Math.PI / 2;
    group.add(diskCenter);
    
    // Energy glow
    const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const glowMaterial = new THREE.MeshStandardMaterial({
        color: playerColor,
        emissive: playerColor,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        metalness: 0.5,
        roughness: 0.8
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    return group;
}

function createWallSegment(start, end, color) {
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
    
    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: CONFIG.wallOpacity,
        metalness: 0.6,
        roughness: 0.3
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

function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
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
    
    // Enter button
    document.getElementById('enter-button').addEventListener('click', () => {
        startGame();
    });
    
    // Allow Enter key to submit
    document.getElementById('player-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGame();
        }
    });
}

function startGame() {
    gameState.playerName = document.getElementById('player-name').value.trim() || 'Player';
    
    // Hide start screen
    document.getElementById('start-screen').style.display = 'none';
    
    // Show game UI
    document.getElementById('game-ui').classList.add('active');
    document.querySelector('.player-name').textContent = gameState.playerName.toUpperCase();
    
    // Create player
    gameState.myPlayerId = 'player-' + Math.random().toString(36).substr(2, 9);
    gameState.players[gameState.myPlayerId] = {
        id: gameState.myPlayerId,
        name: gameState.playerName,
        x: 0,
        z: 0,
        color: CONFIG.playerColors[0],
        model: createPlayerModel(CONFIG.playerColors[0]),
        direction: { x: 0, z: 0 },
        speed: CONFIG.moveSpeed,
        lastWallTime: 0,
        trailPositions: new Array(CONFIG.trailLength).fill().map(() => ({ x: 0, z: 0 })),
        trailIndex: 0
    };
    
    scene.add(gameState.players[gameState.myPlayerId].model);
    
    // Add AI players
    addAIPlayer('Rinzler', -15, 0, CONFIG.playerColors[1]);
    addAIPlayer('Quorra', 15, 0, CONFIG.playerColors[2]);
    addAIPlayer('CLU', 0, -15, CONFIG.playerColors[3]);
    
    gameState.gameStarted = true;
    gameState.clock.start();
}

function addAIPlayer(name, x, z, color) {
    const id = 'ai-' + Math.random().toString(36).substr(2, 9);
    gameState.players[id] = {
        id,
        name,
        x,
        z,
        color,
        model: createPlayerModel(color),
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

function updatePlayerMovement(player, deltaTime) {
    const oldX = player.x;
    const oldZ = player.z;
    
    // Handle input for human player
    if (player.id === gameState.myPlayerId) {
        this.handlePlayerInput(player, deltaTime);
    } else if (player.isAI) {
        this.handleAIInput(player, deltaTime);
    }
    
    // Store trail position
    player.trailPositions[player.trailIndex] = { x: player.x, z: player.z };
    player.trailIndex = (player.trailIndex + 1) % CONFIG.trailLength;
    
    // Calculate proposed new position
    let newX = player.x + player.direction.x * player.speed;
    let newZ = player.z + player.direction.z * player.speed;
    
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
        const positions = trail.geometry.attributes
