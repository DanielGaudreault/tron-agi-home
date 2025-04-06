// Game Configuration
const CONFIG = {
    gridSize: 100,
    cellSize: 2,
    gridColor: 0x003300,
    lightColor: 0x00ffff,
    buildingColors: [0x111122, 0x112211, 0x221111],
    playerColors: [0x00ffff, 0xff00ff, 0xffff00, 0xff8800],
    moveSpeed: 0.1,
    wallHeight: 2,
    wallOpacity: 0.8,
    fov: 75,
    cameraDistance: 30,
    cameraHeight: 15
};

// Game State
const gameState = {
    players: {},
    walls: [],
    buildings: [],
    myPlayerId: null,
    gameStarted: false,
    keys: {}
};

// Three.js Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x222222);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0x00ffff, 1);
directionalLight.position.set(1, 1, 1);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Create Grid
function createGrid() {
    const grid = new THREE.Group();
    
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
    grid.add(ground);
    
    // Grid lines
    const gridHelper = new THREE.GridHelper(
        CONFIG.gridSize * CONFIG.cellSize,
        CONFIG.gridSize,
        CONFIG.lightColor,
        CONFIG.lightColor
    );
    gridHelper.position.y = 0.1;
    grid.add(gridHelper);
    
    return grid;
}

// Create Buildings
function createBuildings() {
    const halfSize = CONFIG.gridSize / 2;
    
    for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * CONFIG.gridSize - halfSize);
        const z = Math.floor(Math.random() * CONFIG.gridSize - halfSize);
        
        // Don't place in center
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
        
        const width = Math.floor(Math.random() * 5) + 2;
        const depth = Math.floor(Math.random() * 5) + 2;
        const height = Math.floor(Math.random() * 10) + 5;
        const color = CONFIG.buildingColors[i % CONFIG.buildingColors.length];
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: 0x001111,
            transparent: true,
            opacity: 0.8
        });
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, height/2, z);
        building.castShadow = true;
        scene.add(building);
        
        // Add edges
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: CONFIG.lightColor })
        );
        line.position.copy(building.position);
        scene.add(line);
        
        gameState.buildings.push(building);
    }
}

// Create Player
function createPlayer(color) {
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(1.5, 2.5, 1);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.8;
    group.add(head);
    
    // Trail
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

// Create Wall
function createWall(start, end, color) {
    const length = Math.sqrt(
        Math.pow(end.x - start.x, 2) + 
        Math.pow(end.z - start.z, 2)
    );
    const angle = Math.atan2(end.z - start.z, end.x - start.x);
    
    const geometry = new THREE.BoxGeometry(length, CONFIG.wallHeight, 0.5);
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
    return wall;
}

// Initialize Game
function initGame() {
    scene.add(createGrid());
    createBuildings();
    
    camera.position.set(0, CONFIG.cameraHeight, CONFIG.cameraDistance);
    camera.lookAt(0, 0, 0);
    
    // Start button
    document.getElementById('start-button').addEventListener('click', startGame);
    
    // Also allow Enter key to start
    document.getElementById('player-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGame();
        }
    });
    
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.code] = true;
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
    });
    window.addEventListener('keyup', (e) => {
        gameState.keys[e.code] = false;
    });
    
    animate();
}

// Start Game
function startGame() {
    const playerName = document.getElementById('player-name').value.trim() || 'Player';
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    document.querySelector('.player-name').textContent = playerName.toUpperCase();
    
    // Create player
    gameState.myPlayerId = 'player-' + Math.random().toString(36).substr(2, 9);
    const color = CONFIG.playerColors[0];
    gameState.players[gameState.myPlayerId] = {
        id: gameState.myPlayerId,
        name: playerName,
        x: 0,
        z: 0,
        color: color,
        model: createPlayer(color),
        direction: { x: 0, z: 0 },
        speed: CONFIG.moveSpeed,
        lastWallTime: 0
    };
    scene.add(gameState.players[gameState.myPlayerId].model);
    
    // Add AI players
    addAIPlayer('Rinzler', -10, 0, CONFIG.playerColors[1]);
    addAIPlayer('Quorra', 10, 0, CONFIG.playerColors[2]);
    addAIPlayer('CLU', 0, -10, CONFIG.playerColors[3]);
    
    gameState.gameStarted = true;
}

