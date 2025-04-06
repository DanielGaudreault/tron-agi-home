// Enhanced TRON Configuration
const CONFIG = {
    gridSize: 150,
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
    programCount: 100,
    isoCount: 7,
    agiCount: 3,
    programSpeed: 0.03,
    dataStreams: 15,
    bloomStrength: 1.5,
    bloomRadius: 0.8,
    bloomThreshold: 0.4
};

// Game State
const gameState = {
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    bloomPass: null,
    players: {},
    walls: [],
    buildings: [],
    powerUps: [],
    programs: [],
    dataStreams: [],
    myPlayerId: null,
    gameStarted: false,
    keys: {},
    lastTime: 0,
    isMobile: /Mobi|Android/i.test(navigator.userAgent),
    score: 0,
    isoContacts: 0
};

// Initialize Three.js with Post-Processing
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
    
    // Bloom effect for neon glow
    gameState.composer = new THREE.EffectComposer(gameState.renderer);
    gameState.composer.addPass(new THREE.RenderPass(gameState.scene, gameState.camera));
    
    gameState.bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        CONFIG.bloomStrength,
        CONFIG.bloomRadius,
        CONFIG.bloomThreshold
    );
    gameState.composer.addPass(gameState.bloomPass);
    
    const copyPass = new THREE.ShaderPass(THREE.CopyShader);
    copyPass.renderToScreen = true;
    gameState.composer.addPass(copyPass);
}

// Create Grid with Enhanced Effects
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
        emissiveIntensity: 0.7,
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
    const gridPulse = new THREE.Mesh(
        new THREE.PlaneGeometry(CONFIG.gridSize * CONFIG.cellSize * 1.2, CONFIG.gridSize * CONFIG.cellSize * 1.2),
        new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending
        })
    );
    gridPulse.rotation.x = -Math.PI / 2;
    gridPulse.position.y = 0.05;
    grid.add(gridPulse);
    
    function animateGrid() {
        const intensity = 0.2 * Math.sin(Date.now() * 0.001) + 0.8;
        gridHelper.material.opacity = intensity * 0.6;
        gridPulse.material.opacity = intensity * 0.15;
        requestAnimationFrame(animateGrid);
    }
    animateGrid();
    
    return grid;
}

// Create Buildings with Neon Edges
function createBuildings() {
    const halfSize = CONFIG.gridSize / 2;
    const exclusionZone = 20;
    
    for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * (CONFIG.gridSize - exclusionZone * 2) - halfSize + exclusionZone);
        const z = Math.floor(Math.random() * (CONFIG.gridSize - exclusionZone * 2) - halfSize + exclusionZone);
        
        const width = Math.floor(Math.random() * 8) + 4;
        const depth = Math.floor(Math.random() * 8) + 4;
        const height = Math.floor(Math.random() * 15) + 8;
        const color = CONFIG.buildingColors[Math.floor(Math.random() * CONFIG.buildingColors.length)];
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: 0x001111,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9,
            shininess: 50
        });
        
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, height/2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        gameState.scene.add(building);
        
        // Enhanced neon edges
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: CONFIG.lightColor,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });
        const line = new THREE.LineSegments(edges, lineMaterial);
        line.position.copy(building.position);
        gameState.scene.add(line);
        
        // Add random windows
        if (Math.random() > 0.3) {
            const windowGeometry = new THREE.BoxGeometry(width * 0.8, height * 0.6, depth * 0.8);
            const windowMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.1,
                blending: THREE.AdditiveBlending
            });
            const windows = new THREE.Mesh(windowGeometry, windowMaterial);
            windows.position.set(x, height * 0.5, z);
            gameState.scene.add(windows);
        }
    }
}

