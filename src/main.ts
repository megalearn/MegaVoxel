import * as THREE from 'three';
import { MegaVoxel } from './components/MegaVoxel';
import { CameraControls } from './utils/CameraControls';

// Initialize Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFDF0EE);

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
const container = document.getElementById('app');
if (!container) throw new Error('Could not find app container');
container.appendChild(renderer.domElement);

// Set up camera controls
const controls = new CameraControls(camera, renderer.domElement);

// Define the color palette
const palette = [
  0xF2F2F2, // light gray
  0xFFA094, // light coral
  0xFF425B, // red
  0x7DB20A, // lime green
  0x018E01, // green
  0x026522, // dark green
  0x020403  // almost black
];

// Create editor instance
const editor = new MegaVoxel({
  palette: palette,
  camera: camera,
  onModelUpdated: (model: { palette: string[], voxels: Array<{ x: number, y: number, z: number, color: number }> }) => {
    console.log('Model updated:', model);
  }
});

// Add editor to scene
scene.add(editor);

// Wait for canvas to be available
requestAnimationFrame(() => {
  const canvas = document.querySelector('canvas');
  if (canvas) {
    editor.domElement = canvas;
    editor.setupInteraction();
  } else {
    console.error('Canvas not found for editor interaction');
  }
});

// Set up UI controls
const setupUIControls = () => {
  // Mode buttons
  const modeButtons = document.querySelectorAll('.mode-btn');
  const addButton = document.querySelector('[data-mode="add"]') as HTMLButtonElement;
  const eraseButton = document.querySelector('[data-mode="erase"]') as HTMLButtonElement;
  const colorButtons = document.querySelectorAll('.color-btn');

  const setMode = (mode: 'add' | 'erase') => {
    modeButtons.forEach(btn => btn.classList.remove('active'));
    if (mode === 'add') {
      addButton.classList.add('active');
    } else {
      eraseButton.classList.add('active');
      // Deselect color when erase mode is chosen
      colorButtons.forEach(btn => btn.classList.remove('active'));
    }
    editor.setMode(mode);
  };

  modeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      const mode = target.dataset.mode as 'add' | 'erase';
      setMode(mode);
    });
  });

  // Color buttons
  colorButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      const colorIndex = parseInt(target.dataset.color || '0', 10);
      
      colorButtons.forEach(btn => btn.classList.remove('active'));
      target.classList.add('active');
      
      // Automatically switch to add mode when color is selected
      setMode('add');
      
      editor.setColor(colorIndex);
    });
  });
};

setupUIControls();

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
  controls.update();
  renderer.render(scene, camera);
}

animate(); 