import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface LoginForm {
  userId: string;
  password: string;
}
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  showPassword = false;

  form: LoginForm = {
    userId: '',
    password: ''
  };

  onLogin(): void {
    if (!this.form.userId || !this.form.password) {
      alert('Please enter User ID and Password.');
      return;
    }

    console.log('Login Data:', this.form);

    // Later flow:
    // 1. Call backend login API
    // 2. Check active device count
    // 3. If device count > 3, redirect to device-limit page
    // 4. Else redirect based on role/profile

    alert('Login successful.');
  }
}