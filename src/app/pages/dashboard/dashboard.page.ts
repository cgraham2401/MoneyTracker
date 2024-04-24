import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TransactionService } from '../../services/transaction.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  incomeTotal!: Observable<number>;
  expenseTotal!: Observable<number>;
  netTotal!: Observable<number>;
  hasData = false;

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUserId$.subscribe(userId => {
      console.log('Dashboard User ID:', userId);
      if (userId) {
        this.fetchTotals(userId);
      } else {
        console.error('User ID not available, user might not be logged in');
        this.hasData = false;
      }
    });
  }
  
  fetchTotals(userId: string) {
    this.incomeTotal = this.transactionService.getTotalByUserId('income', userId);
    this.expenseTotal = this.transactionService.getTotalByUserId('expense', userId);
  
    this.netTotal = combineLatest([this.incomeTotal, this.expenseTotal]).pipe(
      tap(([income, expense]) => console.log(`Income: ${income}, Expense: ${expense}`)),
      map(([income, expense]) => {
        const hasIncomeOrExpense = income > 0 || expense > 0;
        this.hasData = hasIncomeOrExpense;
        console.log(`Net Total Computed: ${income - expense}`);
        return income - expense;
      })
    );
  
    // Subscribe to netTotal to trigger the observables and log final value
    this.netTotal.subscribe(net => {
      console.log(`Net Total: ${net}`);
    }, error => {
      console.error('Error computing net total:', error);
    });
  }
}
