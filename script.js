// Game Configuration
const CONFIG = {
    gridSize: 120,
    cellSize: 2,
    gridColor: 0x003300,
    lightColor: 0x00ffff,
    buildingColors: [0x111122, 0x112211, 0x221111, 0x121212],
    playerColors: [0x00ffff, 0xff00ff, 0xffff00, 0xff8800],
    moveSpeed: 0.15,
    wallHeight: 2.5,
    wallOpacity: 0.85,
    fov: 80,
    cameraDistance: 35,
    cameraHeight: 20,
    maxWalls: 300,
    wallSegmentDistance: 0.5,
    aiTurnFrequency: 120,
    speedBoostMultiplier: 1.5,
    boostDuration: 3000,
    powerUpCount: 5
};

// Game State
const gameState = {
    scene: null,
    camera: null,
    renderer: null,
    players: {},
    walls: [],
    buildings: [],
    powerUps: [],
    myPlayerId: null,
    gameStarted: false,
    keys: {},
    lastTime: 0,
    isMobile: /Mobi|Android/i.test(navigator.userAgent),
    score: 0
};

// Initialize Three.js
function initThreeJS() {
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x000011);
    
    gameState.camera = new THREE.PerspectiveCamera(
        CONFIG.fov,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    
    gameState.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    gameState.renderer.shadowMap.enabled = true;
    gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(gameState.renderer.domElement);
}

// Create Grid
function createGrid() {
    const grid = new THREE.Group();
    
    const groundGeometry = new THREE.PlaneGeometry(
        CONFIG.gridSize * CONFIG.cellSize,
        CONFIG.gridSize * CONFIG.cellSize,
        CONFIG.gridSize,
        CONFIG.gridSize
    );
    
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: CONFIG.gridColor,
        emissive: 0x001100,
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide,
        shininess: 100
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    grid.add(ground);
    
    const gridHelper = new THREE.GridHelper(
        CONFIG.gridSize * CONFIG.cellSize,
        CONFIG.gridSize,
        CONFIG.lightColor,
        new THREE.Color(CONFIG.lightColor).multiplyScalar(0.7)
    );
    gridHelper.position.y = 0.1;
    grid.add(gridHelper);
    
    // Grid pulse animation
    function animateGrid() {
        const intensity = 0.2 * Math.sin(Date.now() * 0.001) + 0.8;
        gridHelper.material.opacity = intensity * 0.6;
        requestAnimationFrame(animateGrid);
    }
    animateGrid();
    
    return grid;
}

// Create Buildings
function createBuildings() {
    const halfSize = CONFIG.gridSize / 2;
    const exclusionZone = 15;
    
    for (let i = 0; i < 40; i++) {
        const x = Math.floor(Math.random() * (CONFIG.gridSize - exclusionZone * 2) - halfSize + exclusionZone);
        const z = Math.floor(Math.random() * (CONFIG.gridSize - exclusionZone * 2) - halfSize + exclusionZone);
        
        const width = Math.floor(Math.random() * 6) + 3;
        const depth = Math.floor(Math.random() * 6) + 3;
        const height = Math.floor(Math.random() * 12) + 6;
        const color = CONFIG.buildingColors[Math.floor(Math.random() * CONFIG.buildingColors.length)];
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: 0x001111,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.85,
            shininess: 50
        });
        
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, height/2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        gameState.scene.add(building);
        
        // Add edges
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: CONFIG.lightColor,
            linewidth: 2
        });
        const line = new THREE.LineSegments(edges, lineMaterial);
        line.position.copy(building.position);
        gameState.scene.add(line);
        
        gameState.buildings.push(building);
    }
}

// Create Player
function createPlayer(color, isAI = false) {
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.7, 0.5, 2.5, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.8,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    group.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0, 1.2);
    group.add(head);
    
    // Trail
    const trailGeometry = new THREE.ConeGeometry(0.3, 2, 6);
    const trailMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.rotation.x = Math.PI;
    trail.position.set(0, 0, -1.5);
    group.add(trail);
    
    // Player glow
    if (!isAI) {
        const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
    }
    
    return group;
}

