// Add to CONFIG
const CONFIG = {
    // ... existing config ...
    programCount: 50,
    isoCount: 5,
    agiCount: 3,
    programSpeed: 0.02,
    dataStreams: 10
};

// Add to gameState
const gameState = {
    // ... existing state ...
    programs: [],
    dataStreams: []
};

// New Program class
class Program {
    constructor(type = 'program') {
        this.type = type;
        this.x = Math.random() * CONFIG.gridSize - CONFIG.gridSize/2;
        this.z = Math.random() * CONFIG.gridSize - CONFIG.gridSize/2;
        this.speed = CONFIG.programSpeed * (0.5 + Math.random());
        this.direction = Math.random() * Math.PI * 2;
        this.element = this.createDOMElement();
        this.updatePosition();
    }

    createDOMElement() {
        const el = document.createElement('div');
        el.className = `program ${this.type}`;
        document.body.appendChild(el);
        return el;
    }

    update(deltaTime) {
        // Move in current direction
        this.x += Math.cos(this.direction) * this.speed * deltaTime;
        this.z += Math.sin(this.direction) * this.speed * deltaTime;
        
        // Bounce off walls
        if (Math.abs(this.x) > CONFIG.gridSize/2 - 5 || 
            Math.abs(this.z) > CONFIG.gridSize/2 - 5) {
            this.direction = Math.atan2(
                Math.sin(this.direction) * -1,
                Math.cos(this.direction) * -1
            );
        }
        
        // Random direction changes
        if (Math.random() < 0.01) {
            this.direction += (Math.random() - 0.5) * Math.PI/4;
        }
        
        this.updatePosition();
    }

    updatePosition() {
        // Convert 3D world position to 2D screen position
        const vector = new THREE.Vector3(this.x, 0, this.z);
        vector.project(gameState.camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = -(vector.y * 0.5 - 0.5) * window.innerHeight;
        
        this.element.style.transform = `translate(${x}px, ${y}px)`;
        this.element.style.zIndex = Math.round(vector.z * 1000);
    }

    remove() {
        this.element.remove();
    }
}

// Initialize Programs
function initPrograms() {
    // Regular programs
    for (let i = 0; i < CONFIG.programCount; i++) {
        gameState.programs.push(new Program('program'));
    }
    
    // ISOs (special programs)
    for (let i = 0; i < CONFIG.isoCount; i++) {
        const iso = new Program('iso');
        iso.speed *= 1.5; // ISOs move faster
        gameState.programs.push(iso);
    }
    
    // AGIs (advanced programs)
    for (let i = 0; i < CONFIG.agiCount; i++) {
        const agi = new Program('agi');
        agi.speed *= 0.7; // AGIs move more deliberately
        gameState.programs.push(agi);
    }
    
    // Data streams (background effects)
    for (let i = 0; i < CONFIG.dataStreams; i++) {
        const stream = document.createElement('div');
        stream.className = 'data-stream';
        stream.style.left = `${Math.random() * 100}%`;
        stream.style.animationDelay = `${Math.random() * 3}s`;
        document.body.appendChild(stream);
        gameState.dataStreams.push(stream);
    }
}

// Update in animate() function
function animate() {
    // ... existing code ...
    
    // Update programs
    const deltaTime = (time - gameState.lastTime) / 16; // Normalize deltaTime
    gameState.programs.forEach(program => program.update(deltaTime));
    
    // ... rest of existing code ...
}

// Add to initGame()
function initGame() {
    // ... existing code ...
    initPrograms();
    // ... rest of code ...
}

// Add to endGame()
function endGame() {
    // ... existing code ...
    
    // Clean up programs
    gameState.programs.forEach(program => program.remove());
    gameState.programs = [];
    
    // Clean up data streams
    gameState.dataStreams.forEach(stream => stream.remove());
    gameState.dataStreams = [];
    
    // ... rest of code ...
}

// Enhanced Player Class with Program Interaction
function createPlayer(color, isAI = false) {
    // ... existing player code ...
    
    // Add program interaction
    player.interactWithPrograms = function() {
        gameState.programs.forEach((program, index) => {
            const dx = this.x - program.x;
            const dz = this.z - program.z;
            const distance = Math.sqrt(dx*dx + dz*dz);
            
            if (distance < 3) {
                // Different effects based on program type
                switch(program.type) {
                    case 'iso':
                        // ISOs give temporary speed boost
                        this.isBoosting = true;
                        this.boostEndTime = Date.now() + CONFIG.boostDuration;
                        break;
                        
                    case 'agi':
                        // AGIs give points and modify trail
                        gameState.score += 50;
                        this.wallsCreated = Math.max(0, this.wallsCreated - 5); // Shorten trail
                        break;
                        
                    default:
                        // Regular programs give points
                        gameState.score += 10;
                }
                
                // Remove the program and create a new one
                program.remove();
                gameState.programs.splice(index, 1);
                gameState.programs.push(new Program(program.type));
                
                // Visual effect
                createExplosion(program.x, 0, program.z, 
                    program.type === 'iso' ? 0xff00ff : 
                    program.type === 'agi' ? 0xffff00 : 0x00ffff);
            }
        });
    };
    
    return player;
}

// Update in updatePlayers()
function updatePlayers(deltaTime) {
    Object.values(gameState.players).forEach(player => {
        // ... existing movement code ...
        
        // Check program interactions
        if (player.interactWithPrograms) {
            player.interactWithPrograms();
        }
    });
}
