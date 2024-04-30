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
  selector: 'app-income',
  templateUrl: './income.page.html',
  styleUrls: ['./income.page.scss'],
})
export class IncomePage implements OnInit, OnDestroy {
  transactions!: Observable<Transaction[]>;
  private destroy$ = new Subject<void>();
  categories: Category[] = [];
  showAddForm = false;
  selectedDate: string = new Date().toISOString();
  displayedMonth: Date = new Date(this.selectedDate);
  showCalendar: boolean = false;
  private subscriptions = new Subscription();
  hasTransactions: boolean = false;
  submittedTransactions: Transaction[] = [];
  upcomingRecurringTransactions: Transaction[] = [];
  currentUserID: string | null = null;


  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private dateSelectionService: DateSelectionService,
    private firestore: AngularFirestore,
  ) {
    this.authService.currentUserId$.subscribe(userId => {
      this.currentUserID = userId;
    });
  }

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
            this.transactions = this.transactionService.getTransactionsByTypeAndUserIdAndDate('income', userId, new Date(this.selectedDate));
            this.transactions.subscribe(transactions => {
                console.log('Transactions:', transactions); // Inserted line
                this.hasTransactions = transactions.length > 0;

                // Filter for submitted transactions
                this.submittedTransactions = transactions.filter(t => t.isSubmitted);

                // Filter for upcoming and overdue recurring transactions
                this.upcomingRecurringTransactions = transactions.filter(t =>
                    t.recurrence !== 'none' &&
                    t.nextDueDate && // Ensure nextDueDate is defined
                    (
                        new Date(t.nextDueDate.toDate()).getTime() <= new Date().getTime() + 7 * 24 * 60 * 60 * 1000 // Upcoming or overdue within the next 7 days
                    )
                );
            });
        } else {
            console.error('User ID not available, user might not be logged in');
            this.transactions = of([]);
            this.hasTransactions = false;
            this.submittedTransactions = [];
            this.upcomingRecurringTransactions = [];
        }
    });
}


logTransactionIdAndResubmit(transactionId: string | undefined) {
  this.authService.currentUserId$.subscribe(userId => {
    if (userId) {
      console.log('User attempting to resubmit:', userId);
      console.log('Transaction ID:', transactionId);
      this.resubmitTransaction(transactionId);
    } else {
      console.error('User ID not available, unable to resubmit transaction');
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
        date: Timestamp.fromDate(new Date(formValues.date)), // Original transaction date
        category: formValues.category,
        description: formValues.description || '',
        payee: formValues.payee,
        recurrence: formValues.recurrence, // Capturing the recurrence from the form
        nextDueDate: formValues.recurrence !== 'none' && formValues.nextDueDate 
                     ? Timestamp.fromDate(new Date(formValues.nextDueDate)) 
                     : Timestamp.now(), // Use current timestamp if nextDueDate is not provided
        isSubmitted: true, // Assuming the transaction is submitted when added
        isOverdue: false // Defaulting to false upon creation
    };

    console.log('Attempting to add income transaction:', transaction);
    this.transactionService.addTransaction(transaction).then(() => {
        console.log('Income Transaction added successfully!');
        this.showAddForm = false; // Hide the form upon successful addition
    }).catch((error: any) => {
        console.error('Error adding income transaction:', error);
    });
}

resubmitTransaction(transactionId: string | undefined) {
  console.log('Trying to resubmit transaction with ID:', transactionId);
  if (!transactionId) {
    console.error('Transaction ID is undefined, cannot resubmit');
    return;
  }

  this.transactionService.updateTransactionSubmission(transactionId, true)
    .then(() => {
      console.log(`Transaction with ID ${transactionId} was resubmitted successfully.`);
    })
    .catch(error => {
      console.error(`Failed to resubmit transaction with ID ${transactionId}:`, error);
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
