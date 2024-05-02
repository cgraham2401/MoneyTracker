import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'  // Ensures a single instance is used app-wide
})
export class DateSelectionService {
  private selectedDateSubject = new BehaviorSubject<string>(new Date().toISOString());
  selectedDate$ = this.selectedDateSubject.asObservable();

  constructor() {}

  setSelectedDate(date: string) {
    this.selectedDateSubject.next(date);
  }

  selectCurrentMonth() {
    const currentDate = new Date();
    this.setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString());
  }

  // selectLastThreeMonths() {
  //   const currentDate = new Date();
  //   const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
  //   this.setSelectedDate(threeMonthsAgo.toISOString());
  // }
}