function addAIPlayer(name, x, z, color) {
    const id = 'ai-' + Math.random().toString(36).substr(2, 9);
    gameState.players[id] = {
        id,
        name,
        x,
        z,
        color,
        model: createPlayer(color),
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

// Game Loop
function animate() {
    requestAnimationFrame(animate);
    
    if (gameState.gameStarted) {
        // Update players
        Object.values(gameState.players).forEach(player => {
            updatePlayer(player);
        });
        
        // Check collisions
        checkCollisions();
        
        // Update UI
        if (gameState.myPlayerId && gameState.players[gameState.myPlayerId]) {
            const player = gameState.players[gameState.myPlayerId];
            document.getElementById('player-position').textContent = 
                `${Math.floor(player.x)},${Math.floor(player.z)}`;
            document.getElementById('player-count').textContent = 
                Object.keys(gameState.players).length;
        }
    }
    
    renderer.render(scene, camera);
}

function updatePlayer(player) {
    const oldX = player.x;
    const oldZ = player.z;
    
    // Handle input
    if (player.id === gameState.myPlayerId) {
        player.direction = { x: 0, z: 0 };
        if (gameState.keys['ArrowUp'] || gameState.keys['KeyW']) player.direction.z = -1;
        if (gameState.keys['ArrowDown'] || gameState.keys['KeyS']) player.direction.z = 1;
        if (gameState.keys['ArrowLeft'] || gameState.keys['KeyA']) player.direction.x = -1;
        if (gameState.keys['ArrowRight'] || gameState.keys['KeyD']) player.direction.x = 1;
        
        // Normalize diagonal
        if (player.direction.x !== 0 && player.direction.z !== 0) {
            player.direction.x *= 0.7071;
            player.direction.z *= 0.7071;
        }
    } 
    // AI movement
    else if (player.isAI) {
        player.lastTurn++;
        if (player.lastTurn > 100 || Math.random() < 0.01) {
            player.direction = {
                x: Math.random() > 0.5 ? 1 : -1,
                z: Math.random() > 0.5 ? 1 : -1
            };
            player.lastTurn = 0;
        }
    }
    
    // Update position
    const newX = player.x + player.direction.x * player.speed;
    const newZ = player.z + player.direction.z * player.speed;
    
    // Create wall if moving
    if ((player.direction.x !== 0 || player.direction.z !== 0) && 
        Date.now() - player.lastWallTime > 100) {
        const wall = createWall(
            { x: player.x, z: player.z },
            { x: newX, z: newZ },
            player.color
        );
        scene.add(wall);
        gameState.walls.push(wall);
        player.lastWallTime = Date.now();
    }
    
    player.x = newX;
    player.z = newZ;
    player.model.position.set(player.x, 0, player.z);
    
    // Face direction
    if (player.direction.x !== 0 || player.direction.z !== 0) {
        player.model.rotation.y = Math.atan2(player.direction.x, -player.direction.z);
    }
    
    // Update camera
    if (player.id === gameState.myPlayerId) {
        camera.position.set(player.x - 10, CONFIG.cameraHeight, player.z + CONFIG.cameraDistance);
        camera.lookAt(player.x, 0, player.z);
    }
}

function checkCollisions() {
    // Clean up walls
    if (gameState.walls.length > 200) {
        const toRemove = gameState.walls.splice(0, 50);
        toRemove.forEach(wall => scene.remove(wall));
    }
    
    // Check collisions
    Object.values(gameState.players).forEach(player => {
        // Check boundaries
        if (Math.abs(player.x) > CONFIG.gridSize/2 - 1 || 
            Math.abs(player.z) > CONFIG.gridSize/2 - 1) {
            handleCrash(player);
            return;
        }
        
        // Check walls
        gameState.walls.forEach(wall => {
            const dist = Math.sqrt(
                Math.pow(player.x - wall.position.x, 2) + 
                Math.pow(player.z - wall.position.z, 2)
            );
            if (dist < 0.8) {
                handleCrash(player);
            }
        });
    });
}

function handleCrash(player) {
    // Visual effect
    player.model.traverse(child => {
        if (child.material) {
            child.material.color.setHex(0xff0000);
        }
    });
    
    // Remove player
    setTimeout(() => {
        scene.remove(player.model);
        delete gameState.players[player.id];
        
        // Game over if player crashed
        if (player.id === gameState.myPlayerId) {
            alert("GAME OVER\nYou crashed into a wall!");
            document.getElementById('start-screen').style.display = 'flex';
            document.getElementById('game-ui').style.display = 'none';
            gameState.gameStarted = false;
            
            // Reset game state
            gameState.players = {};
            gameState.walls.forEach(wall => scene.remove(wall));
            gameState.walls = [];
        }
    }, 500);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game
initGame();
