import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// Import AngularFire modules
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCFt7ToeqtYfRZJTQAME29RVISMU9BZOk",
  authDomain: "moneytracker-d40d1.firebaseapp.com",
  projectId: "moneytracker-d40d1",
  storageBucket: "moneytracker-d40d1.appspot.com",
  messagingSenderId: "566435254300",
  appId: "1:566435254300:web:2c800961036c8522db4fd9",
  measurementId: "G-2C8EN4F1QF"
};

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    AngularFireModule.initializeApp(firebaseConfig),  // Initialize Firebase
    AngularFirestoreModule,  // Firebase database module
    AngularFireAuthModule,
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