// Create Wall
function createWall(start, end, color) {
    const length = Math.sqrt(
        Math.pow(end.x - start.x, 2) + 
        Math.pow(end.z - start.z, 2)
    );
    const angle = Math.atan2(end.z - start.z, end.x - start.x);
    
    const geometry = new THREE.BoxGeometry(length, CONFIG.wallHeight, 0.3);
    const material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: CONFIG.wallOpacity,
        blending: THREE.AdditiveBlending
    });
    
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(
        (start.x + end.x) / 2,
        CONFIG.wallHeight / 2,
        (start.z + end.z) / 2
    );
    wall.rotation.y = -angle;
    wall.castShadow = true;
    wall.userData.pulse = 0;
    
    return wall;
}

// Create Power-up
function createPowerUp(x, z) {
    const geometry = new THREE.TorusGeometry(0.8, 0.2, 8, 24);
    const material = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        emissive: 0x00aa00,
        emissiveIntensity: 0.8
    });
    
    const powerUp = new THREE.Mesh(geometry, material);
    powerUp.position.set(x, 1.5, z);
    powerUp.rotation.x = Math.PI / 2;
    powerUp.castShadow = true;
    
    powerUp.userData = {
        rotationSpeed: 0.02,
        pulseSpeed: 0.05,
        pulseSize: 0
    };
    
    gameState.scene.add(powerUp);
    gameState.powerUps.push(powerUp);
    
    return powerUp;
}

// Initialize Game
function initGame() {
    initThreeJS();
    gameState.scene.add(createGrid());
    createBuildings();
    
    // Create power-ups
    for (let i = 0; i < CONFIG.powerUpCount; i++) {
        const x = Math.random() * CONFIG.gridSize - CONFIG.gridSize/2;
        const z = Math.random() * CONFIG.gridSize - CONFIG.gridSize/2;
        createPowerUp(x, z);
    }
    
    gameState.camera.position.set(0, CONFIG.cameraHeight, CONFIG.cameraDistance);
    gameState.camera.lookAt(0, 0, 0);
    
    // Event listeners
    document.getElementById('enter-button').addEventListener('click', startGame);
    document.getElementById('player-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startGame();
    });
    
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code)) {
            gameState.keys[e.code] = true;
            e.preventDefault();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code)) {
            gameState.keys[e.code] = false;
            e.preventDefault();
        }
    });
    
    // Mobile controls
    if (gameState.isMobile) {
        const setupMobileButton = (id, keyCode) => {
            const btn = document.getElementById(id);
            btn.addEventListener('touchstart', () => gameState.keys[keyCode] = true, { passive: true });
            btn.addEventListener('touchend', () => gameState.keys[keyCode] = false, { passive: true });
            btn.addEventListener('touchcancel', () => gameState.keys[keyCode] = false, { passive: true });
        };
        
        setupMobileButton('up-btn', 'ArrowUp');
        setupMobileButton('left-btn', 'ArrowLeft');
        setupMobileButton('down-btn', 'ArrowDown');
        setupMobileButton('right-btn', 'ArrowRight');
    }
    
    // Window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start game loop
    gameState.lastTime = performance.now();
    animate();
}

// Start Game
function startGame() {
    const playerName = document.getElementById('player-name').value.trim() || 'USER';
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-ui').classList.add('active');
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
        lastWallTime: 0,
        isBoosting: false,
        boostEndTime: 0,
        score: 0,
        wallsCreated: 0
    };
    gameState.scene.add(gameState.players[gameState.myPlayerId].model);
    
    // Add AI players
    addAIPlayer('RINZLER', -15, 0, CONFIG.playerColors[1], 'aggressive');
    addAIPlayer('QUORRA', 15, 0, CONFIG.playerColors[2], 'defensive');
    addAIPlayer('CLU', 0, -15, CONFIG.playerColors[3], 'random');
    addAIPlayer('TRON', 0, 15, 0xffffff, 'patrol');
    
    gameState.gameStarted = true;
    gameState.score = 0;
}

// Add AI Player
function addAIPlayer(name, x, z, color, behavior = 'random') {
    const id = 'ai-' + Math.random().toString(36).substr(2, 9);
    gameState.players[id] = {
        id,
        name,
        x,
        z,
        color,
        model: createPlayer(color, true),
        direction: { 
            x: Math.random() > 0.5 ? 1 : -1, 
            z: Math.random() > 0.5 ? 1 : -1 
        },
        speed: CONFIG.moveSpeed * 0.7,
        lastTurn: 0,
        isAI: true,
        behavior,
        targetX: 0,
        targetZ: 0,
        wallsCreated: 0
    };
    
    if (behavior === 'patrol') {
        gameState.players[id].targetX = Math.random() * CONFIG.gridSize - CONFIG.gridSize/2;
        gameState.players[id].targetZ = Math.random() * CONFIG.gridSize - CONFIG.gridSize/2;
    }
    
    gameState.scene.add(gameState.players[id].model);
}

