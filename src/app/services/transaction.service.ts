import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { catchError, defaultIfEmpty } from 'rxjs/operators';
import { map, switchMap, take, tap } from 'rxjs/operators';
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
        defaultIfEmpty(0)
      );
  }

//new balance function
getTransactionsUpToDate(userId: string, endDate: Date): Observable<Transaction[]> {
  const endTimestamp = Timestamp.fromDate(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0, 23, 59, 59));
  return this.firestore.collection<Transaction>(`users/${userId}/transactions`, ref =>
      ref.where('date', '<=', endTimestamp)
         .orderBy('date', 'desc'))
  .snapshotChanges()
  .pipe(
      map(actions => actions.map(a => {
          const data = a.payload.doc.data() as Transaction;
          const id = a.payload.doc.id;
          return { id, ...data };
      }))
  );
}

  // Fetches transactions for a specific user by date and return both income/expense types
  getTransactionsByUserIdAndDate(userId: string, date: Date): Observable<Transaction[]> {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    const startTimestamp = Timestamp.fromDate(startOfMonth);
    const endTimestamp = Timestamp.fromDate(endOfMonth);

    return this.firestore.collection<Transaction>(`users/${userId}/transactions`, ref =>
        ref.where('date', '>=', startTimestamp)
           .where('date', '<=', endTimestamp)
           .orderBy('date', 'desc'))
      .snapshotChanges()
      .pipe(map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Transaction;
        const id = a.payload.doc.id;
        return { id, ...data }; // Merging the ID with the transaction data
      })));
  }

  getRecurringTransactionsByUserIdAndDate(userId: string, startDate: Date, endDate: Date): Observable<Transaction[]> {
    return this.firestore.collection<Transaction>(`users/${userId}/transactions`, ref =>
        ref.where('recurrence', '!=', 'none')
           .where('nextDueDate', '>=', Timestamp.fromDate(startDate))
           .where('nextDueDate', '<=', Timestamp.fromDate(endDate))
           .orderBy('nextDueDate', 'desc'))
        .snapshotChanges()
        .pipe(map(actions => actions.map(a => {
            const data = a.payload.doc.data() as Transaction;
            const id = a.payload.doc.id;
            return { id, ...data };
        })));
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

    // Fetches transactions by type


    getTransactionsByTypeAndUserIdAndDate(type: string, userId: string, date: Date): Observable<Transaction[]> {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      const startTimestamp = Timestamp.fromDate(startOfMonth);
      const endTimestamp = Timestamp.fromDate(endOfMonth);

      return this.firestore.collection<Transaction>(`users/${userId}/transactions`, ref =>
          ref.where('type', '==', type)
             .where('date', '>=', startTimestamp)
             .where('date', '<=', endTimestamp)
             .orderBy('date', 'desc'))
        .snapshotChanges()
        .pipe(map(actions => actions.map(a => {
          const data = a.payload.doc.data() as Transaction;
          const id = a.payload.doc.id;
          return { id, ...data };
        })));
    }

    getRecurringTransactionsByTypeAndUserIdAndDate(type: string, userId: string, startDate: Date, endOfMonth: Date, sevenDaysLater: Date, currentMonth: boolean): Observable<Transaction[]> {
      // Use sevenDaysLater only if it's the current month and the date exceeds the end of month
      const endDate = currentMonth && sevenDaysLater > endOfMonth ? sevenDaysLater : endOfMonth;
    
      return this.firestore.collection<Transaction>(`users/${userId}/transactions`, ref =>
          ref.where('type', '==', type)
             .where('recurrence', '!=', 'none')
             .where('nextDueDate', '>=', startDate)
             .where('nextDueDate', '<=', endDate)
             .orderBy('nextDueDate'))
      .snapshotChanges()
      .pipe(
          map(actions => actions.map(a => {
              const data = a.payload.doc.data() as Transaction;
              const id = a.payload.doc.id;
              return { id, ...data };
          })),
          map(transactions => transactions.filter(t =>
              t.nextDueDate && // Ensure nextDueDate exists
              new Date(t.nextDueDate.toDate()).getTime() >= startDate.getTime() &&
              new Date(t.nextDueDate.toDate()).getTime() <= endDate.getTime()))
      );
    }
    






    updateTransactionSubmission(transactionId: string, isSubmitted: boolean): Promise<void> {
      let userId: string;

      return this.afAuth.authState.pipe(
        take(1),
        switchMap(user => {
          if (!user) {
            throw new Error('No authenticated user available');
          }
          userId = user.uid;
          return this.firestore.collection(`users/${userId}/transactions`).doc(transactionId).get().toPromise();
        }),
        switchMap(docSnapshot => {
          if (!docSnapshot || !docSnapshot.exists) {
            throw new Error(`No transaction found with ID ${transactionId}`);
          }

          const originalTransaction = docSnapshot.data() as Transaction;
          if (originalTransaction.isSubmitted && isSubmitted) {
            console.log('Transaction is already submitted.');
            const newTransaction: Transaction = { ...originalTransaction };
            const newDueDate = this.calculateNextDueDate(originalTransaction);
            if (!newDueDate) {
                throw new Error('Failed to calculate the next due date.');
            }
            newTransaction.nextDueDate = Timestamp.fromDate(newDueDate); // Set nextDueDate to the calculated value
            if (originalTransaction.nextDueDate) { // Check if nextDueDate is defined
                newTransaction.date = originalTransaction.nextDueDate; // Copy the original transaction's nextDueDate
            }
            return this.addTransaction(newTransaction) // Add new transaction with updated nextDueDate and original date
                .then(() => {
                    // Update original transaction recurrence to 'none'
                    return this.firestore.collection(`users/${userId}/transactions`).doc(transactionId).update({ recurrence: 'none' });
                });
        }



          const updateData: any = { isSubmitted };
          if (!originalTransaction.isSubmitted) {
            const newDueDate = this.calculateNextDueDate(originalTransaction);
            if (!newDueDate) {
              throw new Error('Failed to calculate the next due date.');
            }
            updateData.nextDueDate = Timestamp.fromDate(newDueDate); // Set nextDueDate to the calculated value
          }

          return this.firestore.collection(`users/${userId}/transactions`).doc(transactionId).update(updateData);
        }),
        tap(() => console.log('Transaction updated successfully')),
        catchError(error => {
          console.error('Failed to update transaction:', error);
          return Promise.reject(error);
        })
      ).toPromise();
    }



// Helper method to calculate the next due date based on the recurrence type
calculateNextDueDate(transaction: Transaction): Date | null {
  if (!transaction.nextDueDate) return null;
  let newDueDate = new Date(transaction.nextDueDate.toDate());

  switch (transaction.recurrence) {
      case 'weekly':
          newDueDate.setDate(newDueDate.getDate() + 7);
          break;
      case 'biweekly':
          newDueDate.setDate(newDueDate.getDate() + 14);
          break;
      case 'monthly':
          newDueDate.setMonth(newDueDate.getMonth() + 1);
          break;
      default:
          return null;
  }
  return newDueDate;
}

deleteTransaction(transactionId: string): Promise<void> {
  return this.afAuth.authState.pipe(
    take(1),
    switchMap(user => {
      if (!user) throw new Error('No authenticated user available');
      return this.firestore.collection(`users/${user.uid}/transactions`).doc(transactionId).delete();
    }),
    tap(() => console.log('Transaction deleted successfully')),
    catchError(error => {
      console.error('Error deleting transaction:', error);
      throw error;
    })
  ).toPromise();
}

endTransactionRecurrence(transactionId: string): Promise<void> {
  return this.afAuth.authState.pipe(
    take(1),
    switchMap(user => {
      if (!user) throw new Error('No authenticated user available');
      return this.firestore.collection(`users/${user.uid}/transactions`).doc(transactionId).update({
        recurrence: 'none'
      });
    }),
    tap(() => console.log('Recurrence ended successfully')),
    catchError(error => {
      console.error('Error ending recurrence:', error);
      throw error;
    })
  ).toPromise();
}

updateTransaction(transactionId: string, transaction: Partial<Transaction>): Promise<void> {
  return this.afAuth.authState.pipe(
    take(1),
    switchMap(user => {
      if (!user) {
        throw new Error('No authenticated user available');
      }
      return this.firestore.collection(`users/${user.uid}/transactions`).doc(transactionId).update(transaction);
    }),
    tap(() => console.log('Transaction updated successfully')),
    catchError(error => {
      console.error('Error updating transaction:', error);
      throw error;
    })
  ).toPromise();
}


getRecurringTotalsByTypeAndDateRange(type: string, userId: string, startDate: Date, endDate: Date): Observable<number> {
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  return this.firestore.collection<Transaction>(`users/${userId}/transactions`, ref =>
    ref.where('type', '==', type)
       .where('recurrence', '!=', 'none')
       .where('nextDueDate', '>=', startTimestamp)
       .where('nextDueDate', '<=', endTimestamp)
  )
  .valueChanges()
  .pipe(
    map(transactions => transactions.reduce((acc, transaction) => acc + transaction.amount, 0))
  );
}

}
