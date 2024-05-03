import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  email: string = '';
  password: string = '';
  passwordError: string | null = null;

  constructor(private afAuth: AngularFireAuth, private firestore: AngularFirestore, private router: Router) { }

  ngOnInit() {
  }

  async register() {
    if (!this.validatePassword(this.password)) {
      return;
    }

    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      console.log(result);

      await this.firestore.collection('users').doc(result.user!.uid).set({
        email: result.user!.email,
        createdAt: new Date()
      });

      this.router.navigate(['/login']); // Redirect to login after registration
  } catch (error) {
    console.error('Registration error:', error);
    // Check if error is an instance of Error and has a message
    if (error instanceof Error) {
      this.passwordError = error.message;
    } else {
      this.passwordError = 'An unexpected error occurred';
    }
  }
}

  validatePassword(password: string): boolean {
    const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/; // Regex for password criteria
    const isValid = re.test(password);
    this.passwordError = isValid ? null : 'Password does not meet the required criteria.';
    return isValid;
  }
}
