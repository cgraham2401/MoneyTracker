import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  email: string = '';
  password: string = '';

  constructor(private afAuth: AngularFireAuth, private router: Router) { }

  ngOnInit() {
  }

  async register() {
    const { email, password } = this;
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(email, password);
      console.log(result);
      // after registration, go to login page
      this.router.navigate(['/login']); 
    } catch (error) {
      console.error(error);
      // Handle errors here, such as displaying a notification
    }
  }
}
