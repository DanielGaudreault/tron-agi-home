// Game Constants
const GRID_SIZE = 100;
const CELL_SIZE = 2;
const GRID_COLOR = 0x003300;
const LIGHT_COLOR = 0x00ffff;
const BUILDING_COLORS = [0x111122, 0x112211, 0x221111];
const PLAYER_COLORS = [0x00ffff, 0xff00ff, 0xffff00, 0xff8800];

// Game State
let players = {};
let walls = [];
let buildings = [];
let myPlayerId = null;
let playerName = "";

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

// Grid
function createGrid() {
    const grid = new THREE.Group();
    
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: GRID_COLOR, 
        emissive: 0x001100,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    grid.add(ground);
    
    // Grid lines
    const gridLines = new THREE.Group();
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x005500 });
    
    for (let i = -GRID_SIZE/2; i <= GRID_SIZE/2; i++) {
        const hGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-GRID_SIZE/2 * CELL_SIZE, 0.1, i * CELL_SIZE),
            new THREE.Vector3(GRID_SIZE/2 * CELL_SIZE, 0.1, i * CELL_SIZE)
        ]);
        const vGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(i * CELL_SIZE, 0.1, -GRID_SIZE/2 * CELL_SIZE),
            new THREE.Vector3(i * CELL_SIZE, 0.1, GRID_SIZE/2 * CELL_SIZE)
        ]);
        
        gridLines.add(new THREE.Line(hGeometry, lineMaterial));
        gridLines.add(new THREE.Line(vGeometry, lineMaterial));
    }
    
    grid.add(gridLines);
    return grid;
}

// Buildings
function createBuildings() {
    const buildingGroup = new THREE.Group();
    
    for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * GRID_SIZE - GRID_SIZE/2);
        const z = Math.floor(Math.random() * GRID_SIZE - GRID_SIZE/2);
        
        // Don't place buildings in center
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
        
        const width = Math.floor(Math.random() * 5) + 2;
        const depth = Math.floor(Math.random() * 5) + 2;
        const height = Math.floor(Math.random() * 10) + 5;
        
        const buildingGeometry = new THREE.BoxGeometry(
            width * CELL_SIZE, 
            height * CELL_SIZE, 
            depth * CELL_SIZE
        );
        
        const buildingMaterial = new THREE.MeshPhongMaterial({ 
            color: BUILDING_COLORS[i % BUILDING_COLORS.length],
            emissive: 0x001111,
            transparent: true,
            opacity: 0.8
        });
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(
            x * CELL_SIZE,
            height * CELL_SIZE / 2,
            z * CELL_SIZE
        );
        
        building.castShadow = true;
        building.receiveShadow = true;
        
        // Add neon edges
        const edges = new THREE.EdgesGeometry(buildingGeometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: LIGHT_COLOR, linewidth: 2 })
        );
        line.position.copy(building.position);
        
        buildingGroup.add(building);
        buildingGroup.add(line);
        
        buildings.push({
            x, z, width, depth, height,
            mesh: building,
            edges: line
        });
    }
    
    return buildingGroup;
}

// Player model
function createPlayerModel(color) {
    const group = new THREE.Group();
    
    // Body (cube)
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
    
    // Light trail
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

// Wall segment
function createWallSegment(start, end, color) {
    const length = Math.sqrt(
        Math.pow(end.x - start.x, 2) + 
        Math.pow(end.z - start.z, 2)
    );
    
    const angle = Math.atan2(end.z - start.z, end.x - start.x);
    
    const wallGeometry = new THREE.BoxGeometry(length, 2, 0.5);
    const wallMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        transparent: true,
        opacity: 0.8
    });
    
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(
        (start.x + end.x) / 2,
        1,
        (start.z + end.z) / 2
    );
    wall.rotation.y = -angle;
    
    return wall;
}

