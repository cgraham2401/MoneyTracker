import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { DateSelectionService } from '../../services/date-selection.service';
import { Transaction } from '../../models/transaction.model';

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

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private dateSelectionService: DateSelectionService
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.authService.currentUserId$.subscribe(userId => {
        if (userId) {
          this.subscriptions.add(
            this.dateSelectionService.selectedDate$.subscribe(date => {
              this.selectedDate = date;
              this.displayedMonth = new Date(date); // Update displayed date
              this.loadTransactions(userId, new Date(date));
            })
          );
        }
      })
    );
  }

  loadTransactions(userId: string, date: Date) {
    this.transactions = this.transactionService.getTransactionsByUserIdAndDate(userId, date);
    this.transactions.subscribe(transactions => {
      this.hasTransactions = transactions.length > 0;
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
  }
}
