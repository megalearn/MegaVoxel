import * as THREE from 'three';

interface VoxelData {
  x: number;
  y: number;
  z: number;
  color: number;
}

interface MegaVoxelOptions {
  palette: number[];
  camera: THREE.Camera;
  onModelUpdated: (model: { palette: string[], voxels: VoxelData[] }) => void;
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

  public setupInteraction(): void {
    if (!this.domElement) {
      console.error('No canvas element found for interaction setup');
      return;
    }

    // Bind the methods to preserve 'this' context
    this.onClick = this.onClick.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);

    this.domElement.addEventListener('click', this.onClick);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    
    console.log('Interaction setup complete');
  }

  private updateMousePosition(event: MouseEvent): void {
    if (!this.domElement) return;

    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onClick(event: MouseEvent): void {
    console.log('Click event received');
    this.updateMousePosition(event);
    const intersection = this.getIntersection();
    
    console.log('Intersection:', intersection);
    if (!intersection) return;

    if (this.isEraseMode) {
      console.log('Erasing voxel at position:', intersection.object.position);
      const voxelPos = this.worldToGrid(intersection.object.position);
      this.removeVoxel(voxelPos.x, voxelPos.y, voxelPos.z);
    } else {
      console.log('Adding voxel at intersection point:', intersection.point);
      const normal = intersection.face?.normal || new THREE.Vector3();
      const point = intersection.point.clone().add(normal.multiplyScalar(0.5));
      const voxelPos = this.worldToGrid(point);
      this.addVoxel(voxelPos.x, voxelPos.y, voxelPos.z, this.currentColor);
    }
  }

  private onMouseMove(event: MouseEvent): void {
    this.updateMousePosition(event);
    // TODO: Add hover effect later
  }

  private getIntersection(): THREE.Intersection | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(Array.from(this.meshes.values()), false);
    console.log('Raycaster intersections:', intersects);
    return intersects[0] || null;
  }

  private worldToGrid(position: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(
      Math.round(position.x + 4),
      Math.round(position.y + 4),
      Math.round(position.z + 4)
    );
  }

  private addVoxel(x: number, y: number, z: number, colorIndex: number): void {
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

    this.notifyModelUpdate();
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
      console.log('Setting color to index:', index);
      this.currentColor = index;
    }
  }

  public setMode(mode: 'add' | 'erase'): void {
    console.log('Setting mode to:', mode);
    this.isEraseMode = mode === 'erase';
  }

  public dispose(): void {
    if (this.domElement) {
      this.domElement.removeEventListener('click', this.onClick);
      this.domElement.removeEventListener('mousemove', this.onMouseMove);
    }

    // Dispose of all geometries and materials
    this.meshes.forEach(mesh => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
  }
} 