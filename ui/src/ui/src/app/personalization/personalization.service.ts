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
    
    // Update page title
    document.title = `${settings.brandName} - Video Ad Generator`;
    
    // Dispatch custom event for components that need to react to settings changes
    window.dispatchEvent(new CustomEvent('settingsUpdated', { 
      detail: settings 
    }));
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
   * Get current settings synchronously
   */
  getCurrentSettings(): AppSettings {
    return this.settingsSubject.value;
  }
}