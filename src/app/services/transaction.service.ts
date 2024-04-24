import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { map, startWith, switchMap, take, tap } from 'rxjs/operators';
import { Transaction } from '../models/transaction.model';  

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {}

  // Gets the total of transactions by type
  getTotal(type: string): Observable<number> {
    return this.firestore.collection<Transaction>('transactions', ref => ref.where('type', '==', type))
      .valueChanges()
      .pipe(
        map(transactions => transactions.reduce((acc, transaction) => acc + transaction.amount, 0))
      );
  }

  // Fetches transactions for a specific user
  getTransactionsByUserId(userId: string): Observable<Transaction[]> {
    console.log('Fetching transactions for user ID:', userId);
    return this.firestore.collection<Transaction>(`users/${userId}/transactions`, ref => ref.orderBy('date', 'desc'))
      .valueChanges({ idField: 'id' });
  }
  // Adds a transaction to the Firestore under a user-specific path
addTransaction(transaction: Transaction): Promise<void> {
  return this.afAuth.authState.pipe(
      take(1),
      switchMap(user => {
          if (user) {
              // Add the transaction and return a promise that resolves to 'void'
              return this.firestore.collection(`users/${user.uid}/transactions`).add(transaction)
                  .then(docRef => {
                      console.log('Transaction added with ID:', docRef.id);
                      // Explicitly resolve to 'void'
                      return;
                  });
          } else {
              // Throw an error if there is no user, which will be caught by the catch block
              throw new Error('No authenticated user available');
          }
      }),
      tap({
          next: () => console.log('Transaction successfully added'),
          error: error => console.error('Error adding transaction:', error)
      })
  ).toPromise().catch(error => {
      console.error('Error in adding transaction:', error);
      // Ensure to throw or handle the error as appropriate
      throw error;
  });
}


  // Fetches transactions by type
  getTransactionsByTypeAndUserId(type: string, userId: string): Observable<Transaction[]> {
    return this.firestore.collection<Transaction>(`users/${userId}/transactions`, 
      ref => ref.where('type', '==', type).orderBy('date', 'desc'))
      .valueChanges();
  }

  getTotalByUserId(type: string, userId: string): Observable<number> {
    return this.firestore.collection<Transaction>(`users/${userId}/transactions`, ref => ref.where('type', '==', type))
      .valueChanges()
      .pipe(
        map(transactions => transactions.reduce((acc, transaction) => acc + transaction.amount, 0)),
        tap(total => console.log(`Total ${type}: ${total}`)),
        startWith(0) // Ensure it emits a value even if the collection is empty
      );
}
}
