import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  darkModeEnabled: boolean = false;
  cumulativeViewEnabled: boolean = false;

  constructor(private settingsService: SettingsService) {}

  ngOnInit() {
    this.settingsService.darkModeEnabled$.subscribe(enabled => {
      this.darkModeEnabled = enabled;
      this.updateDarkModeClass(enabled);
    });

    this.settingsService.cumulativeViewEnabled$.subscribe(enabled => {
      this.cumulativeViewEnabled = enabled;
    });
  }

  toggleDarkMode(event: any) {
    const newState = event.detail.checked;
    this.settingsService.setDarkModeEnabled(newState).then(() => {
      this.updateDarkModeClass(newState);
    });
  }

  private updateDarkModeClass(enable: boolean) {
    document.body.classList.toggle('ion-palette-dark', enable);
  }

  toggleCumulativeView(event: any) {
    const newState = event.detail.checked;
    this.settingsService.setCumulativeViewEnabled(newState);
  }
}
