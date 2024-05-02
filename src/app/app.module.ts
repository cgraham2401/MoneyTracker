import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';

// Import AngularFire modules
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { IonicStorageModule } from '@ionic/storage-angular';
import { environment } from 'src/environments/environment';

// Firebase configuration
const firebaseConfig = {
  apiKey: environment.firebaseApiKey,
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
    HttpClientModule,
    IonicStorageModule.forRoot() 
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
