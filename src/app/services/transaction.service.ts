import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Transaction } from '../models/transaction.model'; 
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor(private firestore: AngularFirestore,
    private authService: AuthService
  ) { }

  getTotal(type: string): Observable<number> {
    return this.firestore.collection<Transaction>('transactions', ref => ref.where('type', '==', type))
      .valueChanges()
      .pipe(
        map(transactions => transactions.reduce((acc, transaction) => acc + transaction.amount, 0))
      );
      
  }
  getTransactionsByUserId(userId: string): Observable<Transaction[]> {
    return this.firestore.collection<Transaction>('transactions', ref => ref.where('userId', '==', userId).orderBy('date', 'desc'))
      .valueChanges({ idField: 'id' });
}
addTransaction(transaction: Transaction): Promise<void> {
  const userId = this.authService.currentUserId; // Get the current user's ID from AuthService
  return this.firestore
    .doc(`users/${userId}`) // Access the user's document
    .collection('transactions') // Access the transactions subcollection
    .add(transaction) // Add the transaction
    .then(docRef => console.log('Transaction added with ID:', docRef.id))
    .catch(error => console.error('Error adding transaction:', error));
}


// Add a method to fetch transactions by type
getTransactionsByType(type: string): Observable<Transaction[]> {
  return this.firestore.collection<Transaction>('transactions', 
    ref => ref.where('type', '==', type)
              .orderBy('date', 'desc'))
    .valueChanges();
}

}