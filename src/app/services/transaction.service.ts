import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { map, startWith, switchMap, take, tap } from 'rxjs/operators';
import { Transaction } from '../models/transaction.model';
import { Timestamp } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {}

  // Gets the total of transactions by type for a specific user
  getTotalByUserId(type: string, userId: string): Observable<number> {
    return this.firestore.collection<Transaction>(`users/${userId}/transactions`, ref => ref.where('type', '==', type))
      .valueChanges()
      .pipe(
        map(transactions => transactions.reduce((acc, transaction) => acc + transaction.amount, 0)),
        startWith(0)
      );
  }

  getTotalByTypeAndDate(type: string, userId: string, date: Date): Observable<number> {
    const startOfMonth = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
    const endOfMonth = new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59));
    const startTimestamp = Timestamp.fromDate(startOfMonth);
    const endTimestamp = Timestamp.fromDate(endOfMonth);

    return this.firestore.collection<Transaction>(`users/${userId}/transactions`, ref =>
      ref.where('type', '==', type)
         .where('date', '>=', startTimestamp)
         .where('date', '<=', endTimestamp))
      .valueChanges()
      .pipe(
        map(transactions => transactions.reduce((acc, curr) => acc + curr.amount, 0)),
        startWith(0)
      );
  }

  // Fetches transactions for a specific user by type and date
  getTransactionsByUserIdAndDate(userId: string, date: Date): Observable<Transaction[]> {
    const startOfMonth = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
    const endOfMonth = new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59));
    const startTimestamp = Timestamp.fromDate(startOfMonth);
    const endTimestamp = Timestamp.fromDate(endOfMonth);

    return this.firestore.collection<Transaction>(`users/${userId}/transactions`, ref =>
      ref.where('date', '>=', startTimestamp)
         .where('date', '<=', endTimestamp)
         .orderBy('date', 'desc'))
      .valueChanges();
  }

  // Adds a transaction to Firestore under a user-specific path
  addTransaction(transaction: Transaction): Promise<void> {
    return this.afAuth.authState.pipe(
      take(1),
      switchMap(user => {
        if (user) {
          return this.firestore.collection(`users/${user.uid}/transactions`).add(transaction)
            .then(docRef => {
              console.log('Transaction added with ID:', docRef.id);
              return;
            });
        } else {
          throw new Error('No authenticated user available');
        }
      }),
      tap({
        next: () => console.log('Transaction successfully added'),
        error: error => console.error('Error adding transaction:', error)
      })
    ).toPromise().catch(error => {
      console.error('Error in adding transaction:', error);
      throw error;
    });
  }

  // Fetches all transactions of a specific type for a user
  getTransactionsByUserId(userId: string): Observable<Transaction[]> {
    return this.firestore.collection<Transaction>(`users/${userId}/transactions`, ref => ref.orderBy('date', 'desc'))
      .valueChanges({ idField: 'id' })
      .pipe(
        tap(transactions => console.log("All transactions for user:", userId, transactions))
      );
  }
    // Fetches transactions by type
    getTransactionsByTypeAndUserId(type: string, userId: string): Observable<Transaction[]> {
      return this.firestore.collection<Transaction>(`users/${userId}/transactions`, 
        ref => ref.where('type', '==', type).orderBy('date', 'desc'))
        .valueChanges();
    }

    getTransactionsByTypeAndUserIdAndDate(type: string, userId: string, date: Date): Observable<Transaction[]> {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    
      return this.firestore.collection<Transaction>(`users/${userId}/transactions`, ref =>
        ref.where('type', '==', type)
           .where('date', '>=', startOfMonth)
           .where('date', '<=', endOfMonth)
           .orderBy('date', 'desc'))
        .valueChanges();
    }
}
