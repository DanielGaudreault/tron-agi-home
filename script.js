// ================ ENHANCED TRON GAME ================
// Improved version with boundaries, detailed players, and collisions

// Enhanced Configuration
const CONFIG = {
    gridSize: 100,
    cellSize: 2,
    gridColor: 0x003300,
    lightColor: 0x00ffff,
    buildingColors: [0x111122, 0x112211, 0x221111],
    playerColors: [0x00ffff, 0xff00ff, 0xffff00, 0xff8800],
    moveSpeed: 0.15,
    turnSpeed: 0.1,
    wallHeight: 2,
    wallOpacity: 0.8,
    fov: 75,
    cameraDistance: 30,
    cameraHeight: 15,
    gridBoundary: 0.5, // How close players can get to edge
    buildingPadding: 1.2 // Space around buildings for collision
};

// Enhanced Game State
const gameState = {
    players: {},
    walls: [],
    buildings: [],
    myPlayerId: null,
    playerName: "",
    gameStarted: false,
    lastWallTime: 0,
    wallInterval: 100,
    clock: 0,
    gridBoundary: CONFIG.gridSize/2 - CONFIG.gridBoundary
};

// Initialize the enhanced game
function initGame() {
    // Three.js Setup (same as before)
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    
    camera = new THREE.PerspectiveCamera(
        CONFIG.fov,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    setupLighting();
    createWorld();
    setupEventListeners();
    animate();
}

// Enhanced Player Model
function createPlayerModel(color) {
    const group = new THREE.Group();
    
    // Main body (more detailed)
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.6, 2.5, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.6,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    body.castShadow = true;
    group.add(body);

    // Head (more detailed)
    const headGeometry = new THREE.DodecahedronGeometry(0.7, 1);
    const headMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.8
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0;
    head.position.z = 1.2;
    head.castShadow = true;
    group.add(head);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 6);
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.8, 0, 0.5);
    leftArm.rotation.z = Math.PI / 3;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.8, 0, 0.5);
    rightArm.rotation.z = -Math.PI / 3;
    group.add(rightArm);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 6);
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.4, 0, -0.8);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.4, 0, -0.8);
    group.add(rightLeg);

    // Light trail (more elaborate)
    const trailGroup = new THREE.Group();
    const trailGeometry = new THREE.CylinderGeometry(0.3, 0.1, 3, 8);
    const trailMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        transparent: true,
        opacity: 0.8
    });
    
    for (let i = 0; i < 3; i++) {
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.z = -1.5 - (i * 0.3);
        trail.rotation.x = Math.PI / 2;
        trail.scale.set(1, 1, 1 - (i * 0.2));
        trailGroup.add(trail);
    }
    group.add(trailGroup);

    // Glowing aura
    const auraGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    const auraMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const aura = new THREE.Mesh(auraGeometry, auraMaterial);
    group.add(aura);

    return group;
}

// Enhanced movement with boundaries
function updatePlayerMovement(player, deltaTime) {
    const oldX = player.x;
    const oldZ = player.z;
    
    // Handle input
    if (player.id === gameState.myPlayerId) {
        handlePlayerInput(player);
    } else if (player.isAI) {
        handleAIInput(player, deltaTime);
    }
    
    // Calculate proposed new position
    let newX = player.x + player.direction.x * player.speed;
    let newZ = player.z + player.direction.z * player.speed;
    
    // Enforce grid boundaries
    newX = Math.max(-gameState.gridBoundary, Math.min(gameState.gridBoundary, newX));
    newZ = Math.max(-gameState.gridBoundary, Math.min(gameState.gridBoundary, newZ));
    
    // Check building collisions
    if (checkBuildingCollision(newX, newZ)) {
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
        Date.now() - player.lastWallTime > gameState.wallInterval) {
        createPlayerWall(player, newX, newZ);
        player.lastWallTime = Date.now();
    }
    
    // Update position
    player.x = newX;
    player.z = newZ;
    player.model.position.set(player.x, 0, player.z);
    
    // Rotate model to face direction
    if (player.direction.x !== 0 || player.direction.z !== 0) {
        player.model.rotation.y = Math.atan2(
            player.direction.x, 
            -player.direction.z
        );
    }
    
    // Update camera for human player
    if (player.id === gameState.myPlayerId) {
        updateCamera(player);
        updateUI(player);
    }
}

