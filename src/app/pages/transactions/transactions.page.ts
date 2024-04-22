import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TransactionService } from '../../services/transaction.service'; 
import { Transaction } from '../../models/transaction.model'; 

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
})
export class TransactionsPage implements OnInit {
  transactions!: Observable<Transaction[]>;
  hasTransactions: boolean = false;  // Flag to track if transactions are available

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    const userId = 'yourUserId'; // Dynamically set from auth service
    this.transactions = this.transactionService.getTransactionsByUserId(userId);
    this.transactions.pipe(
      map(txs => txs.length > 0)
    ).subscribe(hasData => {
      this.hasTransactions = hasData;
    });
  }
}
