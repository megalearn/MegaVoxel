import * as THREE from 'three';
import { MegaVoxel } from './components/MegaVoxel';

// Initialize Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333); // Dark gray background

// Add lights
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

// Set up camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(15, 15, 15); // Position camera further out and at an angle
camera.lookAt(0, 0, 0);

// Set up renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('app')?.appendChild(renderer.domElement);

// Create editor instance
const editor = new MegaVoxel({
  palette: [0xff0000, 0x00ff00, 0x0000ff],
  onModelUpdated: (model) => {
    console.log('Model updated:', model);
  }
});

scene.add(editor);

// Handle window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate(); 