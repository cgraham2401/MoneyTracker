import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Category {
  name: string;
  type: string;
}

@Component({
  selector: 'app-income',
  templateUrl: './income.page.html',
  styleUrls: ['./income.page.scss'],
})
export class IncomePage implements OnInit {
  private destroy$ = new Subject<void>();
  categories: Category[] = []; 
  transactions!: Observable<Transaction[]>; 
  showAddForm = false; 

  constructor(
    private transactionService: TransactionService,
    private firestore: AngularFirestore 
  ) {}

  ngOnInit() {
    this.loadTransactions();
    this.fetchCategories(); 
  }
  loadTransactions() {
    // Load transactions of type 'income'
    this.transactions = this.transactionService.getTransactionsByType('income');
  }

  fetchCategories() {
    
    this.firestore.collection<Category>('categories', ref => ref.where('type', '==', 'income'))
      .valueChanges({ idField: 'id' })
      .subscribe(categories => {
        console.log('Fetched income categories:', categories);
        this.categories = categories;
      }, error => {
        console.error('Error fetching categories:', error);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addTransaction(formValues: any) {
    // Create a transaction object from form values
    const transaction: Transaction = {
      amount: formValues.amount,
      type: 'income',
      date: Timestamp.fromDate(new Date(formValues.date)),
      category: formValues.category,
      description: formValues.description
    };
    
    // Call service to add transaction to Firestore
    this.transactionService.addTransaction(transaction).then(() => {
      console.log('Transaction added successfully!');
      this.showAddForm = false; // Hide the form upon successful addition
      
    }).catch(error => {
      console.error('Error adding transaction:', error);
    });
  }
}
