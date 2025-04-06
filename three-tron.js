let scene, camera, renderer, controls;
let agiCore, grid;

function initTronEnvironment() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  
  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 50, 100);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.getElementById('tron-container').appendChild(renderer.domElement);
  
  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0x222222);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0x00ffff, 1);
  directionalLight.position.set(1, 1, 1);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  // Grid
  grid = new THREE.GridHelper(200, 50, 0x00ffff, 0x00ffff);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add(grid);
  
  // AGI Core Visualization
  const coreGeometry = new THREE.IcosahedronGeometry(5, 3);
  const coreMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.5,
    shininess: 100,
    wireframe: true
  });
  agiCore = new THREE.Mesh(coreGeometry, coreMaterial);
  scene.add(agiCore);
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Rotate core and grid
    agiCore.rotation.x += 0.005;
    agiCore.rotation.y += 0.01;
    grid.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
    grid.rotation.z = Math.cos(Date.now() * 0.001) * 0.1;
    
    controls.update();
    renderer.render(scene, camera);
  }
  
  animate();
  
  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  // Hide loading screen
  document.getElementById('loading').style.display = 'none';
}
