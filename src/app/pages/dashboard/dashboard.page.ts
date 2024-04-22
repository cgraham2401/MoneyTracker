import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  incomeTotal!: Observable<number>;
  expenseTotal!: Observable<number>;
  netTotal!: Observable<number>;

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.fetchTotals();
  }

  fetchTotals() {
    this.incomeTotal = this.transactionService.getTotal('income');
    this.expenseTotal = this.transactionService.getTotal('expense');

    this.netTotal = combineLatest([this.incomeTotal, this.expenseTotal]).pipe(
      map(([income, expense]) => income - expense)
    );
  }
}
