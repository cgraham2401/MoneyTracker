import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { TransactionService } from '../../services/transaction.service'; 
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-expense',
  templateUrl: './expense.page.html',
  styleUrls: ['./expense.page.scss'],
})
export class ExpensePage implements OnInit {

  transactions!: Observable<Transaction[]>;
  showAddForm = false;
  constructor(private transactionService: TransactionService) { }

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    
    this.transactions = this.transactionService.getTransactionsByType('expense');
  }

  addTransaction(formValues: any) {
    const transaction: Transaction = {
      amount: formValues.amount,
      type: 'expense',
      date: Timestamp.fromDate(new Date(formValues.date)), // Correctly use Timestamp
      category: formValues.category,
      description: formValues.description
    };
  
    // Add transaction to Firestore
    this.transactionService.addTransaction(transaction).then(() => {
      console.log('Transaction added successfully!');
    }).catch(error => {
      console.error('Error adding transaction:', error);
    });
  }
}