// Handle player input with smoother turning
function handlePlayerInput(player) {
    const turnSpeed = CONFIG.turnSpeed;
    
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
    player.direction.x = lerp(player.direction.x, desiredX, turnSpeed);
    player.direction.z = lerp(player.direction.z, desiredZ, turnSpeed);
    
    // Normalize after interpolation
    const len = Math.sqrt(player.direction.x**2 + player.direction.z**2);
    if (len > 0) {
        player.direction.x /= len;
        player.direction.z /= len;
    }
}

// Linear interpolation helper
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Enhanced AI with better pathfinding
function handleAIInput(player, deltaTime) {
    player.lastTurn += deltaTime;
    
    // Turn randomly or when near edge/building
    if (player.lastTurn > 2 || 
        Math.abs(player.x) > gameState.gridBoundary - 2 ||
        Math.abs(player.z) > gameState.gridBoundary - 2 ||
        checkBuildingCollision(
            player.x + player.direction.x * 3,
            player.z + player.direction.z * 3
        )) {
        
        // Try to find a clear direction
        const angles = [0, Math.PI/2, Math.PI, -Math.PI/2];
        const shuffled = angles.sort(() => Math.random() - 0.5);
        
        for (const angle of shuffled) {
            const testX = Math.cos(angle);
            const testZ = Math.sin(angle);
            
            if (!checkBuildingCollision(
                player.x + testX * 3,
                player.z + testZ * 3
            )) {
                player.direction.x = testX;
                player.direction.z = testZ;
                break;
            }
        }
        
        player.lastTurn = 0;
    }
}

// Check if position collides with any building
function checkBuildingCollision(x, z) {
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

// Enhanced collision detection
function checkCollisions() {
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
            handlePlayerCrash(player);
            return;
        }
        
        // Check wall collisions
        for (const wall of gameState.walls) {
            if (wall.owner !== player.id) {
                if (checkWallCollision(player, wall)) {
                    handlePlayerCrash(player);
                    break;
                }
            }
        }
    });
}

// Precise wall collision checking
function checkWallCollision(player, wall) {
    const playerRadius = 0.8;
    const wallThickness = 0.5;
    
    // Convert wall to line segment
    const wallStart = new THREE.Vector2(wall.start.x, wall.start.z);
    const wallEnd = new THREE.Vector2(wall.end.x, wall.end.z);
    const playerPos = new THREE.Vector2(player.x, player.z);
    
    // Find closest point on wall segment to player
    const closest = playerPos.clampToLineSegment(wallStart, wallEnd);
    const distance = playerPos.distanceTo(closest);
    
    return distance < playerRadius + wallThickness/2;
}

// Add Vector2 extension for line segment clamp
THREE.Vector2.prototype.clampToLineSegment = function(v1, v2) {
    const x1 = v1.x, y1 = v1.y;
    const x2 = v2.x, y2 = v2.y;
    const xp = this.x, yp = this.y;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx*dx + dy*dy;
    
    if (l2 === 0) return v1.clone();
    
    let t = ((xp - x1) * dx + (yp - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    
    return new THREE.Vector2(x1 + t * dx, y1 + t * dy);
};

// Handle player crash
function handlePlayerCrash(player) {
    console.log(`${player.name} crashed!`);
    
    // Visual effect
    player.model.traverse(child => {
        if (child.material) {
            child.material.emissive.setHex(0xff0000);
            child.material.color.setHex(0xff0000);
        }
    });
    
    // Remove from game after delay
    setTimeout(() => {
        scene.remove(player.model);
        delete gameState.players[player.id];
        
        // Update UI
        if (player.id === gameState.myPlayerId) {
            uiElements.score.textContent = `Players: ${Object.keys(gameState.players).length}`;
            alert("Game Over! You crashed.");
        }
    }, 500);
}

// Initialize the enhanced game
window.addEventListener('load', initGame);
