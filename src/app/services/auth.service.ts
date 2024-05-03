import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import firebase from 'firebase/compat/app'; 
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser$: Observable<firebase.User | null>; // Correct User type from Firebase

  constructor(private afAuth: AngularFireAuth,    private firestore: AngularFirestore) {
    this.currentUser$ = this.afAuth.authState; // authState provides the current user
    
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

  reauthenticate(password: string): Promise<void> {
    const user = this.afAuth.currentUser;
    return user.then(u => {
      if (!u) throw new Error('Not logged in');
      const credential = firebase.auth.EmailAuthProvider.credential(u.email!, password);
      return u.reauthenticateWithCredential(credential).then(() => {}); // Ignore the return of the reauthentication
    });
}

async deleteUserAccount(): Promise<void> {
  const user = await this.afAuth.currentUser;
  if (!user) {
    throw new Error('No user logged in.');
  }

  // Delete user data from Firestore
  await this.deleteUserData(user.uid);

  // Now delete the user account
  return user.delete();
}

private async deleteUserData(userId: string): Promise<void> {
  // Reference to the user's transactions and user document
  const userRef = this.firestore.doc(`users/${userId}`);
  const userTransactionsRef = this.firestore.collection(`users/${userId}/transactions`);

  // Start a batch to delete all transactions and the user document
  const batch = this.firestore.firestore.batch();

  // Retrieve all transaction documents for the user
  const snapshot = await userTransactionsRef.get().toPromise();
  
  // Ensure snapshot is defined before proceeding
  if (snapshot) {
    snapshot.forEach(doc => {
      batch.delete(doc.ref); // Add each transaction document to the batch for deletion
    });

    // Add the user document to the batch for deletion
    batch.delete(userRef.ref);

    // Commit the batch to delete all the collected documents
    await batch.commit();
    console.log('User and transactions successfully deleted.');
  } else {
    console.error('No transactions found or error fetching transactions.');
  }
}

}
