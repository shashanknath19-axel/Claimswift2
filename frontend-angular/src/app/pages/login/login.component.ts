import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { extractValidationErrors, getFieldError, toUserErrorMessage } from '../../core/utils/error-message.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  readonly form = this.fb.group({
    usernameOrEmail: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  isSubmitting = false;
  errorMessage = '';
  serverValidationErrors: Record<string, string> = {};

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.serverValidationErrors = {};
    this.isSubmitting = true;

    this.authService.login(this.form.getRawValue() as { usernameOrEmail: string; password: string }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: (error) => {
        this.isSubmitting = false;
        this.serverValidationErrors = extractValidationErrors(error);
        this.errorMessage = toUserErrorMessage(
          error,
          'Sign-in failed. Verify your credentials and try again.',
          'Enter a valid username or email and password.'
        );
      }
    });
  }

  fieldError(field: string, label: string): string {
    return getFieldError(this.form, field, label, this.serverValidationErrors);
  }
}
