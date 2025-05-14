import * as THREE from 'three';

export class CameraControls {
  private camera: THREE.PerspectiveCamera;
  private element: HTMLElement;
  private isDragging: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private spherical: THREE.Spherical;
  private minDistance: number = 5;
  private maxDistance: number = 50;
  private rotateSpeed: number = 1.0;

  constructor(camera: THREE.PerspectiveCamera, element: HTMLElement) {
    this.camera = camera;
    this.element = element;
    
    // Convert camera position to spherical coordinates
    this.spherical = new THREE.Spherical().setFromVector3(
      this.camera.position.sub(this.target)
    );

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.element.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.element.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.element.addEventListener('wheel', this.onWheel.bind(this));
    
    // Prevent context menu on right click
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaMove = {
      x: event.clientX - this.previousMousePosition.x,
      y: event.clientY - this.previousMousePosition.y
    };

    // Update spherical coordinates based on mouse movement
    this.spherical.theta -= deltaMove.x * 0.01 * this.rotateSpeed;
    this.spherical.phi = Math.max(
      0.1,
      Math.min(Math.PI / 2, this.spherical.phi - deltaMove.y * 0.01 * this.rotateSpeed)
    );

    // Convert back to Cartesian coordinates
    const newPosition = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(newPosition.add(this.target));
    this.camera.lookAt(this.target);

    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();

    // Update radius (distance from target)
    this.spherical.radius = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.spherical.radius + event.deltaY * 0.01)
    );

    // Update camera position
    const newPosition = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(newPosition.add(this.target));
  }

  public update(): void {
    // No animation updates needed for now
  }

  public dispose(): void {
    this.element.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.element.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.element.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.element.removeEventListener('wheel', this.onWheel.bind(this));
  }
} 