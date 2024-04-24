import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TransactionService } from '../../services/transaction.service';
import { AuthService } from '../../services/auth.service';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
})
export class TransactionsPage implements OnInit {
  transactions!: Observable<Transaction[]>;
  hasTransactions: boolean = false;

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUserId$.subscribe(userId => {
      if (userId) {
        this.loadTransactions(userId);
      } else {
        console.error('User ID not available, user might not be logged in');
      }
    });
  }

  loadTransactions(userId: string) {
    this.transactions = this.transactionService.getTransactionsByUserId(userId);
    this.transactions.pipe(
      map((txs: Transaction[]) => txs.length > 0)
    ).subscribe(hasData => {
      this.hasTransactions = hasData;
    });
  }
}
