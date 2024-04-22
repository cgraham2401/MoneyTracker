import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser$: Observable<any>; // Observable to track the current user

  constructor(private afAuth: AngularFireAuth) {
    this.currentUser$ = this.afAuth.authState; // authState is an observable
  }

  get currentUserId(): string | undefined {
    let userId: string | undefined = undefined;
    this.afAuth.authState.subscribe(user => {
      if (user) {
        userId = user.uid; // Get user ID from Firebase authentication
      }
    });
    return userId;
  }
}
