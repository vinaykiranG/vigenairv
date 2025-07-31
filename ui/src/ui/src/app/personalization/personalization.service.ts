/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injectable, NgZone } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AppSettings {
  brandName: string;
  primaryColor: string;
  logoUrl?: string;
  updatedAt?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PersonalizationService {
  private baseUrl = environment.production 
    ? '/api' // Use relative path in production
    : 'http://localhost:8000/api'; // Local development server

  private settingsSubject = new BehaviorSubject<AppSettings>({
    brandName: 'ViGenAiR',
    primaryColor: '#1976D2',
    logoUrl: 'https://services.google.com/fh/files/misc/vigenair_logo.png'
  });

  public settings$ = this.settingsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private ngZone: NgZone
  ) {
    this.loadSettings();
  }

  /**
   * Load settings from the backend
   */
  loadSettings(): void {
    this.getSettings().subscribe({
      next: (settings) => {
        this.settingsSubject.next(settings);
        this.applySettings(settings);
      },
      error: (error) => {
        console.error('Failed to load settings:', error);
      }
    });
  }

  /**
   * Get current settings from backend
   */
  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(`${this.baseUrl}/settings`);
  }

  /**
   * Save settings to backend
   */
  saveSettings(
    brandName: string,
    primaryColor: string,
    logoFile?: File | null
  ): Observable<AppSettings> {
    const formData = new FormData();
    formData.append('brand_name', brandName);
    formData.append('primary_color', primaryColor);
    formData.append('user_id', 'test_user_123'); // In production, get from auth service
    
    if (logoFile) {
      formData.append('logo_file', logoFile);
    }

    return new Observable<AppSettings>((subscriber) => {
      this.http.post<AppSettings>(`${this.baseUrl}/settings`, formData).subscribe({
        next: (settings) => {
          this.ngZone.run(() => {
            this.settingsSubject.next(settings);
            this.applySettings(settings);
            subscriber.next(settings);
            subscriber.complete();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            subscriber.error(error);
          });
        }
      });
    });
  }

  /**
   * Reset settings to defaults
   */
  resetSettings(): Observable<AppSettings> {
    return new Observable<AppSettings>((subscriber) => {
      this.http.delete<AppSettings>(`${this.baseUrl}/settings`).subscribe({
        next: (settings) => {
          this.ngZone.run(() => {
            this.settingsSubject.next(settings);
            this.applySettings(settings);
            subscriber.next(settings);
            subscriber.complete();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            subscriber.error(error);
          });
        }
      });
    });
  }

  /**
   * Apply settings to the DOM for real-time updates
   */
  private applySettings(settings: AppSettings): void {
    // Update CSS custom properties for theming
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    document.documentElement.style.setProperty('--primary-color-rgb', this.hexToRgb(settings.primaryColor));
    
    // Apply comprehensive Material Design theming
    this.applyMaterialTheme(settings.primaryColor);
    
    // Update page title
    document.title = `${settings.brandName} - Video Ad Generator`;
    
    // Dispatch custom event for components that need to react to settings changes
    window.dispatchEvent(new CustomEvent('settingsUpdated', { 
      detail: settings 
    }));
  }

  /**
   * Apply comprehensive Material Design theming
   */
  public applyMaterialTheme(primaryColor: string): void {
    const rgb = this.hexToRgb(primaryColor);
    const hsl = this.hexToHsl(primaryColor);
    
    // Generate color variations
    const primaryLight = this.lightenColor(primaryColor, 20);
    const primaryDark = this.darkenColor(primaryColor, 20);
    const primaryVeryLight = this.lightenColor(primaryColor, 40);
    
    // Update all CSS custom properties for comprehensive theming
    const root = document.documentElement;
    
    // Base colors
    root.style.setProperty('--primary-color', primaryColor);
    root.style.setProperty('--primary-color-rgb', rgb);
    root.style.setProperty('--primary-light', primaryLight);
    root.style.setProperty('--primary-dark', primaryDark);
    root.style.setProperty('--primary-very-light', primaryVeryLight);
    
    // Material Design specific properties
    root.style.setProperty('--mat-primary', primaryColor);
    root.style.setProperty('--mat-primary-rgb', rgb);
    root.style.setProperty('--mat-primary-contrast', this.getContrastColor(primaryColor));
    
    // Apply to existing Material theme classes
    this.injectDynamicStyles(primaryColor, primaryLight, primaryDark, rgb);
  }

  /**
   * Inject dynamic styles for Material components
   */
  private injectDynamicStyles(primary: string, primaryLight: string, primaryDark: string, rgb: string): void {
    // Remove existing dynamic styles
    const existingStyle = document.getElementById('dynamic-material-theme');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new style element
    const style = document.createElement('style');
    style.id = 'dynamic-material-theme';
    style.innerHTML = `
      /* Material Buttons */
      .mat-mdc-raised-button.mat-primary,
      .mat-mdc-unelevated-button.mat-primary,
      .mat-mdc-fab.mat-primary,
      .mat-mdc-mini-fab.mat-primary {
        background-color: ${primary} !important;
        color: ${this.getContrastColor(primary)} !important;
      }

      .mat-mdc-raised-button.mat-primary:hover,
      .mat-mdc-unelevated-button.mat-primary:hover,
      .mat-mdc-fab.mat-primary:hover,
      .mat-mdc-mini-fab.mat-primary:hover {
        background-color: ${primaryDark} !important;
      }

      .mat-mdc-outlined-button.mat-primary {
        border-color: ${primary} !important;
        color: ${primary} !important;
      }

      .mat-mdc-outlined-button.mat-primary:hover {
        background-color: rgba(${rgb}, 0.04) !important;
      }

      /* Material Toolbar */
      .mat-toolbar.mat-primary {
        background-color: ${primary} !important;
        color: ${this.getContrastColor(primary)} !important;
      }

      /* Material Form Fields */
      .mat-mdc-form-field.mat-focused .mat-mdc-form-field-focus-overlay {
        background-color: rgba(${rgb}, 0.12) !important;
      }

      .mat-mdc-form-field.mat-focused .mdc-floating-label {
        color: ${primary} !important;
      }

      .mat-mdc-form-field.mat-focused .mdc-line-ripple::after {
        border-bottom-color: ${primary} !important;
      }

      .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
      .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch,
      .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing {
        border-color: ${primary} !important;
      }

      /* Material Checkboxes */
      .mat-mdc-checkbox.mat-primary .mdc-checkbox__native-control:enabled:checked ~ .mdc-checkbox__background,
      .mat-mdc-checkbox.mat-primary .mdc-checkbox__native-control:enabled:indeterminate ~ .mdc-checkbox__background {
        background-color: ${primary} !important;
        border-color: ${primary} !important;
      }

      .mat-mdc-checkbox.mat-primary .mdc-checkbox__native-control:enabled ~ .mdc-checkbox__background .mdc-checkbox__checkmark {
        color: ${this.getContrastColor(primary)} !important;
      }

      /* Material Slide Toggles */
      .mat-mdc-slide-toggle.mat-primary .mdc-switch--selected .mdc-switch__track {
        background-color: ${primary} !important;
      }

      .mat-mdc-slide-toggle.mat-primary .mdc-switch--selected .mdc-switch__handle::after {
        background-color: ${primary} !important;
      }

      .mat-mdc-slide-toggle.mat-primary .mdc-switch--selected:enabled:hover .mdc-switch__handle::after {
        background-color: ${primaryDark} !important;
      }

      /* Material Button Toggles */
      .mat-button-toggle-group.mat-button-toggle-group-appearance-standard .mat-button-toggle-checked {
        background-color: ${primaryLight} !important;
        color: ${primary} !important;
      }

      /* Material Chips */
      .mat-mdc-chip.mat-primary {
        background-color: ${primary} !important;
        color: ${this.getContrastColor(primary)} !important;
      }

      .mat-mdc-chip.mat-primary .mat-mdc-chip-focus-overlay {
        background-color: ${this.getContrastColor(primary)} !important;
      }

      /* Material Progress Bars */
      .mat-mdc-progress-bar .mdc-linear-progress__bar-inner {
        border-color: ${primary} !important;
      }

      .mat-mdc-progress-bar.mat-primary .mdc-linear-progress__buffer-bar {
        background-color: ${primaryLight} !important;
      }

      /* Material Sliders */
      .mat-mdc-slider.mat-primary .mdc-slider__track--active_fill {
        border-color: ${primary} !important;
      }

      .mat-mdc-slider.mat-primary .mdc-slider__handle {
        background-color: ${primary} !important;
        border-color: ${primary} !important;
      }

      /* Material Tabs */
      .mat-mdc-tab-group.mat-primary .mat-mdc-tab .mdc-tab__text-label {
        color: rgba(${rgb}, 0.6) !important;
      }

      .mat-mdc-tab-group.mat-primary .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
        color: ${primary} !important;
      }

      .mat-mdc-tab-group.mat-primary .mat-mdc-tab-header .mat-mdc-tab-header-pagination-chevron {
        border-color: ${primary} !important;
      }

      .mat-mdc-tab-group.mat-primary .mdc-tab-indicator__content--underline {
        border-color: ${primary} !important;
      }

      /* Material Select */
      .mat-mdc-select.mat-focused .mat-mdc-select-arrow {
        color: ${primary} !important;
      }

      /* Material Icons with primary color */
      .mat-icon.mat-primary {
        color: ${primary} !important;
      }

      /* Badge colors */
      .mat-badge.mat-badge-accent .mat-badge-content {
        background: ${primary} !important;
        color: ${this.getContrastColor(primary)} !important;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Convert hex color to RGB values
   */
  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `${r}, ${g}, ${b}`;
    }
    return '25, 118, 210'; // Default blue RGB
  }

  /**
   * Convert hex color to HSL values
   */
  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  /**
   * Lighten a hex color by a percentage
   */
  private lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  /**
   * Darken a hex color by a percentage
   */
  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
  }

  /**
   * Get contrast color (white or black) for a given background color
   */
  private getContrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  /**
   * Get current settings synchronously
   */
  getCurrentSettings(): AppSettings {
    return this.settingsSubject.value;
  }
}