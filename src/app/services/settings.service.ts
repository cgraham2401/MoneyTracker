import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private _darkModeEnabled$ = new BehaviorSubject<boolean>(false);
  private _cumulativeViewEnabled$ = new BehaviorSubject<boolean>(false);

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    await this.storage.create();
    this.loadInitialSettings();
  }

  private async loadInitialSettings() {
    const darkModeEnabled = await this.storage.get('darkModeEnabled') ?? false;
    this._darkModeEnabled$.next(darkModeEnabled);
    const cumulativeViewEnabled = await this.storage.get('cumulativeViewEnabled') ?? false;
    this._cumulativeViewEnabled$.next(cumulativeViewEnabled);
  }

  // Getters for the observables
  get darkModeEnabled$() {
    return this._darkModeEnabled$.asObservable();
  }

  get cumulativeViewEnabled$() {
    return this._cumulativeViewEnabled$.asObservable();
  }

  // Setters that update both the BehaviorSubject and the storage
  async setDarkModeEnabled(enabled: boolean) {
    await this.storage.set('darkModeEnabled', enabled);
    this._darkModeEnabled$.next(enabled);
  }

  async setCumulativeViewEnabled(enabled: boolean) {
    await this.storage.set('cumulativeViewEnabled', enabled);
    this._cumulativeViewEnabled$.next(enabled);
  }
}