import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { TransactionService } from '../../services/transaction.service'; 
import { Transaction } from '../../models/transaction.model'; 

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
})
export class TransactionsPage implements OnInit {
  transactions!: Observable<Transaction[]>;

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    const userId = 'yourUserId'; // dynamically set from auth service
    this.transactions = this.transactionService.getTransactionsByUserId(userId);
  }
}