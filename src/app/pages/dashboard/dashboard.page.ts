import { Component, OnInit, ChangeDetectorRef  } from '@angular/core';
import { Observable, combineLatest, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { TransactionService } from '../../services/transaction.service';
import { AuthService } from '../../services/auth.service';
import { DateSelectionService } from '../../services/date-selection.service';
import { DatePipe } from '@angular/common';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  providers: [DatePipe]
})
export class DashboardPage implements OnInit {
  incomeTotal!: Observable<number>;
  expenseTotal!: Observable<number>;
  netTotal!: Observable<number>;
  hasData: boolean = false;
  selectedDate: string = new Date().toISOString();
  displayedMonth: Date = new Date(this.selectedDate);
  isCurrentMonth: boolean = true;
  showCalendar: boolean = false;
  private subscriptions = new Subscription();
  projectedIncome!: Observable<number>;
  projectedExpense!: Observable<number>;
  projectedNetTotal!: Observable<number>;
  pendingRecurringIncome!: Observable<number>;
  pendingRecurringExpense!: Observable<number>;
  cumulativeBalance: number = 0;
  toggleCumulative: boolean = false;
  currentUserID: string | null = null;

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService,
    private dateSelectionService: DateSelectionService,
    private datePipe: DatePipe,
    private settingsService: SettingsService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.authService.currentUserId$.subscribe(userId => {
      this.currentUserID = userId;
      this.loadInitialData();
    });

    this.subscriptions.add(this.settingsService.cumulativeViewEnabled$.subscribe(toggle => {
      this.toggleCumulative = toggle;
      this.loadInitialData();
    }));

    this.subscriptions.add(this.dateSelectionService.selectedDate$.subscribe(date => {
      this.selectedDate = date;
      this.displayedMonth = new Date(date);
      this.isCurrentMonth = this.checkIfCurrentMonth(date);
      this.loadInitialData();
    }));
  }

  loadInitialData() {
    if (this.currentUserID) {
        this.loadTotals();
        if (this.toggleCumulative) {
            this.loadCumulativeBalance(this.currentUserID, new Date(this.selectedDate));
        }
    } else {
        console.error('User ID not available');
        this.hasData = false;
    }
}


  checkIfCurrentMonth(date: string): boolean {
    const currentDate = this.datePipe.transform(new Date(), 'MM-yyyy');
    const selectedMonth = this.datePipe.transform(new Date(date), 'MM-yyyy');
    return currentDate === selectedMonth;
  }

  loadCumulativeBalance(userId: string, date: Date) {
    this.transactionService.getTransactionsUpToDate(userId, date)
      .subscribe(transactions => {
        this.cumulativeBalance = transactions.reduce((acc, cur) => cur.type === 'income' ? acc + cur.amount : acc - cur.amount, 0);
        this.hasData = true;
        this.changeDetectorRef.detectChanges(); // Force update of the view
      });
}

  loadTotals() {
    if (this.currentUserID) {
      this.fetchTotalsForMonth(this.currentUserID, new Date(this.selectedDate));
      if (this.isCurrentMonth) {
        this.fetchProjectedTotalsForCurrentMonth(this.currentUserID, new Date(this.selectedDate));
      }
      this.hasData = true;
    } else {
      this.hasData = false;
    }
  }

  fetchTotalsForMonth(userId: string, date: Date) {
    this.incomeTotal = this.transactionService.getTotalByTypeAndDate('income', userId, date);
    this.expenseTotal = this.transactionService.getTotalByTypeAndDate('expense', userId, date);
    this.netTotal = combineLatest([this.incomeTotal, this.expenseTotal]).pipe(
      map(([income, expense]) => income - expense)
    );
  }

  fetchProjectedTotalsForCurrentMonth(userId: string, date: Date) {
    let startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    let endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.pendingRecurringIncome = this.transactionService.getRecurringTotalsByTypeAndDateRange('income', userId, startOfMonth, endOfMonth);
    this.pendingRecurringExpense = this.transactionService.getRecurringTotalsByTypeAndDateRange('expense', userId, startOfMonth, endOfMonth);
    this.projectedIncome = combineLatest([this.incomeTotal, this.pendingRecurringIncome]).pipe(
      map(([currentIncome, additionalIncome]) => currentIncome + additionalIncome)
    );
    this.projectedExpense = combineLatest([this.expenseTotal, this.pendingRecurringExpense]).pipe(
      map(([currentExpense, additionalExpense]) => currentExpense + additionalExpense)
    );
    this.projectedNetTotal = combineLatest([this.projectedIncome, this.projectedExpense]).pipe(
      map(([projIncome, projExpense]) => projIncome - projExpense)
    );
  }

  handleDateChange(event: any) {
    const newDate: string = event.detail.value;
    this.selectedDate = newDate;
    this.displayedMonth = new Date(newDate);
    this.isCurrentMonth = this.checkIfCurrentMonth(newDate);
    this.subscriptions.unsubscribe
    this.loadInitialData();
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
    this.subscriptions.unsubscribe();
  }
}
