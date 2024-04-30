import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { DateSelectionService } from '../../services/date-selection.service';
import { Transaction } from '../../models/transaction.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Timestamp } from 'firebase/firestore';


interface Category {
  name: string;
  type: string;
}

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
})
export class TransactionsPage implements OnInit, OnDestroy {
  transactions!: Observable<Transaction[]>;
  hasTransactions: boolean = false;
  showCalendar: boolean = false; // State for calendar modal
  selectedDate: string = new Date().toISOString();
  displayedMonth: Date = new Date(this.selectedDate); 
  private subscriptions: Subscription = new Subscription();
  submittedTransactions: Transaction[] = [];
  upcomingRecurringTransactions: Transaction[] = [];
  currentUserID: string | null = null;
  showAddForm: boolean = false; 
  categories: Category[] = [];
  private destroy$: Subject<void> = new Subject<void>();
  
  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private dateSelectionService: DateSelectionService,
    private firestore: AngularFirestore
  ) {}

  ngOnInit() {
    this.fetchCategories();
    this.authService.currentUserId$.subscribe(userId => {
      this.currentUserID = userId;
      if (userId) {
        this.loadTransactions(userId, new Date(this.selectedDate));
      }
    }, error => console.error('Error fetching user ID:', error));

    this.dateSelectionService.selectedDate$.subscribe(date => {
      this.selectedDate = date;
      this.displayedMonth = new Date(date);
      if (this.currentUserID) {
        this.loadTransactions(this.currentUserID, new Date(date));
      }
    }, error => console.error('Error with date selection:', error));
  }

  fetchCategories() {
    this.firestore.collection<Category>('categories', ref => ref.where('type', '==', 'income'))  //need to set to all types
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

  loadTransactions(userId: string, date: Date) {
    this.transactionService.getTransactionsByUserIdAndDate(userId, date)
      .subscribe(transactions => {
        this.submittedTransactions = transactions.filter(t => t.isSubmitted);
        this.upcomingRecurringTransactions = transactions.filter(t => t.recurrence !== 'none' && t.nextDueDate && // Ensure nextDueDate is defined
        (
            new Date(t.nextDueDate.toDate()).getTime() <= new Date().getTime() + 7 * 24 * 60 * 60 * 1000 // Upcoming or overdue within the next 7 days
        ),
        this.hasTransactions = transactions.length > 0);
      }, error => {
        console.error('Error loading transactions:', error);
        this.hasTransactions = false;
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

  addTransaction(formValues: any) {
    const transaction: Transaction = {
        amount: formValues.amount,
        type: formValues.type,
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
    this.updateDate();
  }

  selectLastThreeMonths() {
    this.dateSelectionService.selectLastThreeMonths();
    this.updateDate();
  }

  openCalendar() {
    this.showCalendar = true;
  }

  cancelCalendar() {
    this.showCalendar = false;
    this.updateDate();
  }

  updateDate() {
    this.dateSelectionService.setSelectedDate(this.selectedDate);
    this.displayedMonth = new Date(this.selectedDate);
    this.authService.currentUserId$.subscribe(userId => {
      if (userId) {
        this.loadTransactions(userId, new Date(this.selectedDate));
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
