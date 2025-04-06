// === THREE.JS GRID SETUP ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('grid-container').appendChild(renderer.domElement);

// TRON-style grid
const gridSize = 100;
const gridDivisions = 100;
const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x00ffff, 0x00ffff);
scene.add(grid);

// Neon light
const light = new THREE.PointLight(0x00ffff, 1, 100);
light.position.set(10, 10, 10);
scene.add(light);

camera.position.z = 30;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  grid.rotation.x += 0.001;
  grid.rotation.y += 0.001;
  renderer.render(scene, camera);
}
animate();

// === CHATBOT LOGIC ===
const chatOutput = document.getElementById('chat-output');
const userInput = document.getElementById('user-input');

// Simple AI responses (replace with OpenAI API if needed)
const aiResponses = [
  "I am a program from the TRON grid.",
  "The Users have always been here.",
  "Greetings, User!",
  "My circuits are ready."
];

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const userMessage = userInput.value;
    chatOutput.innerHTML += `<div><span class="user">You:</span> ${userMessage}</div>`;
    userInput.value = '';

    // Simulate AI thinking
    setTimeout(() => {
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      chatOutput.innerHTML += `<div><span class="ai">AI:</span> ${randomResponse}</div>`;
      chatOutput.scrollTop = chatOutput.scrollHeight;
    }, 500);
  }
});