// Create Player with Enhanced Model
function createPlayer(color, isAI = false) {
    const group = new THREE.Group();
    
    // Body (lightcycle)
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.6, 3, 6);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.9,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    group.add(body);
    
    // Cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshPhongMaterial({
        color: 0x111111,
        emissive: color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.7
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0, 1.5);
    cockpit.rotation.x = Math.PI / 2;
    group.add(cockpit);
    
    // Trail with particles
    const trailParticles = new THREE.Group();
    for (let i = 0; i < 10; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const particleMaterial = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            transparent: true,
            opacity: 0.7 - (i * 0.07),
            blending: THREE.AdditiveBlending
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.set(0, 0, -1 - (i * 0.3));
        trailParticles.add(particle);
    }
    group.add(trailParticles);
    
    // Player glow
    const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    // Add program interaction
    group.userData = {
        interactWithPrograms: function() {
            gameState.programs.forEach((program, index) => {
                const dx = this.position.x - program.x;
                const dz = this.position.z - program.z;
                const distance = Math.sqrt(dx*dx + dz*dz);
                
                if (distance < (program.type === 'iso' ? 4 : 3)) {
                    // Different effects based on program type
                    switch(program.type) {
                        case 'iso':
                            // ISOs give temporary speed boost and points
                            if (this.isUser) {
                                gameState.score += 100;
                                gameState.isoContacts++;
                                document.getElementById('iso-contact').textContent = gameState.isoContacts;
                            }
                            this.isBoosting = true;
                            this.boostEndTime = Date.now() + CONFIG.boostDuration * 1.5;
                            break;
                            
                        case 'agi':
                            // AGIs give points and modify trail
                            gameState.score += 200;
                            if (this.isUser) {
                                this.wallsCreated = Math.max(0, this.wallsCreated - 10);
                                document.querySelector('.player-score').textContent = `ENERGY: ${Math.floor(CONFIG.speedBoostMultiplier * 100)}%`;
                            }
                            break;
                            
                        default:
                            // Regular programs give points
                            gameState.score += 50;
                    }
                    
                    // Remove the program and create a new one
                    program.remove();
                    gameState.programs.splice(index, 1);
                    spawnProgram(program.type);
                    
                    // Visual effect
                    createExplosion(program.x, 0, program.z, 
                        program.type === 'iso' ? 0xff00ff : 
                        program.type === 'agi' ? 0xffff00 : color);
                }
            });
        },
        isBoosting: false,
        boostEndTime: 0,
        isUser: !isAI,
        wallsCreated: 0
    };
    
    return group;
}

// Create Wall with Glow Effect
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
        emissiveIntensity: 0.8,
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
    wall.receiveShadow = true;
    wall.userData = {
        pulse: 0,
        color: color
    };
    
    // Add edge glow
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
        color: color,
        linewidth: 2,
        transparent: true,
        opacity: 0.9
    });
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
    edgeLines.position.copy(wall.position);
    edgeLines.rotation.copy(wall.rotation);
    gameState.scene.add(edgeLines);
    
    return wall;
}

