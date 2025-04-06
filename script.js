// ================ TRON GAME - PURE CODE VERSION ================
// Main game script - handles all game logic and rendering

// Game Configuration
const CONFIG = {
    gridSize: 100,          // Size of the game world
    cellSize: 2,            // Size of each grid cell
    gridColor: 0x003300,    // Color of the ground
    lightColor: 0x00ffff,   // Color of neon edges
    buildingColors: [0x111122, 0x112211, 0x221111], // Building colors
    playerColors: [0x00ffff, 0xff00ff, 0xffff00, 0xff8800], // Player colors
    moveSpeed: 0.1,         // Base player speed
    turnSpeed: 0.05,        // How quickly players can turn
    wallHeight: 2,          // Height of light walls
    wallOpacity: 0.8,       // Transparency of walls
    fov: 75,               // Camera field of view
    cameraDistance: 30,     // How far camera follows behind
    cameraHeight: 15        // Camera height above player
};

// Game State
const gameState = {
    players: {},
    walls: [],
    buildings: [],
    myPlayerId: null,
    playerName: "",
    gameStarted: false,
    lastWallTime: 0,
    wallInterval: 100,      // Milliseconds between wall segments
    clock: 0
};

// Three.js Variables
let scene, camera, renderer;
let grid, directionalLight;
let clock = new THREE.Clock();

// DOM Elements
const uiElements = {
    score: document.getElementById('score'),
    position: document.getElementById('position'),
    joinScreen: document.getElementById('join-screen'),
    playerName: document.getElementById('player-name'),
    joinButton: document.getElementById('join-button')
};

// Initialize the game
function initGame() {
    // Three.js Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(
        CONFIG.fov,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
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

// Set up lighting
function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);
    
    // Directional light (main light source)
    directionalLight = new THREE.DirectionalLight(0x00ffff, 1);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Add glowing effect to light
    const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
    scene.add(lightHelper);
}

// Create game world
function createWorld() {
    // Create grid
    grid = createGrid();
    scene.add(grid);
    
    // Create buildings
    createBuildings();
    
    // Initial camera position
    camera.position.set(0, CONFIG.cameraHeight, CONFIG.cameraDistance);
    camera.lookAt(0, 0, 0);
}

// Create grid floor
function createGrid() {
    const group = new THREE.Group();
    
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(
        CONFIG.gridSize * CONFIG.cellSize,
        CONFIG.gridSize * CONFIG.cellSize
    );
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: CONFIG.gridColor,
        emissive: 0x001100,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    group.add(ground);
    
    // Grid lines
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x005500,
        transparent: true,
        opacity: 0.7
    });
    
    const halfSize = CONFIG.gridSize / 2;
    
    // Horizontal lines
    for (let i = -halfSize; i <= halfSize; i++) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-halfSize * CONFIG.cellSize, 0.1, i * CONFIG.cellSize),
            new THREE.Vector3(halfSize * CONFIG.cellSize, 0.1, i * CONFIG.cellSize)
        ]);
        const line = new THREE.Line(geometry, lineMaterial);
        group.add(line);
    }
    
    // Vertical lines
    for (let i = -halfSize; i <= halfSize; i++) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(i * CONFIG.cellSize, 0.1, -halfSize * CONFIG.cellSize),
            new THREE.Vector3(i * CONFIG.cellSize, 0.1, halfSize * CONFIG.cellSize)
        ]);
        const line = new THREE.Line(geometry, lineMaterial);
        group.add(line);
    }
    
    return group;
}

