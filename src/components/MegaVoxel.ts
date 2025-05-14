import * as THREE from 'three';

interface VoxelData {
  x: number;
  y: number;
  z: number;
  color: number;
}

interface MegaVoxelOptions {
  palette: number[];
  onModelUpdated: (model: { palette: string[], voxels: VoxelData[] }) => void;
}

export class MegaVoxel extends THREE.Object3D {
  private palette: number[];
  private voxels: Map<string, VoxelData>;
  private onModelUpdated: MegaVoxelOptions['onModelUpdated'];
  private currentColor: number;
  private isEraseMode: boolean;
  private meshes: Map<string, THREE.Mesh>;

  constructor(options: MegaVoxelOptions) {
    super();
    this.palette = options.palette;
    this.onModelUpdated = options.onModelUpdated;
    this.voxels = new Map();
    this.meshes = new Map();
    this.currentColor = 0;
    this.isEraseMode = false;

    this.initializeGrid();
    this.setupInteraction();
  }

  private initializeGrid(): void {
    // Create initial 9x9x9 grid
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 9; y++) {
        for (let z = 0; z < 9; z++) {
          this.addVoxel(x, y, z, 0);
        }
      }
    }
  }

  private setupInteraction(): void {
    // This will be implemented later for handling mouse/touch input
    // It will use currentColor and isEraseMode when placing/removing voxels
  }

  private addVoxel(x: number, y: number, z: number, colorIndex: number): void {
    const key = `${x},${y},${z}`;
    const voxel: VoxelData = { x, y, z, color: colorIndex };
    this.voxels.set(key, voxel);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: this.palette[colorIndex] });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(x - 4, y - 4, z - 4); // Center the grid
    this.add(mesh);
    this.meshes.set(key, mesh);

    this.notifyModelUpdate();
  }

  private removeVoxel(x: number, y: number, z: number): void {
    const key = `${x},${y},${z}`;
    if (!this.voxels.has(key)) return;

    const mesh = this.meshes.get(key);
    if (mesh) {
      this.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.meshes.delete(key);
    }

    this.voxels.delete(key);    
    this.notifyModelUpdate();
  }

  private notifyModelUpdate(): void {
    const model = {
      palette: this.palette.map(color => `0x${color.toString(16)}`),
      voxels: Array.from(this.voxels.values())
    };
    this.onModelUpdated(model);
  }

  public setColor(index: number): void {
    if (index >= 0 && index < this.palette.length) {
      this.currentColor = index;
    }
  }

  public setMode(mode: 'add' | 'erase'): void {
    this.isEraseMode = mode === 'erase';
  }

  // This will be called when a voxel is clicked
  public handleVoxelInteraction(x: number, y: number, z: number): void {
    if (this.isEraseMode) {
      this.removeVoxel(x, y, z);
    } else {
      this.addVoxel(x, y, z, this.currentColor);
    }
  }
} 