// Game Loop
function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now();
    const deltaTime = time - gameState.lastTime;
    gameState.lastTime = time;
    
    if (gameState.gameStarted) {
        updatePlayers(deltaTime);
        updateWalls();
        updatePowerUps();
        checkCollisions();
        updateUI();
        updateCamera();
    }
    
    gameState.renderer.render(gameState.scene, gameState.camera);
}

// Update Players
function updatePlayers(deltaTime) {
    Object.values(gameState.players).forEach(player => {
        const oldX = player.x;
        const oldZ = player.z;
        
        if (player.id === gameState.myPlayerId) {
            updateHumanPlayer(player);
        } else {
            updateAIPlayer(player, deltaTime);
        }
        
        if ((player.direction.x !== 0 || player.direction.z !== 0) && 
            Date.now() - player.lastWallTime > 100) {
            createWallSegment(player, oldX, oldZ);
            player.lastWallTime = Date.now();
            player.wallsCreated++;
        }
        
        const speedMultiplier = player.isBoosting ? CONFIG.speedBoostMultiplier : 1;
        player.x += player.direction.x * player.speed * speedMultiplier;
        player.z += player.direction.z * player.speed * speedMultiplier;
        player.model.position.set(player.x, 0, player.z);
        
        if (player.direction.x !== 0 || player.direction.z !== 0) {
            player.model.rotation.y = Math.atan2(player.direction.x, -player.direction.z);
        }
        
        if (player.isBoosting && Date.now() > player.boostEndTime) {
            player.isBoosting = false;
            if (player.id === gameState.myPlayerId) {
                document.querySelector('.player-score').textContent = `SPEED: 100%`;
            }
        }
    });
}

// Update Human Player
function updateHumanPlayer(player) {
    player.direction = { x: 0, z: 0 };
    
    if (gameState.keys['ArrowUp'] || gameState.keys['KeyW']) player.direction.z = -1;
    if (gameState.keys['ArrowDown'] || gameState.keys['KeyS']) player.direction.z = 1;
    if (gameState.keys['ArrowLeft'] || gameState.keys['KeyA']) player.direction.x = -1;
    if (gameState.keys['ArrowRight'] || gameState.keys['KeyD']) player.direction.x = 1;
    
    if ((gameState.keys['Space'] || gameState.keys['ShiftLeft']) && !player.isBoosting) {
        player.isBoosting = true;
        player.boostEndTime = Date.now() + CONFIG.boostDuration;
        document.querySelector('.player-score').textContent = 
            `SPEED: ${Math.floor(CONFIG.speedBoostMultiplier * 100)}%`;
    }
    
    if (player.direction.x !== 0 && player.direction.z !== 0) {
        player.direction.x *= 0.7071;
        player.direction.z *= 0.7071;
    }
}

// Update AI Player
function updateAIPlayer(player, deltaTime) {
    player.lastTurn += deltaTime;
    
    switch(player.behavior) {
        case 'aggressive':
            if (gameState.myPlayerId && gameState.players[gameState.myPlayerId]) {
                const target = gameState.players[gameState.myPlayerId];
                const dx = target.x - player.x;
                const dz = target.z - player.z;
                const distance = Math.sqrt(dx*dx + dz*dz);
                
                if (distance < 30 && player.lastTurn > 1000) {
                    player.direction.x = dx / distance;
                    player.direction.z = dz / distance;
                    player.lastTurn = 0;
                }
            }
            break;
            
        case 'defensive':
            if (player.lastTurn > 500) {
                let newDirX = player.direction.x;
                let newDirZ = player.direction.z;
                
                const futureX = player.x + player.direction.x * 5;
                const futureZ = player.z + player.direction.z * 5;
                
                if (Math.abs(futureX) > CONFIG.gridSize/2 - 5) {
                    newDirX = -player.direction.x;
                    newDirZ = Math.random() > 0.5 ? 1 : -1;
                }
                
                if (Math.abs(futureZ) > CONFIG.gridSize/2 - 5) {
                    newDirZ = -player.direction.z;
                    newDirX = Math.random() > 0.5 ? 1 : -1;
                }
                
                player.direction.x = newDirX;
                player.direction.z = newDirZ;
                player.lastTurn = 0;
            }
            break;
            
        case 'patrol':
            const dx = player.targetX - player.x;
            const dz = player.targetZ - player.z;
            const distance = Math.sqrt(dx*dx + dz*dz);
            
            if (distance < 5 || player.lastTurn > 3000) {
                player.targetX = Math.random() * CONFIG.gridSize - CONFIG.gridSize/2;
                player.targetZ = Math.random() * CONFIG.gridSize - CONFIG.gridSize/2;
                player.lastTurn = 0;
            } else {
                player.direction.x = dx / distance;
                player.direction.z = dz / distance;
            }
            break;
            
        default:
            if (player.lastTurn > 2000 || Math.random() < 0.01) {
                player.direction = {
                    x: Math.random() > 0.5 ? 1 : -1,
                    z: Math.random() > 0.5 ? 1 : -1
                };
                player.lastTurn = 0;
            }
    }
    
    if (!player.isBoosting && Math.random() < 0.001) {
        player.isBoosting = true;
        player.boostEndTime = Date.now() + CONFIG.boostDuration;
    }
    
    if (player.isBoosting && Date.now() > player.boostEndTime) {
        player.isBoosting = false;
    }
}

