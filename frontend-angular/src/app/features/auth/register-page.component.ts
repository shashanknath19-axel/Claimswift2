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
    MatProgressSpinnerModule
  ],
  template: `
    <section class="auth-shell">
      <div class="auth-grid fade-in">
        <aside class="auth-brand-pane">
          <span class="auth-brand-badge">
            <mat-icon>auto_awesome</mat-icon>
            Onboarding
          </span>
          <h2>Start your claim journey</h2>
          <p>Create your policyholder account to file claims, upload documents, and track decisions end-to-end.</p>
          <ul class="auth-feature-list">
            <li>Instant claim submission</li>
            <li>PDF document tracking</li>
            <li>Transparent status timeline</li>
          </ul>
        </aside>

        <mat-card class="auth-form-pane border-0 rounded-0 shadow-none">
          <header class="auth-header">
            <p class="eyebrow">Onboarding</p>
            <h1>Create Account</h1>
            <p>Public signup creates a Policyholder account only.</p>
          </header>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form row g-2">
            <div class="col-12 col-md-6">
              <mat-form-field appearance="outline">
                <mat-label>Username</mat-label>
                <input matInput formControlName="username" autocomplete="username" />
                <mat-icon matSuffix>person</mat-icon>
              </mat-form-field>
            </div>

            <div class="col-12 col-md-6">
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" autocomplete="email" />
                <mat-icon matSuffix>mail</mat-icon>
              </mat-form-field>
            </div>

            <div class="col-12 col-md-6">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" autocomplete="given-name" />
              </mat-form-field>
            </div>

            <div class="col-12 col-md-6">
              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" autocomplete="family-name" />
              </mat-form-field>
            </div>

            <div class="col-12 col-md-6">
              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput type="password" formControlName="password" autocomplete="new-password" />
                <mat-icon matSuffix>lock</mat-icon>
              </mat-form-field>
            </div>

            <div class="col-12 col-md-6">
              <mat-form-field appearance="outline">
                <mat-label>Phone Number</mat-label>
                <input matInput formControlName="phoneNumber" autocomplete="tel" />
                <mat-icon matSuffix>call</mat-icon>
              </mat-form-field>
            </div>

            <div class="col-12">
              <button mat-flat-button color="primary" class="w-100 full-action" [disabled]="form.invalid || isSubmitting">
                <span *ngIf="!isSubmitting">Create Account</span>
                <span class="btn-loading" *ngIf="isSubmitting">
                  <mat-spinner diameter="18"></mat-spinner>
                  Creating
                </span>
              </button>
            </div>
          </form>

          <footer class="auth-footer">
            <span>Already registered?</span>
            <a routerLink="/login">Sign in</a>
          </footer>
        </mat-card>
      </div>
    </section>
  `,
  styles: [`
    .full-action {
      min-height: 2.9rem;
      border-radius: 0.78rem;
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
    phoneNumber: ['']
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
      phoneNumber: this.form.controls.phoneNumber.value ?? undefined
    };

    this.isSubmitting = true;
    this.authService.register(payload)
      .pipe(finalize(() => { this.isSubmitting = false; }))
      .subscribe(() => {
        this.router.navigate(['/dashboard']);
      });
  }
}
