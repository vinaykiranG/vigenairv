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

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Define the structure for the settings object
interface PersonalizationSettings {
  brandName: string;
  primaryColor: string;
  logoPreview: string | ArrayBuffer | null;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSidenavModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  // Properties for UI binding
  brandName: string = 'Default Brand';
  primaryColor: string = '#3f51b5'; // Default Angular Material primary color
  logoPreview: string | ArrayBuffer | null = './assets/dummy.png';

  // Property for the new checkbox
  loadPreviousSettings: boolean = false;

  // Key for Local Storage
  private readonly settingsKey = 'appPersonalizationSettings';

  // To toggle the settings side navigation
  @ViewChild('settingsSidenav') settingsSidenav!: MatSidenav;

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadAndApplySettings();
  }

  /**
   * Loads settings from Local Storage and applies them to the application.
   */
  loadAndApplySettings(): void {
    const savedSettings = localStorage.getItem(this.settingsKey);
    if (savedSettings) {
      const settings: PersonalizationSettings = JSON.parse(savedSettings);
      this.brandName = settings.brandName;
      this.primaryColor = settings.primaryColor;
      this.logoPreview = settings.logoPreview;
      this.applyColorTheme();
    }
  }

  /**
   * Saves the current settings to Local Storage and applies them immediately.
   */
  saveSettings(): void {
    try {
      const settings: PersonalizationSettings = {
        brandName: this.brandName,
        primaryColor: this.primaryColor,
        logoPreview: this.logoPreview,
      };
      localStorage.setItem(this.settingsKey, JSON.stringify(settings));
      this.applyColorTheme();
      this.snackBar.open('Settings saved successfully!', 'Dismiss', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Failed to save settings.', 'Dismiss', { duration: 3000 });
      console.error('Error saving settings to Local Storage:', error);
    }
  }

  /**
   * Resets settings to their default values and clears them from Local Storage.
   */
  resetSettings(): void {
    localStorage.removeItem(this.settingsKey);
    this.brandName = 'Default Brand';
    this.primaryColor = '#3f51b5';
    this.logoPreview = './assets/dummy.png';
    this.loadPreviousSettings = false;
    this.applyColorTheme();
    this.snackBar.open('Settings have been reset.', 'Dismiss', { duration: 3000 });
  }

  /**
   * Handles the logo file selection, converting the image to a Base64 string for preview.
   * @param event The file input change event.
   */
  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Applies the selected primary color as a CSS custom property on the root element.
   */
  private applyColorTheme(): void {
    document.documentElement.style.setProperty('--primary-theme-color', this.primaryColor);
  }

  /**
   * Handles the (change) event of the "Load Previous Settings" checkbox.
   */
  onLoadPreviousSettingsChange(): void {
    if (this.loadPreviousSettings) {
      const savedSettings = localStorage.getItem(this.settingsKey);
      if (savedSettings) {
        const settings: PersonalizationSettings = JSON.parse(savedSettings);
        // Populate form fields with stored values
        this.brandName = settings.brandName;
        this.primaryColor = settings.primaryColor;
        this.logoPreview = settings.logoPreview;
        this.snackBar.open('Previous settings loaded into the form.', 'Dismiss', { duration: 3000 });
      } else {
        this.snackBar.open('No previous settings found.', 'Dismiss', { duration: 3000 });
        // Uncheck the box since there are no settings to load
        this.loadPreviousSettings = false;
      }
    } else {
        // When unchecked, revert the form to the currently active settings.
        // In this implementation, loadAndApplySettings already sets the active state,
        // so we just call it again to ensure the form reflects the last saved state.
        this.loadAndApplySettings();
        this.snackBar.open('Form fields reverted to current settings.', 'Dismiss', { duration: 3000 });
    }
  }
}
