import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
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
    MatProgressSpinnerModule
  ],
  template: `
    <section class="auth-shell">
      <mat-card class="auth-card fade-in">
        <header class="auth-header">
          <p class="eyebrow">Secure Access</p>
          <h1>Sign In</h1>
          <p>Use your ClaimSwift account to continue.</p>
        </header>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
          <mat-form-field appearance="outline">
            <mat-label>Username or Email</mat-label>
            <input matInput formControlName="usernameOrEmail" />
            <mat-icon matSuffix>person</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" />
            <mat-icon matSuffix>lock</mat-icon>
          </mat-form-field>

          <button mat-flat-button color="primary" [disabled]="loginForm.invalid || isSubmitting">
            <span *ngIf="!isSubmitting">Login</span>
            <span class="btn-loading" *ngIf="isSubmitting">
              <mat-spinner diameter="18"></mat-spinner>
              Signing in
            </span>
          </button>
        </form>

        <footer class="auth-footer">
          <span>New to ClaimSwift?</span>
          <a routerLink="/register">Create account</a>
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
      width: min(100%, 32rem);
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

    .auth-form button {
      margin-top: 0.3rem;
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
  `]
})
export class LoginPageComponent implements OnInit {
  isSubmitting = false;

  readonly loginForm = this.fb.group({
    usernameOrEmail: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      return;
    }

    const payload = {
      usernameOrEmail: this.loginForm.controls.usernameOrEmail.value ?? '',
      password: this.loginForm.controls.password.value ?? ''
    };

    this.isSubmitting = true;
    this.authService.login(payload)
      .pipe(finalize(() => { this.isSubmitting = false; }))
      .subscribe(() => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
        this.router.navigateByUrl(returnUrl);
      });
  }
}
