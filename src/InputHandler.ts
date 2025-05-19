import * as THREE from 'three';

interface InputHandlerOptions {
  element: HTMLElement;
  onPointerMove: (position: THREE.Vector2) => void;
  onPointerDown: (position: THREE.Vector2) => void;
  onPointerUp: (position: THREE.Vector2) => void;
  onPointerClick: (position: THREE.Vector2) => void;
}

export class InputHandler {
  private element: HTMLElement;
  private onPointerMove: InputHandlerOptions['onPointerMove'];
  private onPointerDown: InputHandlerOptions['onPointerDown'];
  private onPointerUp: InputHandlerOptions['onPointerUp'];
  private onPointerClick: InputHandlerOptions['onPointerClick'];
  
  private isDragging: boolean = false;
  private dragStartPosition: { x: number; y: number } | null = null;
  private readonly dragThreshold = 5; // pixels

  constructor(options: InputHandlerOptions) {
    this.element = options.element;
    this.onPointerMove = options.onPointerMove;
    this.onPointerDown = options.onPointerDown;
    this.onPointerUp = options.onPointerUp;
    this.onPointerClick = options.onPointerClick;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse events
    this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.element.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.element.addEventListener('mouseup', this.onMouseUp.bind(this));

    // Touch events
    this.element.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private updatePointerPosition(event: MouseEvent | Touch): THREE.Vector2 {
    const rect = this.element.getBoundingClientRect();
    return new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartPosition = { x: event.clientX, y: event.clientY };
    this.onPointerDown(this.updatePointerPosition(event));
  }

  private onMouseMove(event: MouseEvent): void {
    this.onPointerMove(this.updatePointerPosition(event));
  }

  private onMouseUp(event: MouseEvent): void {
    if (!this.isDragging || !this.dragStartPosition) return;

    // Calculate drag distance
    const dx = event.clientX - this.dragStartPosition.x;
    const dy = event.clientY - this.dragStartPosition.y;
    const dragDistance = Math.sqrt(dx * dx + dy * dy);

    this.onPointerUp(this.updatePointerPosition(event));

    // Only process as a click if the drag distance is small
    if (dragDistance < this.dragThreshold) {
      this.onPointerClick(this.updatePointerPosition(event));
    }

    this.isDragging = false;
    this.dragStartPosition = null;
  }

  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length !== 1) return;
    
    this.isDragging = true;
    this.dragStartPosition = { 
      x: event.touches[0].clientX, 
      y: event.touches[0].clientY 
    };
    this.onPointerDown(this.updatePointerPosition(event.touches[0]));
  }

  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length !== 1) return;
    
    this.onPointerMove(this.updatePointerPosition(event.touches[0]));
  }

  private onTouchEnd(event: TouchEvent): void {
    if (!this.isDragging || !this.dragStartPosition || event.touches.length > 0) return;

    // Calculate drag distance
    const dx = event.changedTouches[0].clientX - this.dragStartPosition.x;
    const dy = event.changedTouches[0].clientY - this.dragStartPosition.y;
    const dragDistance = Math.sqrt(dx * dx + dy * dy);

    this.onPointerUp(this.updatePointerPosition(event.changedTouches[0]));

    // Only process as a tap if the drag distance is small
    if (dragDistance < this.dragThreshold) {
      this.onPointerClick(this.updatePointerPosition(event.changedTouches[0]));
    }

    this.isDragging = false;
    this.dragStartPosition = null;
  }

  public dispose(): void {
    this.element.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.element.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.element.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.element.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }
} 