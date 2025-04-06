// Enhanced Physics Configuration
const PHYSICS = {
    acceleration: 0.002,
    deceleration: 0.005,
    maxSpeed: 0.3,
    turnSpeed: 0.1,
    driftFactor: 0.95,
    wallBounce: 0.7,
    gridFriction: 0.99
};

// Update the Player class with physics
class Player {
    constructor(color, isAI = false) {
        this.color = color;
        this.isAI = isAI;
        this.mesh = this.createModel();
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3(0, 0, -1);
        this.speed = 0;
        this.boostEnergy = 100;
        this.isBoosting = false;
        this.health = 100;
        this.lastWallTime = 0;
        this.wallsCreated = 0;
    }

    createModel() {
        // ... (keep existing model creation code) ...
        return group;
    }

    update(deltaTime) {
        // Apply grid friction
        this.speed *= PHYSICS.gridFriction;
        
        // Update velocity based on direction and speed
        this.velocity.copy(this.direction).multiplyScalar(this.speed);
        
        // Apply movement
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Update model rotation to face direction
        this.mesh.rotation.y = Math.atan2(this.direction.x, -this.direction.z);
        
        // Handle boosting
        if (this.isBoosting && this.boostEnergy > 0) {
            this.speed = PHYSICS.maxSpeed * 1.5;
            this.boostEnergy -= 0.2 * deltaTime;
        } else {
            this.isBoosting = false;
            if (this.boostEnergy < 100) {
                this.boostEnergy += 0.05 * deltaTime;
            }
        }
        
        // Create wall segments when moving
        if (this.speed > 0.1 && Date.now() - this.lastWallTime > 100) {
            this.createWallSegment();
            this.lastWallTime = Date.now();
            this.wallsCreated++;
        }
    }

    accelerate(deltaTime) {
        this.speed = Math.min(this.speed + PHYSICS.acceleration * deltaTime, PHYSICS.maxSpeed);
    }

    decelerate(deltaTime) {
        this.speed = Math.max(this.speed - PHYSICS.deceleration * deltaTime, 0);
    }

    turnLeft(deltaTime) {
        const angle = PHYSICS.turnSpeed * deltaTime;
        this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    }

    turnRight(deltaTime) {
        const angle = -PHYSICS.turnSpeed * deltaTime;
        this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    }

    drift() {
        this.speed *= PHYSICS.driftFactor;
    }

    boost() {
        if (this.boostEnergy > 10) {
            this.isBoosting = true;
        }
    }

    createWallSegment() {
        // Calculate new wall position based on current movement
        const start = this.mesh.position.clone();
        const end = start.clone().add(this.direction.clone().multiplyScalar(2));
        
        const wall = createWall(
            { x: start.x, z: start.z },
            { x: end.x, z: end.z },
            this.color
        );
        
        gameState.scene.add(wall);
        gameState.walls.push(wall);
    }

    handleCollision(normal) {
        // Reflect velocity when hitting walls
        const dot = this.velocity.dot(normal);
        this.velocity.sub(normal.clone().multiplyScalar(2 * dot));
        this.velocity.multiplyScalar(PHYSICS.wallBounce);
        this.speed = this.velocity.length();
        
        // Damage effect
        this.health -= 10;
        this.mesh.traverse(child => {
            if (child.material) {
                child.material.color.setHex(0xff0000);
                setTimeout(() => {
                    child.material.color.setHex(this.color);
                }, 300);
            }
        });
        
        return this.health <= 0;
    }
}

// Enhanced Collision Detection
function checkCollisions() {
    const gridBoundary = CONFIG.gridSize / 2 - 1;
    
    Object.values(gameState.players).forEach(player => {
        // Grid boundary collision
        if (Math.abs(player.mesh.position.x) > gridBoundary || 
            Math.abs(player.mesh.position.z) > gridBoundary) {
            const normal = new THREE.Vector3(
                Math.sign(player.mesh.position.x),
                0,
                Math.sign(player.mesh.position.z)
            ).normalize();
            
            if (player.handleCollision(normal)) {
                destroyPlayer(player);
            }
            return;
        }
        
        // Wall collisions
        for (let i = 0; i < gameState.walls.length; i++) {
            const wall = gameState.walls[i];
            const wallDir = new THREE.Vector3(
                Math.cos(wall.rotation.y),
                0,
                -Math.sin(wall.rotation.y)
            );
            
            const wallNormal = new THREE.Vector3(-wallDir.z, 0, wallDir.x);
            const toPlayer = new THREE.Vector3().subVectors(
                player.mesh.position,
                wall.position
            );
            
            const distance = toPlayer.dot(wallNormal);
            const parallelDistance = toPlayer.dot(wallDir);
            const halfLength = wall.geometry.parameters.width / 2;
            
            if (Math.abs(distance) < 1 && Math.abs(parallelDistance) < halfLength) {
                if (player.handleCollision(wallNormal)) {
                    destroyPlayer(player);
                }
                break;
            }
        }
    });
}

