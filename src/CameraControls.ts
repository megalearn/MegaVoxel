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
  private touchStartDistance: number = 0;
  private isPinching: boolean = false;

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
    // Mouse events
    this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.element.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.element.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.element.addEventListener('wheel', this.onWheel.bind(this));
    
    // Touch events
    this.element.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.onTouchEnd.bind(this));
    
    // Prevent context menu on right click
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onMouseDown(event: MouseEvent): void {
    // Only handle right-click (button 2) or middle-click (button 1)
    if (event.button !== 1 && event.button !== 2) return;
    
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

    this.updateCameraRotation(deltaMove.x, deltaMove.y);

    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  }

  private onMouseUp(event: MouseEvent): void {
    // Only handle right-click (button 2) or middle-click (button 1)
    if (event.button !== 1 && event.button !== 2) return;
    this.isDragging = false;
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.updateCameraZoom(event.deltaY);
  }

  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      // Single touch - rotate
      this.isDragging = true;
      this.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    } else if (event.touches.length === 2) {
      // Two touches - pinch to zoom
      this.isPinching = true;
      this.touchStartDistance = this.getTouchDistance(event.touches);
    }
  }

  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    if (this.isDragging && event.touches.length === 1) {
      const deltaMove = {
        x: event.touches[0].clientX - this.previousMousePosition.x,
        y: event.touches[0].clientY - this.previousMousePosition.y
      };

      this.updateCameraRotation(deltaMove.x, deltaMove.y);

      this.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    } else if (this.isPinching && event.touches.length === 2) {
      const currentDistance = this.getTouchDistance(event.touches);
      const deltaDistance = currentDistance - this.touchStartDistance;
      this.updateCameraZoom(deltaDistance * 4.0);
      this.touchStartDistance = currentDistance;
    }
  }

  private onTouchEnd(event: TouchEvent): void {
    if (event.touches.length === 0) {
      this.isDragging = false;
      this.isPinching = false;
    } else if (event.touches.length === 1) {
      this.isPinching = false;
      this.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    }
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private updateCameraRotation(deltaX: number, deltaY: number): void {
    // Update spherical coordinates based on movement
    this.spherical.theta -= deltaX * 0.01 * this.rotateSpeed;
    this.spherical.phi = Math.max(
      0.1,
      Math.min(Math.PI / 2, this.spherical.phi - deltaY * 0.01 * this.rotateSpeed)
    );

    // Convert back to Cartesian coordinates
    const newPosition = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(newPosition.add(this.target));
    this.camera.lookAt(this.target);
  }

  private updateCameraZoom(delta: number): void {
    // Update radius (distance from target)
    this.spherical.radius = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.spherical.radius + delta * 0.02)
    );

    // Update camera position
    const newPosition = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(newPosition.add(this.target));
  }

  public update(): void {
    // No animation updates needed for now
  }

  public dispose(): void {
    // Mouse events
    this.element.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.element.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.element.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.element.removeEventListener('wheel', this.onWheel.bind(this));
    
    // Touch events
    this.element.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }
} 