import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { AppSetting } from './app-settings.interface';

@Injectable({
  providedIn: 'root',
})
export class AppSettingsService {
  private readonly localStorageKey = 'appSettingsHistory';
  private historySettingsSubject = new BehaviorSubject<AppSetting[]>([]);
  historySettings$ = this.historySettingsSubject.asObservable();

  constructor() {
    this.loadHistorySettings();
  }

  private loadHistorySettings(): void {
    const history = localStorage.getItem(this.localStorageKey);
    if (history) {
      this.historySettingsSubject.next(JSON.parse(history));
    }
  }

  private saveHistorySettings(settings: AppSetting[]): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(settings));
    this.historySettingsSubject.next(settings);
  }

  addSettingToHistory(newSetting: Omit<AppSetting, 'id'>): void {
    const currentHistory = this.historySettingsSubject.value;
    const settingWithId = { ...newSetting, id: uuidv4() };
    const updatedHistory = [settingWithId, ...currentHistory];
    this.saveHistorySettings(updatedHistory);
  }

  deleteSettingFromHistory(id: string): void {
    const currentHistory = this.historySettingsSubject.value;
    const updatedHistory = currentHistory.filter(setting => setting.id !== id);
    this.saveHistorySettings(updatedHistory);
  }
}
