import { AGIModel } from './agi.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/loaders/GLTFLoader.js';

// Initialize AGI model
const inputShape = [100, 1];
const agiModel = new AGIModel(inputShape);

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a grid helper for the Tron world
const gridHelper = new THREE.GridHelper(100, 100, 0x00ff00, 0x00ff00);
scene.add(gridHelper);

// Create a Tron-like glowing cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00ff00, 1, 100);
pointLight.position.set(50, 50, 50);
scene.add(pointLight);

camera.position.z = 5;

// Load ISO model
const loader = new GLTFLoader();
loader.load('models/iso.gltf', function (gltf) {
  scene.add(gltf.scene);
}, undefined, function (error) {
  console.error(error);
});

const animate = () => {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
};
animate();

// AGI Training and Prediction
document.getElementById('trainAGI').addEventListener('click', async () => {
  // Dummy training data
  const X_train = tf.randomNormal([100, 100, 1]);
  const y_train = tf.randomUniform([100, 1]);

  await agiModel.train(X_train, y_train);
  alert('AGI Model Trained!');
});

document.getElementById('predictAGI').addEventListener('click', async () => {
  // Dummy prediction data
  const X_test = tf.randomNormal([1, 100, 1]);
  const prediction = await agiModel.predict(X_test);
  alert(`Prediction: ${prediction.dataSync()}`);
});