// Initialize game world
function initWorld() {
    scene.add(createGrid());
    scene.add(createBuildings());
    
    // Position camera
    camera.position.set(0, 30, 30);
    camera.lookAt(0, 0, 0);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Keyboard controls
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// Join game
document.getElementById('join-button').addEventListener('click', () => {
    playerName = document.getElementById('player-name').value || 'Player';
    document.getElementById('join-screen').style.display = 'none';
    initWorld();
    initNetwork();
    animate();
});

// Network simulation (simple version without real server)
function initNetwork() {
    myPlayerId = 'player-' + Math.random().toString(36).substr(2, 9);
    const myColor = PLAYER_COLORS[Object.keys(players).length % PLAYER_COLORS.length];
    
    players[myPlayerId] = {
        id: myPlayerId,
        name: playerName,
        x: 0,
        z: 0,
        color: myColor,
        model: createPlayerModel(myColor),
        direction: { x: 0, z: 0 },
        speed: 0.1
    };
    
    scene.add(players[myPlayerId].model);
    
    // Add some AI players for demo
    addAIPlayer('Rinzler', -10, 0, PLAYER_COLORS[1]);
    addAIPlayer('Quorra', 10, 0, PLAYER_COLORS[2]);
    addAIPlayer('CLU', 0, -10, PLAYER_COLORS[3]);
}

function addAIPlayer(name, x, z, color) {
    const id = 'ai-' + Math.random().toString(36).substr(2, 9);
    players[id] = {
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
        speed: 0.08,
        lastTurn: 0
    };
    scene.add(players[id].model);
}

// Game loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update player position
    if (players[myPlayerId]) {
        const player = players[myPlayerId];
        
        // Handle input
        player.direction = { x: 0, z: 0 };
        if (keys['ArrowUp'] || keys['KeyW']) player.direction.z = -1;
        if (keys['ArrowDown'] || keys['KeyS']) player.direction.z = 1;
        if (keys['ArrowLeft'] || keys['KeyA']) player.direction.x = -1;
        if (keys['ArrowRight'] || keys['KeyD']) player.direction.x = 1;
        
        // Normalize diagonal movement
        if (player.direction.x !== 0 && player.direction.z !== 0) {
            player.direction.x *= 0.7071;
            player.direction.z *= 0.7071;
        }
        
        const newX = player.x + player.direction.x * player.speed;
        const newZ = player.z + player.direction.z * player.speed;
        
        // Create wall if moving
        if (player.direction.x !== 0 || player.direction.z !== 0) {
            const wall = {
                start: { x: player.x, z: player.z },
                end: { x: newX, z: newZ },
                color: player.color,
                mesh: createWallSegment(
                    { x: player.x, z: player.z },
                    { x: newX, z: newZ },
                    player.color
                )
            };
            walls.push(wall);
            scene.add(wall.mesh);
        }
        
        player.x = newX;
        player.z = newZ;
        player.model.position.set(player.x, 0, player.z);
        
        // Face direction
        if (player.direction.x !== 0 || player.direction.z !== 0) {
            player.model.rotation.y = Math.atan2(
                player.direction.x, 
                -player.direction.z
            );
        }
        
        // Update camera to follow player
        camera.position.set(
            player.x - 10, 
            30, 
            player.z + 10
        );
        camera.lookAt(player.x, 0, player.z);
        
        // Update UI
        document.getElementById('position').textContent = 
            `Position: (${player.x.toFixed(1)}, ${player.z.toFixed(1)})`;
        document.getElementById('score').textContent = 
            `Players: ${Object.keys(players).length}`;
    }
    
    // Update AI players
    Object.values(players).forEach(p => {
        if (p.id.startsWith('ai-')) {
            // Simple AI - move and occasionally turn
            p.lastTurn++;
            if (p.lastTurn > 100 || Math.random() < 0.01) {
                p.direction = {
                    x: Math.random() > 0.5 ? 1 : -1,
                    z: Math.random() > 0.5 ? 1 : -1
                };
                p.lastTurn = 0;
            }
            
            const newX = p.x + p.direction.x * p.speed;
            const newZ = p.z + p.direction.z * p.speed;
            
            // Create wall
            const wall = {
                start: { x: p.x, z: p.z },
                end: { x: newX, z: newZ },
                color: p.color,
                mesh: createWallSegment(
                    { x: p.x, z: p.z },
                    { x: newX, z: newZ },
                    p.color
                )
            };
            walls.push(wall);
            scene.add(wall.mesh);
            
            p.x = newX;
            p.z = newZ;
            p.model.position.set(p.x, 0, p.z);
            
            // Face direction
            p.model.rotation.y = Math.atan2(
                p.direction.x, 
                -p.direction.z
            );
        }
    });
    
    // Clean up old walls (for performance)
    if (walls.length > 100) {
        const toRemove = walls.splice(0, 50);
        toRemove.forEach(wall => scene.remove(wall.mesh));
    }
    
    renderer.render(scene, camera);
}
