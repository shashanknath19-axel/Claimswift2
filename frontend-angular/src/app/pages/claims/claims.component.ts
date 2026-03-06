import { AsyncPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClaimsApiService } from '../../core/services/claims-api.service';
import { ClaimResponse } from '../../core/models/claim.models';
import { AuthService } from '../../core/services/auth.service';
import { RoleChipComponent } from '../../ui/role-chip/role-chip.component';
import { ShellCardComponent } from '../../ui/shell-card/shell-card.component';
import { StandardResponse, PaginatedResponse } from '../../core/models/common.models';
import { extractValidationErrors, getFieldError, toUserErrorMessage } from '../../core/utils/error-message.util';

@Component({
  selector: 'app-claims',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe,
    AsyncPipe,
    ShellCardComponent,
    RoleChipComponent
  ],
  templateUrl: './claims.component.html',
  styleUrl: './claims.component.scss'
})
export class ClaimsComponent implements OnInit {
  readonly claimForm = this.fb.nonNullable.group({
    policyNumber: ['', [Validators.required]],
    vehicleRegistration: ['', [Validators.required]],
    incidentDate: ['', [Validators.required]],
    incidentLocation: [''],
    incidentDescription: [''],
    claimAmount: [0, [Validators.required, Validators.min(1)]]
  });

  claims: ClaimResponse[] = [];
  isLoading = false;
  isSubmitting = false;
  error = '';
  success = '';
  serverValidationErrors: Record<string, string> = {};
  readonly currentUser$ = this.authService.currentUser$;

  constructor(
    private readonly fb: FormBuilder,
    private readonly claimsApiService: ClaimsApiService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadClaims();
  }

  loadClaims(): void {
    this.isLoading = true;
    this.error = '';
    if (this.authService.hasRole('ROLE_POLICYHOLDER')) {
      this.claimsApiService.getMyClaims().subscribe({
        next: (response: StandardResponse<ClaimResponse[]>) => {
          this.claims = response.data;
          this.isLoading = false;
        },
        error: (error: unknown) => {
          this.error = toUserErrorMessage(error, 'Unable to load claims.');
          this.isLoading = false;
        }
      });
      return;
    }

    this.claimsApiService.getClaims().subscribe({
      next: (response: StandardResponse<PaginatedResponse<ClaimResponse>>) => {
        this.claims = response.data.content;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.error = toUserErrorMessage(error, 'Unable to load claims.');
        this.isLoading = false;
      }
    });
  }

  submitClaim(): void {
    if (this.claimForm.invalid || this.isSubmitting) {
      this.claimForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = '';
    this.success = '';
    this.serverValidationErrors = {};

    this.claimsApiService.createClaim(this.claimForm.getRawValue()).subscribe({
      next: () => {
        this.success = 'Claim submitted successfully. It is now in intake review.';
        this.claimForm.reset({
          policyNumber: '',
          vehicleRegistration: '',
          incidentDate: '',
          incidentLocation: '',
          incidentDescription: '',
          claimAmount: 0
        });
        this.isSubmitting = false;
        this.loadClaims();
      },
      error: (error: unknown) => {
        this.serverValidationErrors = extractValidationErrors(error);
        this.error = toUserErrorMessage(
          error,
          'Claim submission could not be completed right now.',
          'Please review the claim details and enter valid values.'
        );
        this.isSubmitting = false;
      }
    });
  }

  fieldError(field: string, label: string): string {
    return getFieldError(this.claimForm, field, label, this.serverValidationErrors);
  }
}
