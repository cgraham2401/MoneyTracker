import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Transaction } from '../models/transaction.model'; 

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor(private firestore: AngularFirestore) { }

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
}
