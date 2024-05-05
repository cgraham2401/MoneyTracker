import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Platform } from '@ionic/angular';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  public isLoggedIn: boolean = false;

  constructor(private afAuth: AngularFireAuth, private router: Router, private platform: Platform) {
    this.afAuth.authState.subscribe(user => {
      this.isLoggedIn = !!user;
    });
    this.initializeApp();
  }

  logout() {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/login']);
    });
  }

  async initializeApp() {
    this.platform.ready().then(async () => {
      // Ensuring overlays are false so padding works
      await StatusBar.setOverlaysWebView({ overlay: false });
      // Setting status bar style to dark (light content)
      await this.setStatusBarStyle();
      // Other initialization code...

      // Optionally listen for platform resume events
      this.platform.resume.subscribe(async () => {
        await this.setStatusBarStyle();
      });
    });
  }

  private async setStatusBarStyle() {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#000000' });
    } catch (error) {
      console.error('Failed to set status bar style:', error);
    }
  }

}
