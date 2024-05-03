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
  submittedTransactions: Transaction[] = [];
  upcomingRecurringTransactions: Transaction[] = [];
  isDesktop: boolean = true;
  editMode = false;
  editingTransactionId: string | null = null;


  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private dateSelectionService: DateSelectionService,
    private firestore: AngularFirestore,
  ) {
    this.checkScreenSize();
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

  checkScreenSize() {
    this.isDesktop = window.innerWidth >= 768; 
  }

  loadTransactions() {
    this.authService.currentUserId$.subscribe(userId => {
        if (userId) {
            // Fetch submitted transactions
            this.transactions = this.transactionService.getTransactionsByTypeAndUserIdAndDate('expense', userId, new Date(this.selectedDate));
            this.transactions.subscribe(transactions => {
                console.log('Submitted Transactions:', transactions);
                this.hasTransactions = transactions.length > 0;
                this.submittedTransactions = transactions.filter(t => t.isSubmitted);

                // Fetch upcoming and overdue recurring transactions
                this.loadUpcomingRecurringTransactions(userId);
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

loadUpcomingRecurringTransactions(userId: string) {
  const selectedDate = new Date(this.selectedDate);  // Assumes this.selectedDate is already set to the desired month/year
  const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

  const currentDate = new Date();
  const sevenDaysLater = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const isCurrentMonth = currentDate.getMonth() === selectedDate.getMonth() && currentDate.getFullYear() === selectedDate.getFullYear();

  let effectiveEndDate = endOfMonth;
  if (isCurrentMonth) {
      effectiveEndDate = sevenDaysLater > endOfMonth ? sevenDaysLater : endOfMonth;
  }

  // Pass the additional parameters required by the service function
  this.transactionService.getRecurringTransactionsByTypeAndUserIdAndDate(
    'expense',
    userId,
    startDate,
    endOfMonth,  // Assumes that you want transactions up to the end of the selected month
    sevenDaysLater, // The date seven days from now, used for filtering within the next week
    isCurrentMonth  // Boolean indicating whether the selected month is the current month
  )
  .subscribe(transactions => {
      console.log('Upcoming Recurring Transactions:', transactions);
      this.upcomingRecurringTransactions = transactions.filter(t => {
          const nextDue = t.nextDueDate ? new Date(t.nextDueDate.toDate()) : null;
          return nextDue && nextDue >= startDate && nextDue <= effectiveEndDate;
      });
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

deleteTransaction(transactionId: string | undefined) {
  if (!transactionId) {
    console.error('Transaction ID is undefined, cannot delete');
    return;
  }

  // Add a confirmation dialog
  if (confirm('Are you sure you want to delete this transaction?')) {
    this.transactionService.deleteTransaction(transactionId).then(() => {
      console.log(`Transaction with ID ${transactionId} was deleted successfully.`);
      // Optionally refresh the list or handle the UI update
    }).catch(error => {
      console.error(`Failed to delete transaction with ID ${transactionId}:`, error);
    });
  } else {
    console.log('Transaction deletion cancelled.');
  }
}

endTransactionRecurrence(transactionId: string | undefined) {
  if (!transactionId) {
    console.error('Transaction ID is undefined, cannot modify');
    return;
  }

  // Add a confirmation dialog
  if (confirm('Are you sure you want to end the recurrence for this transaction?')) {
    this.transactionService.endTransactionRecurrence(transactionId).then(() => {
      console.log(`Recurrence for transaction ID ${transactionId} was ended successfully.`);
      // Optionally refresh the list or handle the UI update
    }).catch(error => {
      console.error(`Failed to end recurrence for transaction ID ${transactionId}:`, error);
    });
  } else {
    console.log('Action cancelled.');
  }
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

  initialFormValues = {
    date: '',
    amount: null as number | null,
    type: '',
    category: '',
    description: '',
    payee: '',
    recurrence: 'none',
    nextDueDate: null
  };

  formValues = {
    date: new Date().toISOString(),
    recurrence: 'none',
    nextDueDate: null as string | null, // Allow both string and null types
    amount: null as number| null,
    type: '',
    category: '',
    description: '',
    payee: ''
};


  updateNextDueDate() {
    if (this.formValues.recurrence !== 'none' && this.formValues.date) {
        let baseDate = new Date(this.formValues.date);
        switch (this.formValues.recurrence) {
            case 'weekly':
                baseDate.setDate(baseDate.getDate() + 7);
                break;
            case 'biweekly':
                baseDate.setDate(baseDate.getDate() + 14);
                break;
            case 'monthly':
                baseDate.setMonth(baseDate.getMonth() + 1);
                break;
        }
        this.formValues.nextDueDate = baseDate.toISOString();
    } else {
        this.formValues.nextDueDate = null; // Clear next due date if recurrence is none
    }
}

updateDueDateFromPicker(event: any) {
  this.formValues.nextDueDate = event.detail.value ?? null;
}

editTransaction(transaction: Transaction) {
  this.editMode = true;
  this.editingTransactionId = transaction.id || null; 
  this.formValues = {
      date: transaction.date.toDate().toISOString(),
      amount: transaction.amount,  
      type: transaction.type,
      category: transaction.category,
      description: transaction.description || '',
      payee: transaction.payee,
      recurrence: transaction.recurrence || 'none',
      nextDueDate: transaction.nextDueDate ? transaction.nextDueDate.toDate().toISOString() : null
  };
  this.showAddForm = true;
}


addTransaction(formValues: any) {
  let transaction: Transaction = {
    amount: formValues.amount,
    type: 'expense',
    date: Timestamp.fromDate(new Date(formValues.date)),
    category: formValues.category,
    description: formValues.description || '',
    payee: formValues.payee,
    recurrence: formValues.recurrence,
    nextDueDate: formValues.nextDueDate ? Timestamp.fromDate(new Date(formValues.nextDueDate)) : Timestamp.now(),
    isSubmitted: true,
    isOverdue: false
  };

  if (this.editMode && this.editingTransactionId) {
    this.transactionService.updateTransaction(this.editingTransactionId, transaction).then(() => {
      console.log('Transaction updated successfully!');
      this.resetForm();
    }).catch((error: any) => {
      console.error('Error updating transaction:', error);
    });
  } else {
    this.transactionService.addTransaction(transaction).then(() => {
      console.log('Transaction added successfully!');
      this.resetForm();
    }).catch((error: any) => {
      console.error('Error adding transaction:', error);
    });
  }
}

resetForm() {
  this.showAddForm = false;
  this.editMode = false;
  this.editingTransactionId = null;
  this.formValues = { ...this.initialFormValues }; // Ensure to spread a copy of the initial values
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
