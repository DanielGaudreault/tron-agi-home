export function initThreeTron() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('three-container').appendChild(renderer.domElement);

    // Create a Tron-like grid
    const grid = new THREE.GridHelper(100, 50, 0x00ffcc, 0x00ffcc);
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    scene.add(grid);

    camera.position.z = 50;
    camera.position.y = 30;
    camera.lookAt(0, 0, 0);

    function animate() {
        requestAnimationFrame(animate);
        grid.rotation.z += 0.005; // Slow rotation for effect
        renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
