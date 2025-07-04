import * as THREE from 'three';
import { MegaVoxel } from './MegaVoxel';
import { CameraControls } from './CameraControls';

// Define the VoxelModel interface
interface VoxelModel {
  palette: string[];
  voxels: Array<{ x: number, y: number, z: number, color: number }>;
}

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
let editor = new MegaVoxel({
  palette: palette,
  camera: camera,
  onModelUpdated: (model: VoxelModel) => {
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
  const colorPaletteContainer = document.querySelector('.color-palette');
  if (!colorPaletteContainer) {
    console.error('Color palette container not found');
    return;
  }

  // Clear existing buttons
  colorPaletteContainer.innerHTML = '';

  // Create color buttons
  palette.forEach((color, index) => {
    const button = document.createElement('button');
    button.className = 'color-btn';
    button.dataset.color = index.toString();
    button.style.background = `#${color.toString(16).padStart(6, '0')}`;
    colorPaletteContainer.appendChild(button);
  });

  // Create erase button
  const eraseButton = document.createElement('button');
  eraseButton.className = 'color-btn';
  eraseButton.dataset.mode = 'erase';
  eraseButton.innerHTML = '🗑️';
  colorPaletteContainer.appendChild(eraseButton);

  // Set initial active state
  const firstColorButton = colorPaletteContainer.querySelector('[data-color="0"]') as HTMLButtonElement;
  if (firstColorButton) {
    firstColorButton.classList.add('active');
  }

  const setMode = (mode: 'add' | 'erase', colorIndex?: number) => {
    const colorButtons = colorPaletteContainer.querySelectorAll('.color-btn');
    colorButtons.forEach(btn => btn.classList.remove('active'));
    
    if (mode === 'add' && colorIndex !== undefined) {
      const colorButton = colorPaletteContainer.querySelector(`[data-color="${colorIndex}"]`) as HTMLButtonElement;
      if (colorButton) colorButton.classList.add('active');
    } else if (mode === 'erase') {
      eraseButton.classList.add('active');
    }
    
    editor.setMode(mode);
  };

  // Add click handlers
  colorPaletteContainer.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.color-btn') as HTMLButtonElement;
    if (!target) return;
    
    if (target.dataset.mode === 'erase') {
      setMode('erase');
    } else {
      const colorIndex = parseInt(target.dataset.color || '0', 10);
      setMode('add', colorIndex);
      editor.setColor(colorIndex);
    }
  });
};

setupUIControls();

// Handle import/export
const setupImportExport = () => {
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const fileInput = document.getElementById('file-input') as HTMLInputElement;

  if (!exportBtn || !importBtn || !fileInput) {
    console.error('Import/export elements not found');
    return;
  }

  exportBtn.addEventListener('click', () => {
    const model = editor.exportModel();
    const blob = new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const model = JSON.parse(event.target?.result as string) as VoxelModel;
        // Create a new editor instance with the imported model
        const newEditor = new MegaVoxel({
          palette: palette,
          camera: camera,
          onModelUpdated: (model: VoxelModel) => {
            console.log('Model updated:', model);
          },
          initialModel: model
        });
        
        // Replace the old editor with the new one
        scene.remove(editor);
        scene.add(newEditor);
        editor = newEditor;
        
        // Update the canvas reference
        const canvas = document.querySelector('canvas');
        if (canvas) {
          editor.domElement = canvas;
          editor.setupInteraction();
        }
      } catch (error) {
        console.error('Error importing model:', error);
        alert('Error importing model. Please check the file format.');
      }
    };
    reader.readAsText(file);
  });
};

setupImportExport();

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