import { Timestamp } from 'firebase/firestore';

export interface Transaction {
    amount: number;
    type: 'income' | 'expense';
    payee?:string
    date?: Timestamp; 
    category?: string;
    description?: string;
  }
  