// Create random buildings
function createBuildings() {
    const halfSize = CONFIG.gridSize / 2;
    
    for (let i = 0; i < 50; i++) {
        // Random position (avoid center)
        let x, z;
        do {
            x = Math.floor(Math.random() * CONFIG.gridSize - halfSize);
            z = Math.floor(Math.random() * CONFIG.gridSize - halfSize);
        } while (Math.abs(x) < 15 && Math.abs(z) < 15);
        
        const width = Math.floor(Math.random() * 5) + 2;
        const depth = Math.floor(Math.random() * 5) + 2;
        const height = Math.floor(Math.random() * 10) + 5;
        const color = CONFIG.buildingColors[i % CONFIG.buildingColors.length];
        
        // Building mesh
        const geometry = new THREE.BoxGeometry(
            width * CONFIG.cellSize,
            height * CONFIG.cellSize,
            depth * CONFIG.cellSize
        );
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: 0x001111,
            transparent: true,
            opacity: 0.8
        });
        const building = new THREE.Mesh(geometry, material);
        building.position.set(
            x * CONFIG.cellSize,
            (height * CONFIG.cellSize) / 2,
            z * CONFIG.cellSize
        );
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);
        
        // Building edges (neon effect)
        const edges = new THREE.EdgesGeometry(geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: CONFIG.lightColor,
            linewidth: 2
        });
        const edgesMesh = new THREE.LineSegments(edges, edgeMaterial);
        edgesMesh.position.copy(building.position);
        scene.add(edgesMesh);
        
        gameState.buildings.push({
            x, z, width, height, depth,
            mesh: building,
            edges: edgesMesh
        });
    }
}

// Create player model
function createPlayerModel(color) {
    const group = new THREE.Group();
    
    // Body (main cube)
    const bodyGeometry = new THREE.BoxGeometry(1.5, 2.5, 1);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    group.add(body);
    
    // Head (sphere)
    const headGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.7
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.8;
    head.castShadow = true;
    group.add(head);
    
    // Light trail (cylinder)
    const trailGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
    const trailMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        transparent: true,
        opacity: 0.7
    });
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.rotation.x = Math.PI / 2;
    trail.position.z = -1.5;
    group.add(trail);
    
    return group;
}

// Create wall segment
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
    const material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        transparent: true,
        opacity: CONFIG.wallOpacity
    });
    
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(
        (start.x + end.x) / 2,
        CONFIG.wallHeight / 2,
        (start.z + end.z) / 2
    );
    wall.rotation.y = -angle;
    wall.castShadow = true;
    
    return wall;
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Set up event listeners
function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    
    // Keyboard controls
    const keys = {};
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        // Prevent arrow keys from scrolling page
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
    });
    window.addEventListener('keyup', (e) => keys[e.code] = false);
    
    // Store keys in game state
    gameState.keys = keys;
    
    // Join button
    uiElements.joinButton.addEventListener('click', joinGame);
}

// Join game
function joinGame() {
    gameState.playerName = uiElements.playerName.value || 'Player';
    gameState.myPlayerId = 'player-' + Math.random().toString(36).substr(2, 9);
    
    // Hide join screen
    uiElements.joinScreen.style.display = 'none';
    
    // Create player
    const color = CONFIG.playerColors[Object.keys(gameState.players).length % CONFIG.playerColors.length];
    gameState.players[gameState.myPlayerId] = {
        id: gameState.myPlayerId,
        name: gameState.playerName,
        x: 0,
        z: 0,
        color: color,
        model: createPlayerModel(color),
        direction: { x: 0, z: 0 },
        speed: CONFIG.moveSpeed,
        lastWallTime: 0
    };
    
    scene.add(gameState.players[gameState.myPlayerId].model);
    
    // Add some AI players
    addAIPlayer('Rinzler', -10, 0, CONFIG.playerColors[1]);
    addAIPlayer('Quorra', 10, 0, CONFIG.playerColors[2]);
    addAIPlayer('CLU', 0, -10, CONFIG.playerColors[3]);
    
    gameState.gameStarted = true;
}

// Add AI player
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
        isAI: true
    };
    scene.add(gameState.players[id].model);
}

