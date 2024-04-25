import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { TransactionService } from '../../services/transaction.service';
import { AuthService } from '../../services/auth.service';
import { DateSelectionService } from '../../services/date-selection.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  incomeTotal!: Observable<number>;
  expenseTotal!: Observable<number>;
  netTotal!: Observable<number>;
  hasData: boolean = false;
  selectedDate: string = new Date().toISOString();  // This might be overridden by subscription
  displayedMonth: Date = new Date(this.selectedDate);
  showCalendar: boolean = false;  // State for calendar modal
  private subscriptions = new Subscription();  // Manage subscriptions

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService,
    private dateSelectionService: DateSelectionService,
  ) {}

  ngOnInit() {
    // Subscribe to the selected date from DateSelectionService
    this.subscriptions.add(this.dateSelectionService.selectedDate$.subscribe(date => {
      this.selectedDate = date;
      this.displayedMonth = new Date(date);
      this.loadTotals();  // Reload data whenever the selected date changes
    }));

    this.loadTotals();  // Initial load
  }

  loadTotals() {
    this.authService.currentUserId$.subscribe(userId => {
      if (userId) {
        this.fetchTotalsForCurrentMonth(userId, new Date(this.selectedDate));
        this.hasData = true;  // Assuming data will load correctly
      } else {
        console.error('User ID not available, user might not be logged in');
        this.hasData = false;
      }
    });
  }

  fetchTotalsForCurrentMonth(userId: string, date: Date) {
    this.incomeTotal = this.transactionService.getTotalByTypeAndDate('income', userId, date);
    this.expenseTotal = this.transactionService.getTotalByTypeAndDate('expense', userId, date);
    this.netTotal = combineLatest([this.incomeTotal, this.expenseTotal]).pipe(
      map(([income, expense]) => income - expense)
    );
  }

  handleDateChange(event: any) {
    const newDate: string = event.detail.value;
    this.selectedDate = newDate; // Update local state if needed
    this.dateSelectionService.setSelectedDate(newDate); // Update shared state
    this.displayedMonth = new Date(newDate); // Update displayed month
    this.loadTotals(); // Reload totals based on new date
  }

  selectCurrentMonth() {
    this.dateSelectionService.selectCurrentMonth();
  }

  openCalendar() {
    this.showCalendar = true;
  }

  cancelCalendar() {
    this.showCalendar = false;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();  // Clean up subscriptions to prevent memory leaks
  }
}
