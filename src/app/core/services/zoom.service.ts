import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ZoomService {
  private zoomLevel = 100; // Default zoom level (100%)
  private readonly MIN_ZOOM = 50;  // 50%
  private readonly MAX_ZOOM = 200; // 200%
  private readonly ZOOM_STEP = 10; // 10% increments

  constructor() {
    // Load saved zoom level from localStorage if available
    const savedZoom = localStorage.getItem('appZoomLevel');
    if (savedZoom) {
      this.zoomLevel = parseInt(savedZoom, 10);
      this.applyZoom();
    }
  }

  /**
   * Increase zoom level
   */
  zoomIn(): void {
    if (this.zoomLevel < this.MAX_ZOOM) {
      this.zoomLevel = Math.min(this.zoomLevel + this.ZOOM_STEP, this.MAX_ZOOM);
      this.saveAndApplyZoom();
    }
  }

  /**
   * Decrease zoom level
   */
  zoomOut(): void {
    if (this.zoomLevel > this.MIN_ZOOM) {
      this.zoomLevel = Math.max(this.zoomLevel - this.ZOOM_STEP, this.MIN_ZOOM);
      this.saveAndApplyZoom();
    }
  }

  /**
   * Reset zoom to default (100%)
   */
  resetZoom(): void {
    this.zoomLevel = 100;
    this.saveAndApplyZoom();
  }

  /**
   * Set specific zoom level
   */
  setZoomLevel(level: number): void {
    if (level >= this.MIN_ZOOM && level <= this.MAX_ZOOM) {
      this.zoomLevel = level;
      this.saveAndApplyZoom();
    }
  }

  /**
   * Get current zoom level
   */
  getZoomLevel(): number {
    return this.zoomLevel;
  }

  /**
   * Apply zoom to the application container
   */
  private applyZoom(): void {
    const appContainer = document.querySelector('.app-container') as HTMLElement;
    if (appContainer) {
      const scale = this.zoomLevel / 100;
      
      // Apply transform
      appContainer.style.transform = `scale(${scale})`;
      appContainer.style.transformOrigin = 'top left';
      
      // Adjust container size to prevent content cutoff
      if (scale !== 1) {
        const inverseScale = 1 / scale;
        appContainer.style.width = `${100 * inverseScale}%`;
        appContainer.style.height = `${100 * inverseScale}%`;
      } else {
        appContainer.style.width = '100%';
        appContainer.style.height = '100%';
      }
    }
    
    // Handle body overflow
    if (this.zoomLevel !== 100) {
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.removeProperty('overflow');
    }
  }

  /**
   * Save zoom level to localStorage and apply it
   */
  private saveAndApplyZoom(): void {
    localStorage.setItem('appZoomLevel', this.zoomLevel.toString());
    this.applyZoom();
  }
}