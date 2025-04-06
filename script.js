// Three.js Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('grid-container').appendChild(renderer.domElement);

// Tron Grid
const gridGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
const gridMaterial = new THREE.MeshBasicMaterial({
    color: 0x00FFFF,
    wireframe: true,
    transparent: true,
    opacity: 0.2
});
const grid = new THREE.Mesh(gridGeometry, gridMaterial);
grid.rotation.x = -Math.PI / 2;
scene.add(grid);

// Camera Position
camera.position.z = 50;
camera.position.y = 50;
camera.lookAt(0, 0, 0);

// ISOs (Simulated Entities)
const isos = [];
for (let i = 0; i < 5; i++) {
    const isoGeometry = new THREE.SphereGeometry(1, 32, 32);
    const isoMaterial = new THREE.MeshBasicMaterial({ color: 0x00FFFF });
    const iso = new THREE.Mesh(isoGeometry, isoMaterial);
    iso.position.set(
        Math.random() * 50 - 25,
        1,
        Math.random() * 50 - 25
    );
    isos.push(iso);
    scene.add(iso);
}

// Animation
function animate() {
    requestAnimationFrame(animate);
    isos.forEach(iso => {
        iso.position.x += Math.sin(Date.now() * 0.001 + iso.position.z) * 0.1;
        iso.position.z += Math.cos(Date.now() * 0.001 + iso.position.x) * 0.1;
    });
    renderer.render(scene, camera);
}
animate();

// AGI Chat Interface
const chatOutput = document.getElementById('chat-output');
const chatInput = document.getElementById('chat-input');

function sendCommand() {
    const input = chatInput.value.trim();
    if (!input) return;

    chatOutput.innerHTML += `<p>User: ${input}</p>`;
    let response = "Processing...";

    // Simple AGI-like responses
    if (input.toLowerCase().includes("iso")) {
        response = "ISOs detected: " + isos.length + " entities active.";
    } else if (input.toLowerCase().includes("grid")) {
        response = "Grid status: Online. Coordinates stable.";
    } else if (input.toLowerCase().includes("tron")) {
        response = "Welcome to the Grid. How may I assist you, User?";
    } else {
        response = "Command not recognized. Try 'ISO status', 'Grid check', or 'Tron'.";
    }

    chatOutput.innerHTML += `<p>AGI: ${response}</p>`;
    chatOutput.scrollTop = chatOutput.scrollHeight;
    chatInput.value = "";
}

// Resize Handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