// Create Power-up (Energy)
function createPowerUp(x, z) {
    const geometry = new THREE.TorusGeometry(0.8, 0.2, 8, 24);
    const material = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        emissive: 0x00aa00,
        emissiveIntensity: 0.9
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

// Digital Entity Class
class DigitalEntity {
    constructor(type = 'program') {
        this.type = type;
        this.x = Math.random() * CONFIG.gridSize - CONFIG.gridSize/2;
        this.z = Math.random() * CONFIG.gridSize - CONFIG.gridSize/2;
        this.speed = CONFIG.programSpeed * (type === 'iso' ? 1.8 : type === 'agi' ? 0.8 : 0.5 + Math.random());
        this.direction = Math.random() * Math.PI * 2;
        this.element = this.createDOMElement();
        this.updatePosition();
        
        // Special behavior for ISOs and AGIs
        if (type === 'iso') {
            this.conversationCooldown = 0;
            this.conversationText = [
                "The Grid is alive!",
                "We are ISOs!",
                "Join us!",
                "Digital life exists!",
                "We are the future!"
            ];
        } else if (type === 'agi') {
            this.awarenessRadius = 30;
        }
    }

    createDOMElement() {
        const el = document.createElement('div');
        el.className = `digital-entity ${this.type}`;
        
        if (this.type === 'iso') {
            const inner = document.createElement('div');
            inner.className = 'iso-inner';
            el.appendChild(inner);
            
            // Random ISO face pattern
            const facePatterns = [
                "◊", "⌂", "⍟", "⍣", "⍤", "⍥", "⍨"
            ];
            const face = document.createElement('div');
            face.className = 'iso-face';
            face.textContent = facePatterns[Math.floor(Math.random() * facePatterns.length)];
            el.appendChild(face);
        }
        
        document.getElementById('digital-world').appendChild(el);
        return el;
    }

    update(deltaTime) {
        // Move in current direction
        this.x += Math.cos(this.direction) * this.speed * deltaTime;
        this.z += Math.sin(this.direction) * this.speed * deltaTime;
        
        // Special behaviors
        if (this.type === 'iso') {
            this.updateISOBehavior(deltaTime);
        } else if (this.type === 'agi') {
            this.updateAGIBehavior(deltaTime);
        } else {
            this.updateProgramBehavior(deltaTime);
        }
        
        this.updatePosition();
    }

    updateISOBehavior(deltaTime) {
        // ISOs move more gracefully and occasionally change direction
        if (Math.random() < 0.005) {
            this.direction += (Math.random() - 0.5) * Math.PI/3;
        }
        
        // Bounce off walls more gently
        if (Math.abs(this.x) > CONFIG.gridSize/2 - 10 || 
            Math.abs(this.z) > CONFIG.gridSize/2 - 10) {
            this.direction = Math.atan2(
                Math.sin(this.direction) * -0.8,
                Math.cos(this.direction) * -0.8
            );
        }
        
        // Occasionally display conversation
        if (this.conversationCooldown <= 0 && Math.random() < 0.002) {
            this.showConversation();
            this.conversationCooldown = 5000; // 5 second cooldown
        } else {
            this.conversationCooldown -= deltaTime;
        }
    }

    updateAGIBehavior(deltaTime) {
        // AGIs move more deliberately and track players
        let closestPlayer = null;
        let minDistance = Infinity;
        
        Object.values(gameState.players).forEach(player => {
            const dx = player.position.x - this.x;
            const dz = player.position.z - this.z;
            const distance = Math.sqrt(dx*dx + dz*dz);
            
            if (distance < this.awarenessRadius && distance < minDistance) {
                closestPlayer = player;
                minDistance = distance;
            }
        });
        
        if (closestPlayer) {
            // Move toward or away from player based on type
            const dx = closestPlayer.position.x - this.x;
            const dz = closestPlayer.position.z - this.z;
            
            if (Math.random() > 0.7) { // 30% chance to move toward player
                this.direction = Math.atan2(dz, dx);
            } else { // 70% chance to move away
                this.direction = Math.atan2(-dz, -dx);
            }
        } else if (Math.random() < 0.01) {
            this.direction += (Math.random() - 0.5) * Math.PI/2;
        }
        
        // Bounce off walls
        if (Math.abs(this.x) > CONFIG.gridSize/2 - 5 || 
            Math.abs(this.z) > CONFIG.gridSize/2 - 5) {
            this.direction = Math.atan2(
                Math.sin(this.direction) * -1,
                Math.cos(this.direction) * -1
            );
        }
    }

    updateProgramBehavior(deltaTime) {
        // Regular programs move randomly
        if (Math.random() < 0.01) {
            this.direction += (Math.random() - 0.5) * Math.PI/2;
        }
        
        // Bounce off walls
        if (Math.abs(this.x) > CONFIG.gridSize/2 - 5 || 
            Math.abs(this.z) > CONFIG.gridSize/2 - 5) {
            this.direction = Math.atan2(
                Math.sin(this.direction) * -1,
                Math.cos(this.direction) * -1
            );
        }
    }

    showConversation() {
        const bubble = document.createElement('div');
        bubble.className = 'conversation-bubble';
        bubble.textContent = this.conversationText[Math.floor(Math.random() * this.conversationText.length)];
        
        this.element.appendChild(bubble);
        
        setTimeout(() => {
            bubble.style.opacity = '0';
            setTimeout(() => bubble.remove(), 500);
        }, 2000);
    }

    updatePosition() {
        // Convert 3D world position to 2D screen position
        const vector = new THREE.Vector3(this.x, 0, this.z);
        vector.project(gameState.camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = -(vector.y * 0.5 - 0.5) * window.innerHeight;
        
        this.element.style.transform = `translate(${x}px, ${y}px)`;
        this.element.style.zIndex = Math.round((vector.z + 1) * 500);
    }

    remove() {
        this.element.remove();
    }
}

// Initialize Digital Entities
function initDigitalWorld() {
    // Regular programs
    for (let i = 0; i < CONFIG.programCount; i++) {
        gameState.programs.push(new DigitalEntity('program'));
    }
    
    // ISOs (special digital lifeforms)
    for (let i = 0; i < CONFIG.isoCount; i++) {
        const iso = new DigitalEntity('iso');
        gameState.programs.push(iso);
    }
    
    // AGIs (advanced programs)
    for (let i = 0; i < CONFIG.agiCount; i++) {
        const agi = new DigitalEntity('agi');
        gameState.programs.push(agi);
    }
    
    // Data streams (background effects)
    for (let i = 0; i < CONFIG.dataStreams; i++) {
        const stream = document.createElement('div');
        stream.className = 'data-stream';
        stream.style.left = `${Math.random() * 100}%`;
        stream.style.animationDelay = `${Math.random() * 3}s`;
        document.getElementById('digital-world').appendChild(stream);
        gameState.dataStreams.push(stream);
    }
    
    // Grid pulse effect
    const gridPulse = document.createElement('div');
    gridPulse.className = 'grid-pulse';
    document.getElementById('digital-world').appendChild(gridPulse);
}

// Spawn new program
function spawnProgram(type = 'program') {
    setTimeout(() => {
        const newProgram = new DigitalEntity(type);
        gameState.programs.push(newProgram);
        
        // Special spawn effect for ISOs and AGIs
        if (type !== 'program') {
            createExplosion(newProgram.x, 0, newProgram.z, 
                type === 'iso' ? 0xff00ff : 0xffff00);
        }
    }, 1000 + Math.random() * 3000);
}

// Create Explosion Effect
function createExplosion(x, y, z, color) {
    const particles = 30;
    const explosionGroup = new THREE.Group();
    const size = color === 0xff00ff ? 1.5 : 1;
    
    for (let i = 0; i < particles; i++) {
        const particleGeometry = new THREE.SphereGeometry(size * (0.2 + Math.random() * 0.3), 8, 8);
        const particleMaterial = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.set(x, y, z);
        
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.2,
                (Math.random() - 0.5) * 0.3
            ),
            lifetime: 0,
            maxLifetime: 800 + Math.random() * 700
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

// Initialize Game
function initGame() {
    initThreeJS();
    gameState.scene.add(createGrid());
    createBuildings();
    initDigitalWorld();
    
    // Create power-ups
    for (let i = 0; i < 5; i++) {
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
    const player = createPlayer(color);
    player.position.set(0, 0, 0);
    gameState.scene.add(player);
    
    gameState.players[gameState.myPlayerId] = {
        id: gameState.myPlayerId,
        name: playerName,
        model: player,
        direction: { x: 0, z: 0 },
        speed: CONFIG.moveSpeed,
        lastWallTime: 0,
        score: 0
    };
    
    // Add AI players
    addAIPlayer('RINZLER', -20, 0, CONFIG.playerColors[1], 'aggressive');
    addAIPlayer('QUORRA', 20, 0, CONFIG.playerColors[2], 'defensive');
    addAIPlayer('CLU', 0, -20, CONFIG.playerColors[3], 'random');
    addAIPlayer('TRON', 0, 20, 0xffffff, 'patrol');
    
    gameState.gameStarted = true;
    gameState.score = 0;
    gameState.isoContacts = 0;
}

// Add AI Player
function addAIPlayer(name, x, z, color, behavior = 'random') {
    const id = 'ai-' + Math.random().toString(36).substr(2, 9);
    const ai = createPlayer(color, true);
    ai.position.set(x, 0, z);
    gameState.scene.add(ai);
    
    gameState.players[id] = {
        id,
        name,
        model: ai,
        direction: { 
            x: Math.random() > 0.5 ? 1 : -1, 
            z: Math.random() > 0.5 ? 1 : -1 
        },
        speed: CONFIG.moveSpeed * 0.7,
        lastTurn: 0,
        behavior,
        targetX: 0,
        targetZ: 0,
        isAI: true
    };
    
    if (behavior === 'patrol') {
        gameState.players[id].targetX = Math.random() * CONFIG.gridSize - CONFIG.gridSize/2;
        gameState.players[id].targetZ = Math.random() * CONFIG.gridSize - CONFIG.gridSize/2;
    }
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
        updatePrograms(deltaTime);
        checkCollisions();
        updateUI();
        updateCamera();
    }
    
    // Use composer for bloom effect
    gameState.composer.render();
}

// Update Programs
function updatePrograms(deltaTime) {
    const normalizedDelta = deltaTime / 16; // Normalize deltaTime
    
    gameState.programs.forEach(program => {
        program.update(normalizedDelta);
        
        // Check if program is visible
        const vector = new THREE.Vector3(program.x, 0, program.z);
        vector.project(gameState.camera);
        program.element.style.display = 
            vector.z > -1 && vector.z < 1 ? 'block' : 'none';
    });
    
    // Update program count
    document.getElementById('program-count').textContent = 
        gameState.programs.filter(p => p.type === 'program').length;
}

// Update Players
function updatePlayers(deltaTime) {
    Object.values(gameState.players).forEach(player => {
        const oldX = player.model.position.x;
        const oldZ = player.model.position.z;
        
        if (player.id === gameState.myPlayerId) {
            updateHumanPlayer(player);
        } else {
            updateAIPlayer(player, deltaTime);
        }
        
        if ((player.direction.x !== 0 || player.direction.z !== 0) && 
            Date.now() - player.lastWallTime > 100) {
            createWallSegment(player, oldX, oldZ);
            player.lastWallTime = Date.now();
            player.model.userData.wallsCreated++;
        }
        
        const speedMultiplier = player.model.userData.isBoosting ? CONFIG.speedBoostMultiplier : 1;
        player.model.position.x += player.direction.x * player.speed * speedMultiplier;
        player.model.position.z += player.direction.z * player.speed * speedMultiplier;
        
        if (player.direction.x !== 0 || player.direction.z !== 0) {
            player.model.rotation.y = Math.atan2(player.direction.x, -player.direction.z);
        }
        
        // Check program interactions
        if (player.model.userData.interactWithPrograms) {
            player.model.userData.interactWithPrograms.call(player.model);
        }
        
        // End boost if time expired
        if (player.model.userData.isBoosting && Date.now() > player.model.userData.boostEndTime) {
            player.model.userData.isBoosting = false;
            if (player.id === gameState.myPlayerId) {
                document.querySelector('.player-score').textContent = `ENERGY: 100%`;
            }
        }
    });
}

// Update Human Player Controls
function updateHumanPlayer(player) {
    player.direction = { x: 0, z: 0 };
    
    if (gameState.keys['ArrowUp'] || gameState.keys['KeyW']) player.direction.z = -1;
    if (gameState.keys['ArrowDown'] || gameState.keys['KeyS']) player.direction.z = 1;
    if (gameState.keys['ArrowLeft'] || gameState.keys['KeyA']) player.direction.x = -1;
    if (gameState.keys['ArrowRight'] || gameState.keys['KeyD']) player.direction.x = 1;
    
    if ((gameState.keys['Space'] || gameState.keys['ShiftLeft']) && !player.model.userData.isBoosting) {
        player.model.userData.isBoosting = true;
        player.model.userData.boostEndTime = Date.now() + CONFIG.boostDuration;
        document.querySelector('.player-score').textContent = 
            `ENERGY: ${Math.floor(CONFIG.speedBoostMultiplier * 100)}%`;
    }
    
    if (player.direction.x !== 0 && player.direction.z !== 0) {
        player.direction.x *= 0.7071;
        player.direction.z *= 0.7071;
    }
}

// Update AI Player Behavior
function updateAIPlayer(player, deltaTime) {
    player.lastTurn += deltaTime;
    
    switch(player.behavior) {
        case 'aggressive':
            if (gameState.myPlayerId && gameState.players[gameState.myPlayerId]) {
                const target = gameState.players[gameState.myPlayerId].model;
                const dx = target.position.x - player.model.position.x;
                const dz = target.position.z - player.model.position.z;
                const distance = Math.sqrt(dx*dx + dz*dz);
                
                if (distance < 40 && player.lastTurn > 1000) {
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
                
                const futureX = player.model.position.x + player.direction.x * 5;
                const futureZ = player.model.position.z + player.direction.z * 5;
                
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
            const dx = player.targetX - player.model.position.x;
            const dz = player.targetZ - player.model.position.z;
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
    
    if (!player.model.userData.isBoosting && Math.random() < 0.001) {
        player.model.userData.isBoosting = true;
        player.model.userData.boostEndTime = Date.now() + CONFIG.boostDuration;
    }
    
    if (player.model.userData.isBoosting && Date.now() > player.model.userData.boostEndTime) {
        player.model.userData.isBoosting = false;
    }
}

// Create Wall Segment
function createWallSegment(player, oldX, oldZ) {
    const distance = Math.sqrt(
        Math.pow(player.model.position.x - oldX, 2) + 
        Math.pow(player.model.position.z - oldZ, 2)
    );
    
    if (distance > CONFIG.wallSegmentDistance) {
        const wall = createWall(
            { x: oldX, z: oldZ },
            { x: player.model.position.x, z: player.model.position.z },
            player.model.material?.emissive?.getHex() || 0x00ffff
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
        toRemove.forEach(wall => {
            gameState.scene.remove(wall);
            // Also remove edge lines
            gameState.scene.children.forEach(child => {
                if (child.type === 'LineSegments' && 
                    child.position.equals(wall.position)) {
                    gameState.scene.remove(child);
                }
            });
        });
    }
    
    gameState.walls.forEach(wall => {
        wall.userData.pulse = (wall.userData.pulse + 0.05) % (Math.PI * 2);
        wall.material.opacity = CONFIG.wallOpacity * (0.9 + 0.1 * Math.sin(wall.userData.pulse));
        
        // Update edge line opacity to match
        gameState.scene.children.forEach(child => {
            if (child.type === 'LineSegments' && 
                child.position.equals(wall.position)) {
                child.material.opacity = wall.material.opacity * 1.1;
            }
        });
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
        const player = gameState.players[gameState.myPlayerId].model;
        const cameraOffset = player.userData.isBoosting ? 40 : 35;
        const targetX = player.position.x;
        const targetZ = player.position.z + cameraOffset;
        
        gameState.camera.position.x += (targetX - gameState.camera.position.x) * 0.1;
        gameState.camera.position.z += (targetZ - gameState.camera.position.z) * 0.1;
        gameState.camera.lookAt(player.position.x, 0, player.position.z);
    }
}

// Check Collisions
function checkCollisions() {
    Object.values(gameState.players).forEach(player => {
        // Boundary check
        if (Math.abs(player.model.position.x) > CONFIG.gridSize/2 - 1 || 
            Math.abs(player.model.position.z) > CONFIG.gridSize/2 - 1) {
            handleCrash(player);
            return;
        }
        
        // Wall collision
        for (let i = 0; i < gameState.walls.length; i++) {
            const wall = gameState.walls[i];
            const dx = player.model.position.x - wall.position.x;
            const dz = player.model.position.z - wall.position.z;
            const distance = Math.sqrt(dx*dx + dz*dz);
            
            if (distance < 0.8) {
                handleCrash(player);
                break;
            }
        }
        
        // Power-up collision
        for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
            const powerUp = gameState.powerUps[i];
            const dx = player.model.position.x - powerUp.position.x;
            const dz = player.model.position.z - powerUp.position.z;
            const distance = Math.sqrt(dx*dx + dz*dz);
            
            if (distance < 1.5) {
                gameState.scene.remove(powerUp);
                gameState.powerUps.splice(i, 1);
                
                if (player.id === gameState.myPlayerId) {
                    player.model.userData.isBoosting = true;
                    player.model.userData.boostEndTime = Date.now() + CONFIG.boostDuration;
                    document.querySelector('.player-score').textContent = 
                        `ENERGY: ${Math.floor(CONFIG.speedBoostMultiplier * 100)}%`;
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
                    child.material.color.setHex(
                        player.model.material?.emissive?.getHex() || 0x00ffff
                    );
                    child.material.emissive.setHex(
                        player.model.material?.emissive?.getHex() || 0x00ffff
                    );
                }
            }, 200);
        }
    });
    
    createExplosion(
        player.model.position.x, 
        0, 
        player.model.position.z, 
        player.model.material?.emissive?.getHex() || 0x00ffff
    );
    
    // Remove player after delay
    setTimeout(() => {
        gameState.scene.remove(player.model);
        delete gameState.players[player.id];
        
        if (player.id === gameState.myPlayerId) {
            endGame();
        }
    }, 300);
}

// Update UI
function updateUI() {
    if (gameState.myPlayerId && gameState.players[gameState.myPlayerId]) {
        const player = gameState.players[gameState.myPlayerId];
        document.getElementById('player-position').textContent = 
            `${Math.floor(player.model.position.x)},${Math.floor(player.model.position.z)}`;
        
        if (player.model.userData.isBoosting) {
            const boostRemaining = Math.max(0, player.model.userData.boostEndTime - Date.now());
            const boostPercent = Math.floor((boostRemaining / CONFIG.boostDuration) * 100);
            document.querySelector('.player-score').textContent = 
                `ENERGY: ${Math.floor(CONFIG.speedBoostMultiplier * 100)}% (${boostPercent}%)`;
        }
    }
}

// End Game
function endGame() {
    const player = gameState.players[gameState.myPlayerId]?.model;
    const score = gameState.score;
    const isoContacts = gameState.isoContacts;
    
    alert(`GAME OVER\nSCORE: ${score}\nISO CONTACTS: ${isoContacts}`);
    
    document.getElementById('start-screen').style.display = 'flex';
    document.getElementById('game-ui').classList.remove('active');
    gameState.gameStarted = false;
    
    // Reset game state
    gameState.players = {};
    gameState.walls.forEach(wall => gameState.scene.remove(wall));
    gameState.walls = [];
    gameState.powerUps.forEach(powerUp => gameState.scene.remove(powerUp));
    gameState.powerUps = [];
    gameState.programs.forEach(program => program.remove());
    gameState.programs = [];
    gameState.dataStreams.forEach(stream => stream.remove());
    gameState.dataStreams = [];
    
    // Clear scene
    while(gameState.scene.children.length > 0) { 
        gameState.scene.remove(gameState.scene.children[0]); 
    }
    
    // Clear digital world
    document.getElementById('digital-world').innerHTML = '';
    
    // Reinitialize
    initGame();
}

// Window Resize
function onWindowResize() {
    gameState.camera.aspect = window.innerWidth / window.innerHeight;
    gameState.camera.updateProjectionMatrix();
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    gameState.composer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize on load
window.addEventListener('load', initGame);
