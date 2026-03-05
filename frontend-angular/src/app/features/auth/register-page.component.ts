import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../core/models/user.model';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <section class="auth-shell">
      <mat-card class="auth-card fade-in">
        <header class="auth-header">
          <p class="eyebrow">Onboarding</p>
          <h1>Create Account</h1>
          <p>Register to submit and manage insurance claims.</p>
        </header>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form grid">
          <mat-form-field appearance="outline">
            <mat-label>Username</mat-label>
            <input matInput formControlName="username" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Role</mat-label>
            <mat-select formControlName="role">
              <mat-option value="ROLE_POLICYHOLDER">Policyholder</mat-option>
              <mat-option value="ROLE_ADJUSTER">Adjuster</mat-option>
              <mat-option value="ROLE_MANAGER">Manager</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-flat-button color="primary" class="full-span" [disabled]="form.invalid || isSubmitting">
            <span *ngIf="!isSubmitting">Create Account</span>
            <span class="btn-loading" *ngIf="isSubmitting">
              <mat-spinner diameter="18"></mat-spinner>
              Creating
            </span>
          </button>
        </form>

        <footer class="auth-footer">
          <span>Already registered?</span>
          <a routerLink="/login">Sign in</a>
        </footer>
      </mat-card>
    </section>
  `,
  styles: [`
    .auth-shell {
      min-height: calc(100vh - 10rem);
      display: grid;
      place-items: center;
      padding: 1rem;
    }

    .auth-card {
      width: min(100%, 48rem);
      border-radius: 1.2rem;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    .auth-header {
      padding: 2rem 2rem 1rem;
      background: linear-gradient(140deg, #f2f8ff 0%, #edf8f5 100%);
      border-bottom: 1px solid var(--border-color);
    }

    .eyebrow {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.75rem;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      font-weight: 600;
    }

    h1 {
      margin: 0.4rem 0;
      font-size: 1.7rem;
      color: #10324b;
    }

    .auth-header p {
      margin: 0;
      color: var(--text-secondary);
    }

    .auth-form {
      padding: 1.5rem 2rem;
      display: grid;
      gap: 0.8rem;
    }

    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .full-span {
      grid-column: 1 / -1;
      min-height: 2.8rem;
      border-radius: 0.7rem;
    }

    .btn-loading {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
    }

    .auth-footer {
      padding: 0 2rem 2rem;
      display: flex;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.93rem;
    }

    .auth-footer a {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RegisterPageComponent implements OnInit {
  isSubmitting = false;

  readonly form = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['ROLE_POLICYHOLDER' as RegisterRequest['role'], Validators.required]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    const payload: RegisterRequest = {
      username: this.form.controls.username.value ?? '',
      email: this.form.controls.email.value ?? '',
      firstName: this.form.controls.firstName.value ?? '',
      lastName: this.form.controls.lastName.value ?? '',
      password: this.form.controls.password.value ?? '',
      role: this.form.controls.role.value ?? 'ROLE_POLICYHOLDER'
    };

    this.isSubmitting = true;
    this.authService.register(payload)
      .pipe(finalize(() => { this.isSubmitting = false; }))
      .subscribe(() => {
        this.router.navigate(['/dashboard']);
      });
  }
}