// Create Wall Segment
function createWallSegment(player, oldX, oldZ) {
    const distance = Math.sqrt(
        Math.pow(player.x - oldX, 2) + 
        Math.pow(player.z - oldZ, 2)
    );
    
    if (distance > CONFIG.wallSegmentDistance) {
        const wall = createWall(
            { x: oldX, z: oldZ },
            { x: player.x, z: player.z },
            player.color
        );
        gameState.scene.add(wall);
        gameState.walls.push(wall);
        
        if (player.id === gameState.myPlayerId) {
            gameState.score += Math.floor(distance);
        }
    }
}

// Update Walls
function updateWalls() {
    if (gameState.walls.length > CONFIG.maxWalls) {
        const toRemove = gameState.walls.splice(0, 50);
        toRemove.forEach(wall => gameState.scene.remove(wall));
    }
    
    gameState.walls.forEach(wall => {
        wall.userData.pulse = (wall.userData.pulse + 0.05) % (Math.PI * 2);
        wall.material.opacity = CONFIG.wallOpacity * (0.9 + 0.1 * Math.sin(wall.userData.pulse));
    });
}

// Update Power-ups
function updatePowerUps() {
    gameState.powerUps.forEach(powerUp => {
        powerUp.rotation.y += powerUp.userData.rotationSpeed;
        powerUp.userData.pulseSize = Math.sin(Date.now() * powerUp.userData.pulseSpeed) * 0.2;
        powerUp.scale.set(
            1 + powerUp.userData.pulseSize,
            1 + powerUp.userData.pulseSize,
            1 + powerUp.userData.pulseSize
        );
    });
}

// Update Camera
function updateCamera() {
    if (gameState.myPlayerId && gameState.players[gameState.myPlayerId]) {
        const player = gameState.players[gameState.myPlayerId];
        const cameraOffset = player.isBoosting ? 40 : 35;
        const targetX = player.x;
        const targetZ = player.z + cameraOffset;
        
        camera.position.x += (targetX - camera.position.x) * 0.1;
        camera.position.z += (targetZ - camera.position.z) * 0.1;
        camera.lookAt(player.x, 0, player.z);
    }
}

// Check Collisions
function checkCollisions() {
    Object.values(gameState.players).forEach(player => {
        // Boundary check
        if (Math.abs(player.x) > CONFIG.gridSize/2 - 1 || 
            Math.abs(player.z) > CONFIG.gridSize/2 - 1) {
            handleCrash(player);
            return;
        }
        
        // Wall collision
        for (let i = 0; i < gameState.walls.length; i++) {
            const wall = gameState.walls[i];
            const dx = player.x - wall.position.x;
            const dz = player.z - wall.position.z;
            const distance = Math.sqrt(dx*dx + dz*dz);
            
            if (distance < 0.8) {
                handleCrash(player);
                break;
            }
        }
        
        // Power-up collision
        for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
            const powerUp = gameState.powerUps[i];
            const dx = player.x - powerUp.position.x;
            const dz = player.z - powerUp.position.z;
            const distance = Math.sqrt(dx*dx + dz*dz);
            
            if (distance < 1.5) {
                gameState.scene.remove(powerUp);
                gameState.powerUps.splice(i, 1);
                
                if (player.id === gameState.myPlayerId) {
                    player.isBoosting = true;
                    player.boostEndTime = Date.now() + CONFIG.boostDuration;
                    document.querySelector('.player-score').textContent = 
                        `SPEED: ${Math.floor(CONFIG.speedBoostMultiplier * 100)}%`;
                    gameState.score += 100;
                    
                    setTimeout(() => {
                        const x = Math.random() * CONFIG.gridSize - CONFIG.gridSize/2;
                        const z = Math.random() * CONFIG.gridSize - CONFIG.gridSize/2;
                        createPowerUp(x, z);
                    }, 3000);
                }
            }
        }
    });
}

