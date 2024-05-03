import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import firebase from 'firebase/compat/app'; // Import firebase to get the User type

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser$: Observable<firebase.User | null>;  // Correct User type from Firebase

  constructor(private afAuth: AngularFireAuth) {
    this.currentUser$ = this.afAuth.authState;  // authState provides the current user
  }

  get currentUserId$(): Observable<string | null> {
    return this.afAuth.authState.pipe(
      map(user => user ? user.uid : null)
    );
  }

  resetPassword(email: string): Promise<void> {
    return this.afAuth.sendPasswordResetEmail(email);
  }

  confirmResetPassword(password: string, code: string): Promise<void> {
    return this.afAuth.confirmPasswordReset(code, password);
  }

}
