import * as THREE from 'three';
import { InputHandler } from './InputHandler';

interface VoxelData {
  x: number;
  y: number;
  z: number;
  color: number;
}

interface VoxelModel {
  palette: string[];
  voxels: VoxelData[];
}

interface MegaVoxelOptions {
  palette: number[];
  camera: THREE.Camera;
  onModelUpdated: (model: VoxelModel) => void;
  initialModel?: VoxelModel;
}

export class MegaVoxel extends THREE.Object3D {
  private palette: number[];
  private voxels: Map<string, VoxelData>;
  private meshes: Map<string, THREE.Mesh>;
  private onModelUpdated: MegaVoxelOptions['onModelUpdated'];
  private currentColor: number;
  private isEraseMode: boolean;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  public domElement: HTMLElement;
  private camera: THREE.Camera;
  private hoveredMesh: THREE.Mesh | null = null;
  private originalEmissive: number | null = null;
  private inputHandler: InputHandler;

  constructor(options: MegaVoxelOptions) {
    super();
    this.palette = options.palette;
    this.camera = options.camera;
    this.onModelUpdated = options.onModelUpdated;
    
    this.voxels = new Map();
    this.meshes = new Map();
    this.currentColor = 0;
    this.isEraseMode = false;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.domElement = document.querySelector('canvas') as HTMLElement;

    if (options.initialModel) {
      this.loadModel(options.initialModel);
    } else {
      this.initializeGrid();
    }

    this.inputHandler = new InputHandler({
      element: this.domElement,
      onPointerMove: (position) => {
        this.mouse.copy(position);
        this.updateHoverState();
      },
      onPointerDown: (position) => {
        this.mouse.copy(position);
      },
      onPointerUp: (position) => {
        this.mouse.copy(position);
      },
      onPointerClick: (position) => {
        this.mouse.copy(position);
        this.handleVoxelOperation();
      }
    });
  }

  private initializeGrid(): void {
    // Create initial 9x9x9 grid
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 9; y++) {
        for (let z = 0; z < 9; z++) {
          this.addVoxel(x, y, z, 0, false);
        }
      }
    }
  }

  private loadModel(model: VoxelModel): void {
    // Clear existing voxels
    this.meshes.forEach(mesh => {
      this.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.meshes.clear();
    this.voxels.clear();

    // Add new voxels
    model.voxels.forEach(voxel => {
      this.addVoxel(voxel.x, voxel.y, voxel.z, voxel.color, false);
    });
  }

  public setupInteraction(): void {
    if (!this.domElement) {
      console.error('No canvas element found for interaction setup');
      return;
    }
  }

  private updateHoverState(): void {
    // Reset previous hover state
    if (this.hoveredMesh && this.originalEmissive !== null) {
      (this.hoveredMesh.material as THREE.MeshPhongMaterial).emissive.setHex(this.originalEmissive);
      this.hoveredMesh = null;
      this.originalEmissive = null;
    }

    // Find new hover target
    const intersection = this.getIntersection();
    if (intersection) {
      const mesh = intersection.object as THREE.Mesh;
      this.hoveredMesh = mesh;
      const material = mesh.material as THREE.MeshPhongMaterial;
      this.originalEmissive = material.emissive.getHex();
      material.emissive.setHex(0x444444);
    }
  }

  private getIntersection(): THREE.Intersection | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(Array.from(this.meshes.values()), false);
    return intersects[0] || null;
  }

  private handleVoxelOperation(): void {
    const intersection = this.getIntersection();
    if (!intersection) return;

    if (this.isEraseMode) {
      const voxelPos = this.worldToGrid(intersection.object.position);
      this.removeVoxel(voxelPos.x, voxelPos.y, voxelPos.z);
    } else {
      const normal = intersection.face?.normal || new THREE.Vector3();
      const point = intersection.point.clone().add(normal.multiplyScalar(0.5));
      const voxelPos = this.worldToGrid(point);
      this.addVoxel(voxelPos.x, voxelPos.y, voxelPos.z, this.currentColor, true);
    }
  }

  private worldToGrid(position: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(
      Math.round(position.x + 4),
      Math.round(position.y + 4),
      Math.round(position.z + 4)
    );
  }

  private addVoxel(x: number, y: number, z: number, colorIndex: number, notify: boolean = true): void {
    // Check bounds
    if (x < 0 || x >= 9 || y < 0 || y >= 9 || z < 0 || z >= 9) {
      console.log('Attempted to add voxel out of bounds:', x, y, z);
      return;
    }

    const key = `${x},${y},${z}`;
    if (this.voxels.has(key)) {
      console.log('Voxel already exists at:', x, y, z);
      return;
    }

    console.log('Adding voxel at:', x, y, z, 'with color:', colorIndex);
    const voxel: VoxelData = { x, y, z, color: colorIndex };
    this.voxels.set(key, voxel);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: this.palette[colorIndex] });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(x - 4, y - 4, z - 4); // Center the grid
    this.add(mesh);
    this.meshes.set(key, mesh);

    if (notify) {
      this.notifyModelUpdate();
    }
  }

  private removeVoxel(x: number, y: number, z: number): void {
    const key = `${x},${y},${z}`;
    if (!this.voxels.has(key)) {
      console.log('No voxel found to remove at:', x, y, z);
      return;
    }

    console.log('Removing voxel at:', x, y, z);
    const mesh = this.meshes.get(key);
    if (mesh) {
      // Create animation for shrinking effect
      const startTime = Date.now();
      const duration = 200; // Animation duration in milliseconds
      const startScale = 1;
      const endScale = 0;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easeOutQuad for smooth deceleration
        const scale = startScale - (startScale - endScale) * (1 - Math.pow(1 - progress, 2));
        mesh.scale.set(scale, scale, scale);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Remove the mesh after animation completes
          this.remove(mesh);
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
          this.meshes.delete(key);
          this.voxels.delete(key);
          this.notifyModelUpdate();
        }
      };

      animate();
    } else {
      this.voxels.delete(key);
      this.notifyModelUpdate();
    }
  }

  private notifyModelUpdate(): void {
    this.onModelUpdated(this.exportModel());
  }

  public exportModel(): VoxelModel {
    return {
      palette: this.palette.map(color => `0x${color.toString(16)}`),
      voxels: Array.from(this.voxels.values())
    };
  }

  public setColor(index: number): void {
    if (index >= 0 && index < this.palette.length) {
      console.log('Setting color to index:', index);
      this.currentColor = index;
    }
  }

  public setMode(mode: 'add' | 'erase'): void {
    console.log('Setting mode to:', mode);
    this.isEraseMode = mode === 'erase';
  }

  public dispose(): void {
    if (this.inputHandler) {
      this.inputHandler.dispose();
    }

    // Reset hover state
    if (this.hoveredMesh && this.originalEmissive !== null) {
      (this.hoveredMesh.material as THREE.MeshPhongMaterial).emissive.setHex(this.originalEmissive);
      this.hoveredMesh = null;
      this.originalEmissive = null;
    }

    // Dispose of all geometries and materials
    this.meshes.forEach(mesh => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
  }
} 