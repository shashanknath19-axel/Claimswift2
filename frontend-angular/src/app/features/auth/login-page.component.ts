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
      <div class="auth-grid fade-in">
        <aside class="auth-brand-pane">
          <span class="auth-brand-badge">
            <mat-icon>verified_user</mat-icon>
            Secure Access
          </span>
          <h2>Welcome back to ClaimSwift</h2>
          <p>Access your claims workspace with enterprise-grade authentication and real-time workflow visibility.</p>
          <ul class="auth-feature-list">
            <li>Track claims in real time</li>
            <li>Unified notifications and tasks</li>
            <li>Auditable request tracing</li>
          </ul>
        </aside>

        <mat-card class="auth-form-pane border-0 rounded-0 shadow-none">
          <header class="auth-header">
            <p class="eyebrow">Secure Access</p>
            <h1>Sign In</h1>
            <p>Use your ClaimSwift account to continue.</p>
          </header>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form row g-2">
            <div class="col-12">
              <mat-form-field appearance="outline">
                <mat-label>Username or Email</mat-label>
                <input matInput formControlName="usernameOrEmail" autocomplete="username" />
                <mat-icon matSuffix>person</mat-icon>
              </mat-form-field>
            </div>

            <div class="col-12">
              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput type="password" formControlName="password" autocomplete="current-password" />
                <mat-icon matSuffix>lock</mat-icon>
              </mat-form-field>
            </div>

            <div class="col-12">
              <button mat-flat-button color="primary" class="w-100 full-action" [disabled]="loginForm.invalid || isSubmitting">
                <span *ngIf="!isSubmitting">Login</span>
                <span class="btn-loading" *ngIf="isSubmitting">
                  <mat-spinner diameter="18"></mat-spinner>
                  Signing in
                </span>
              </button>
            </div>
          </form>

          <footer class="auth-footer">
            <span>New to ClaimSwift?</span>
            <a routerLink="/register">Create account</a>
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
