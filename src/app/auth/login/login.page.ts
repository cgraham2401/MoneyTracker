import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private afAuth: AngularFireAuth, private router: Router) { }

  ngOnInit() {
  }

  async login() {
    const { email, password } = this;
    try {
      const result = await this.afAuth.signInWithEmailAndPassword(email, password);
      console.log(result);
      // go to dashboard after successful login
      this.router.navigate(['/dashboard']); 
    } catch (error) {
      console.error(error);
      this.errorMessage = "Invalid email/password. Please try again.";
    }
  }
}
