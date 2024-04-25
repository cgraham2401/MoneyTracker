import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
    darkModeEnabled: boolean = false;

    constructor() { }

    ngOnInit() { }

    toggleDarkMode() {
        this.darkModeEnabled = !this.darkModeEnabled;
        document.body.classList.toggle('dark', this.darkModeEnabled);
    }
}