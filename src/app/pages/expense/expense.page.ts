import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';
import { DateSelectionService } from '../../services/date-selection.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Timestamp } from 'firebase/firestore';
import { takeUntil } from 'rxjs/operators';

interface Category {
  name: string;
  type: string;
}

@Component({
  selector: 'app-expense',
  templateUrl: './expense.page.html',
  styleUrls: ['./expense.page.scss'],
})
export class ExpensePage implements OnInit, OnDestroy {
  transactions!: Observable<Transaction[]>;
  private destroy$ = new Subject<void>();
  categories: Category[] = [];
  showAddForm = false;
  selectedDate: string = new Date().toISOString();
  displayedMonth: Date = new Date(this.selectedDate);
  showCalendar: boolean = false;
  private subscriptions = new Subscription();
  hasTransactions: boolean = false;

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private dateSelectionService: DateSelectionService,
    private firestore: AngularFirestore,
  ) {}

  ngOnInit() {
    this.fetchCategories(); // Ensure categories are fetched at component initialization
    this.subscriptions.add(this.dateSelectionService.selectedDate$.subscribe(date => {
      this.selectedDate = date;
      this.displayedMonth = new Date(date);
      this.loadTransactions();
    }));
    this.loadTransactions(); // Load initially
  }

  loadTransactions() {
    this.authService.currentUserId$.subscribe(userId => {
      if (userId) {
        this.transactions = this.transactionService.getTransactionsByTypeAndUserIdAndDate('expense', userId, new Date(this.selectedDate));
        this.transactions.subscribe(list => {
          this.hasTransactions = list && list.length > 0;
        });
      } else {
        console.error('User ID not available, user might not be logged in');
        this.transactions = of([]); 
        this.hasTransactions = false;
      }
    });
  }

  fetchCategories() {
    this.firestore.collection<Category>('categories', ref => ref.where('type', '==', 'expense'))
      .valueChanges({ idField: 'id' }) // Corrected method name
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (categories: Category[]) => { // Added explicit type
          console.log('Fetched expense categories:', categories);
          this.categories = categories;
        },
        (error: any) => { // Added explicit type
          console.error('Error fetching expense categories:', error);
        }
      );
  }

  addTransaction(formValues: any) {
    const transaction: Transaction = {
      amount: formValues.amount,
      type: 'expense',
      date: Timestamp.fromDate(new Date(formValues.date)),
      category: formValues.category,
      description: formValues.description || '',
      payee: formValues.payee,
    };
    console.log('Attempting to add expense transaction:', transaction);
    this.transactionService.addTransaction(transaction).then(() => {
      console.log('Expense Transaction added successfully!');
      this.showAddForm = false; // Hide the form upon successful addition
    }).catch((error: any) => {
      console.error('Error adding expense transaction:', error);
    });
  }

  selectCurrentMonth() {
    this.dateSelectionService.selectCurrentMonth();
    this.loadTransactions();
  }

  openCalendar() {
    this.showCalendar = true;
  }

  cancelCalendar() {
    this.showCalendar = false;
  }

  handleDateChange(event: any) {
    const newDate: string = event.detail.value;
    this.dateSelectionService.setSelectedDate(newDate);
    this.displayedMonth = new Date(newDate);
    this.loadTransactions();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