// Handle Crash
function handleCrash(player) {
    // Visual effects
    player.model.traverse(child => {
        if (child.material) {
            child.material.color.setHex(0xff0000);
            child.material.emissive.setHex(0xff0000);
            
            setTimeout(() => {
                if (child.material) {
                    child.material.color.setHex(player.color);
                    child.material.emissive.setHex(player.color);
                }
            }, 200);
        }
    });
    
    createExplosion(player.x, 0, player.z, player.color);
    
    // Remove player
    setTimeout(() => {
        gameState.scene.remove(player.model);
        delete gameState.players[player.id];
        
        if (player.id === gameState.myPlayerId) {
            endGame();
        }
    }, 300);
}

// Create Explosion
function createExplosion(x, y, z, color) {
    const particles = 20;
    const explosionGroup = new THREE.Group();
    
    for (let i = 0; i < particles; i++) {
        const size = Math.random() * 0.5 + 0.2;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.set(x, y, z);
        
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.1,
                (Math.random() - 0.5) * 0.2
            ),
            lifetime: 0,
            maxLifetime: 1000 + Math.random() * 500
        };
        
        explosionGroup.add(particle);
    }
    
    gameState.scene.add(explosionGroup);
    
    function updateParticles() {
        let allDead = true;
        explosionGroup.children.forEach(particle => {
            if (particle.userData.lifetime < particle.userData.maxLifetime) {
                particle.position.add(particle.userData.velocity);
                particle.material.opacity = 0.8 * (1 - particle.userData.lifetime / particle.userData.maxLifetime);
                particle.userData.lifetime += 16;
                allDead = false;
            }
        });
        
        if (!allDead) {
            requestAnimationFrame(updateParticles);
        } else {
            gameState.scene.remove(explosionGroup);
        }
    }
    
    updateParticles();
}

// Update UI
function updateUI() {
    if (gameState.myPlayerId && gameState.players[gameState.myPlayerId]) {
        const player = gameState.players[gameState.myPlayerId];
        document.getElementById('player-position').textContent = 
            `${Math.floor(player.x)},${Math.floor(player.z)}`;
        document.getElementById('player-count').textContent = 
            Object.keys(gameState.players).length;
        document.getElementById('trail-length').textContent = 
            player.wallsCreated;
        
        if (player.isBoosting) {
            const boostRemaining = Math.max(0, player.boostEndTime - Date.now());
            const boostPercent = Math.floor((boostRemaining / CONFIG.boostDuration) * 100);
            document.querySelector('.player-score').textContent = 
                `SPEED: ${Math.floor(CONFIG.speedBoostMultiplier * 100)}% (${boostPercent}%)`;
        }
    }
}

// End Game
function endGame() {
    const player = gameState.players[gameState.myPlayerId];
    const score = gameState.score;
    const trailLength = player?.wallsCreated || 0;
    
    alert(`GAME OVER\nSCORE: ${score}\nTRAIL LENGTH: ${trailLength}`);
    
    document.getElementById('start-screen').style.display = 'flex';
    document.getElementById('game-ui').classList.remove('active');
    gameState.gameStarted = false;
    
    // Reset game state
    gameState.players = {};
    gameState.walls.forEach(wall => gameState.scene.remove(wall));
    gameState.walls = [];
    gameState.powerUps.forEach(powerUp => gameState.scene.remove(powerUp));
    gameState.powerUps = [];
    
    // Clear scene
    while(gameState.scene.children.length > 0) { 
        gameState.scene.remove(gameState.scene.children[0]); 
    }
    
    // Reinitialize
    initGame();
}

// Window Resize
function onWindowResize() {
    gameState.camera.aspect = window.innerWidth / window.innerHeight;
    gameState.camera.updateProjectionMatrix();
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize on load
window.addEventListener('load', initGame);
