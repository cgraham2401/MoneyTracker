import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthService } from '../../services/auth.service';
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

  constructor(private afAuth: AngularFireAuth, private router: Router, private authService: AuthService) { }

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

  forgotPassword() {
    const email = prompt('Please enter your email address to receive a password reset link.');
    if (email && this.validateEmail(email)) {
      this.afAuth.sendPasswordResetEmail(email).then(() => {
        alert('If an account exists for that email, a password reset link will be sent to your email.');
      }).catch((error) => {
        console.error('Failed to send password reset email:', error);
        alert('Failed to send password reset email.');
      });
    } else {
      alert('Please enter a valid email address.');
    }
}

validateEmail(email: string): boolean {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
}
  

}