// Update player movement
function updatePlayerMovement(player, deltaTime) {
    // Handle input for human player
    if (player.id === gameState.myPlayerId) {
        player.direction = { x: 0, z: 0 };
        
        if (gameState.keys['ArrowUp'] || gameState.keys['KeyW']) player.direction.z = -1;
        if (gameState.keys['ArrowDown'] || gameState.keys['KeyS']) player.direction.z = 1;
        if (gameState.keys['ArrowLeft'] || gameState.keys['KeyA']) player.direction.x = -1;
        if (gameState.keys['ArrowRight'] || gameState.keys['KeyD']) player.direction.x = 1;
        
        // Normalize diagonal movement
        if (player.direction.x !== 0 && player.direction.z !== 0) {
            player.direction.x *= 0.7071;
            player.direction.z *= 0.7071;
        }
    }
    // AI movement
    else if (player.isAI) {
        player.lastTurn += deltaTime;
        
        // Random turns or when near edge
        if (player.lastTurn > 3 || Math.abs(player.x) > CONFIG.gridSize/2 - 10 || 
            Math.abs(player.z) > CONFIG.gridSize/2 - 10) {
            player.direction = {
                x: Math.random() > 0.5 ? 1 : -1,
                z: Math.random() > 0.5 ? 1 : -1
            };
            player.lastTurn = 0;
        }
    }
    
    // Calculate new position
    const newX = player.x + player.direction.x * player.speed;
    const newZ = player.z + player.direction.z * player.speed;
    
    // Create wall if moving
    if ((player.direction.x !== 0 || player.direction.z !== 0) && 
        Date.now() - player.lastWallTime > gameState.wallInterval) {
        createPlayerWall(player, newX, newZ);
        player.lastWallTime = Date.now();
    }
    
    // Update position
    player.x = newX;
    player.z = newZ;
    player.model.position.set(player.x, 0, player.z);
    
    // Face direction if moving
    if (player.direction.x !== 0 || player.direction.z !== 0) {
        player.model.rotation.y = Math.atan2(
            player.direction.x, 
            -player.direction.z
        );
    }
    
    // Update camera for human player
    if (player.id === gameState.myPlayerId) {
        camera.position.set(
            player.x - 10, 
            CONFIG.cameraHeight, 
            player.z + CONFIG.cameraDistance
        );
        camera.lookAt(player.x, 0, player.z);
        
        // Update UI
        uiElements.position.textContent = 
            `Position: (${player.x.toFixed(1)}, ${player.z.toFixed(1)})`;
        uiElements.score.textContent = 
            `Players: ${Object.keys(gameState.players).length}`;
    }
}

// Create wall for player movement
function createPlayerWall(player, newX, newZ) {
    const wall = {
        start: { x: player.x, z: player.z },
        end: { x: newX, z: newZ },
        color: player.color,
        owner: player.id,
        mesh: createWallSegment(
            { x: player.x, z: player.z },
            { x: newX, z: newZ },
            player.color
        )
    };
    gameState.walls.push(wall);
    scene.add(wall.mesh);
}

// Check for collisions
function checkCollisions() {
    // Clean up old walls (for performance)
    if (gameState.walls.length > 200) {
        const toRemove = gameState.walls.splice(0, 50);
        toRemove.forEach(wall => scene.remove(wall.mesh));
    }
    
    // Check player collisions (simplified for this demo)
    Object.values(gameState.players).forEach(player => {
        // Check boundary collisions
        const halfSize = CONFIG.gridSize / 2;
        if (Math.abs(player.x) > halfSize || Math.abs(player.z) > halfSize) {
            console.log(`${player.name} crashed into boundary!`);
            // In a full game, you'd handle player death here
        }
        
        // Check wall collisions (simplified)
        gameState.walls.forEach(wall => {
            if (wall.owner !== player.id) {
                // Simple distance check
                const distToStart = Math.sqrt(
                    Math.pow(player.x - wall.start.x, 2) + 
                    Math.pow(player.z - wall.start.z, 2)
                );
                
                if (distToStart < 0.5) {
                    console.log(`${player.name} crashed into a wall!`);
                    // Handle collision
                }
            }
        });
    });
}

// Main game loop
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    gameState.clock += deltaTime;
    
    if (gameState.gameStarted) {
        // Update all players
        Object.values(gameState.players).forEach(player => {
            updatePlayerMovement(player, deltaTime);
        });
        
        // Check for collisions
        checkCollisions();
        
        // Update directional light to create moving light effect
        directionalLight.position.x = Math.sin(gameState.clock * 0.5) * 10;
        directionalLight.position.z = Math.cos(gameState.clock * 0.3) * 10;
    }
    
    renderer.render(scene, camera);
}

// Start the game when the page loads
window.addEventListener('load', initGame);