// Update the game loop with physics
function animate() {
    const now = performance.now();
    const deltaTime = Math.min(now - gameState.lastTime, 100); // Cap deltaTime to prevent physics issues
    gameState.lastTime = now;
    
    if (gameState.gameStarted) {
        // Update players with proper physics
        Object.values(gameState.players).forEach(player => {
            if (player.id === gameState.myPlayerId) {
                updateHumanPlayer(player, deltaTime);
            } else {
                updateAIPlayer(player, deltaTime);
            }
            player.update(deltaTime);
        });
        
        checkCollisions();
        updateWalls();
        updatePowerUps();
        updatePrograms(deltaTime);
        updateUI();
        updateCamera();
    }
    
    gameState.composer.render();
}

// Enhanced Human Player Controls
function updateHumanPlayer(player, deltaTime) {
    // Handle acceleration
    if (gameState.keys['ArrowUp'] || gameState.keys['KeyW']) {
        player.accelerate(deltaTime);
    } else if (gameState.keys['ArrowDown'] || gameState.keys['KeyS']) {
        player.decelerate(deltaTime);
    } else {
        player.drift();
    }
    
    // Handle turning
    if (gameState.keys['ArrowLeft'] || gameState.keys['KeyA']) {
        player.turnLeft(deltaTime);
    }
    if (gameState.keys['ArrowRight'] || gameState.keys['KeyD']) {
        player.turnRight(deltaTime);
    }
    
    // Handle boost
    if ((gameState.keys['Space'] || gameState.keys['ShiftLeft']) && !player.isBoosting) {
        player.boost();
    }
}

// Enhanced AI Player with Physics
function updateAIPlayer(player, deltaTime) {
    // AI decision making with physics
    const decisionInterval = 1000; // ms
    const now = Date.now();
    
    if (!player.lastDecisionTime || now - player.lastDecisionTime > decisionInterval) {
        // Make new decision based on behavior
        switch(player.behavior) {
            case 'aggressive':
                // Chase nearest player
                let closestPlayer = null;
                let minDistance = Infinity;
                
                Object.values(gameState.players).forEach(p => {
                    if (p.id !== player.id) {
                        const distance = p.mesh.position.distanceTo(player.mesh.position);
                        if (distance < minDistance) {
                            closestPlayer = p;
                            minDistance = distance;
                        }
                    }
                });
                
                if (closestPlayer) {
                    const direction = new THREE.Vector3().subVectors(
                        closestPlayer.mesh.position,
                        player.mesh.position
                    ).normalize();
                    
                    // Predict position based on target's velocity
                    if (closestPlayer.velocity) {
                        direction.add(closestPlayer.velocity.clone().multiplyScalar(0.5));
                        direction.normalize();
                    }
                    
                    player.direction.copy(direction);
                    
                    // Boost when close to target
                    if (minDistance < 20) {
                        player.boost();
                    }
                }
                break;
                
            case 'defensive':
                // Avoid walls and other players
                const avoidDirection = new THREE.Vector3();
                let danger = 0;
                
                // Check for nearby walls
                gameState.walls.forEach(wall => {
                    const distance = wall.position.distanceTo(player.mesh.position);
                    if (distance < 10) {
                        const wallNormal = new THREE.Vector3(
                            -Math.sin(wall.rotation.y),
                            0,
                            -Math.cos(wall.rotation.y)
                        );
                        avoidDirection.add(wallNormal.multiplyScalar(1 / distance));
                        danger += 1 / distance;
                    }
                });
                
                // Check for other players
                Object.values(gameState.players).forEach(p => {
                    if (p.id !== player.id) {
                        const distance = p.mesh.position.distanceTo(player.mesh.position);
                        if (distance < 15) {
                            const away = new THREE.Vector3().subVectors(
                                player.mesh.position,
                                p.mesh.position
                            ).normalize();
                            avoidDirection.add(away.multiplyScalar(1 / distance));
                            danger += 1 / distance;
                        }
                    }
                });
                
                if (danger > 0) {
                    avoidDirection.normalize();
                    player.direction.lerp(avoidDirection, 0.3);
                } else if (Math.random() < 0.1) {
                    // Random exploration
                    player.direction.applyAxisAngle(
                        new THREE.Vector3(0, 1, 0),
                        (Math.random() - 0.5) * Math.PI/2
                    );
                }
                break;
                
            default:
                // Random movement
                if (Math.random() < 0.05) {
                    player.direction.applyAxisAngle(
                        new THREE.Vector3(0, 1, 0),
                        (Math.random() - 0.5) * Math.PI/2
                    );
                }
        }
        
        player.lastDecisionTime = now;
    }
    
    // Always accelerate unless avoiding something
    player.accelerate(deltaTime);
    
    // Random boost
    if (Math.random() < 0.01) {
        player.boost();
    }
}
