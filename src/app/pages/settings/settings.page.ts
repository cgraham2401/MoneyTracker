import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  darkModeEnabled: boolean = false;
  cumulativeViewEnabled: boolean = false;

  constructor(
    private settingsService: SettingsService,
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router
  ) {}

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

  async deleteAccount() {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete your account? This will remove all your data and cannot be undone.',
      inputs: [{ name: 'password', type: 'password', placeholder: 'Confirm your password' }],
      buttons: [
        { text: 'Cancel', role: 'cancel', handler: () => true },
        { text: 'Delete', handler: data => this.handleDelete(data.password) }
      ]
    });
    await alert.present();
}

private async handleDelete(password: string): Promise<boolean> {
    try {
      // Re-authenticate first if needed
      await this.authService.reauthenticate(password);
      await this.authService.deleteUserAccount();
      console.log('Account successfully deleted.');
      this.router.navigate(['/login']);
      return true;
    } catch (error) {
      console.error('Failed to delete account:', error);
      return false;
    }
}
}
