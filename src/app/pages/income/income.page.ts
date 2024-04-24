import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Timestamp } from 'firebase/firestore';

interface Category {
  name: string;
  type: string;
}

@Component({
  selector: 'app-income',
  templateUrl: './income.page.html',
  styleUrls: ['./income.page.scss'],
})
export class IncomePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  transactions!: Observable<Transaction[]>;
  categories: Category[] = [];
  showAddForm = false;

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private firestore: AngularFirestore
  ) {}

  ngOnInit() {
    this.authService.currentUserId$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(userId => {
      if (userId) {
        this.transactions = this.transactionService.getTransactionsByTypeAndUserId('income', userId);
        this.fetchCategories(); // Fetch categories when we know the user is logged in
      } else {
        console.error('User ID not available, user might not be logged in');
      }
    });
  }

  fetchCategories() {
    this.firestore.collection<Category>('categories', ref => ref.where('type', '==', 'income'))
      .valueChanges({ idField: 'id' }) // Corrected method name
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (categories: Category[]) => { // Added explicit type
          console.log('Fetched income categories:', categories);
          this.categories = categories;
        },
        (error: any) => { // Added explicit type
          console.error('Error fetching income categories:', error);
        }
      );
  }

  addTransaction(formValues: any) {
    const transaction: Transaction = {
      amount: formValues.amount,
      type: 'income',
      date: Timestamp.fromDate(new Date(formValues.date)),
      category: formValues.category,
      description: formValues.description
    };
    console.log('Attempting to add income transaction:', transaction);
    this.transactionService.addTransaction(transaction).then(() => {
      console.log('Income Transaction added successfully!');
      this.showAddForm = false; // Hide the form upon successful addition
    }).catch((error: any) => {
      console.error('Error adding Income transaction:', error);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
