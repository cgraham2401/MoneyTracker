export interface Transaction {
    amount: number;
    type: string; // 'income' or 'expense'
    date?: Date;  
    category?: string;
    description?: string;
  }
  