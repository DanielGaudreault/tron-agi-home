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
        document.getElementById('digital-world').appendChild
