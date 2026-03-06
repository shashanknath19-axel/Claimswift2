import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaymentMethod, PaymentResponse } from '../../core/models/payment.models';
import { ClaimReferenceService } from '../../core/services/claim-reference.service';
import { PaymentsApiService } from '../../core/services/payments-api.service';
import { extractValidationErrors, getFieldError, toUserErrorMessage } from '../../core/utils/error-message.util';
import { ShellCardComponent } from '../../ui/shell-card/shell-card.component';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, DatePipe, DecimalPipe, ShellCardComponent],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent {
  readonly paymentForm = this.fb.nonNullable.group({
    claimReference: ['', [Validators.required]],
    policyholderId: [0, [Validators.min(0)]],
    amount: [0, [Validators.min(0)]],
    paymentMethod: ['BANK_TRANSFER' as PaymentMethod, [Validators.required]],
    beneficiaryName: ['', [Validators.required]],
    accountNumber: ['', [Validators.required]],
    ifscCode: ['', [Validators.required]],
    bankName: ['']
  });

  readonly filterForm = this.fb.nonNullable.group({
    claimReference: ['', [Validators.required]]
  });

  readonly paymentMethods: PaymentMethod[] = ['BANK_TRANSFER', 'CHEQUE', 'UPI', 'NEFT', 'RTGS', 'IMPS'];
  payments: PaymentResponse[] = [];
  isSubmitting = false;
  isLoading = false;
  error = '';
  success = '';
  resolvedClaimNumber = '';
  resolvedClaimId: number | null = null;
  serverValidationErrors: Record<string, string> = {};

  constructor(
    private readonly fb: FormBuilder,
    private readonly claimReferenceService: ClaimReferenceService,
    private readonly paymentsApiService: PaymentsApiService
  ) {}

  submitPayment(): void {
    if (this.paymentForm.invalid || this.isSubmitting) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = '';
    this.success = '';
    this.serverValidationErrors = {};

    const values = this.paymentForm.getRawValue();
    this.resolvedClaimNumber = '';
    this.resolvedClaimId = null;

    this.claimReferenceService.resolveClaim(values.claimReference).subscribe({
      next: (claim) => {
        this.resolvedClaimId = claim.id;
        this.resolvedClaimNumber = claim.claimNumber;

        const policyholderId = values.policyholderId > 0 ? values.policyholderId : claim.policyholderId;
        const amount =
          values.amount > 0
            ? values.amount
            : claim.approvedAmount && claim.approvedAmount > 0
              ? claim.approvedAmount
              : claim.claimAmount;

        if (!policyholderId || policyholderId <= 0) {
          this.error = 'Policyholder ID could not be resolved for this claim.';
          this.isSubmitting = false;
          return;
        }

        if (!amount || amount <= 0) {
          this.error = 'Settlement amount could not be resolved for this claim.';
          this.isSubmitting = false;
          return;
        }

        this.paymentsApiService
          .createPayment({
            claimId: claim.id,
            policyholderId,
            amount,
            paymentMethod: values.paymentMethod,
            beneficiaryName: values.beneficiaryName,
            accountNumber: values.accountNumber,
            ifscCode: values.ifscCode,
            bankName: values.bankName
          })
          .subscribe({
            next: () => {
              this.success = `Settlement instruction submitted for claim ${claim.claimNumber}.`;
              this.isSubmitting = false;
              this.loadByClaim(claim.id);
            },
            error: (error: { error?: { message?: string } }) => {
              this.serverValidationErrors = extractValidationErrors(error);
              this.error = toUserErrorMessage(
                error,
                'Settlement instruction could not be submitted.',
                'Please review settlement details and enter valid values.'
              );
              this.isSubmitting = false;
            }
          });
      },
      error: (error: unknown) => {
        this.error = toUserErrorMessage(
          error,
          'Claim reference could not be validated.',
          'Enter a valid Claim ID or Claim number.'
        );
        this.isSubmitting = false;
      }
    });
  }

  loadPayments(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }
    this.error = '';
    const { claimReference } = this.filterForm.getRawValue();
    this.claimReferenceService.resolveClaim(claimReference).subscribe({
      next: (claim) => {
        this.resolvedClaimId = claim.id;
        this.resolvedClaimNumber = claim.claimNumber;
        this.loadByClaim(claim.id);
      },
      error: (error: unknown) => {
        this.error = toUserErrorMessage(
          error,
          'Claim reference could not be validated.',
          'Enter a valid Claim ID or Claim number.'
        );
      }
    });
  }

  private loadByClaim(claimId: number): void {
    this.isLoading = true;
    this.error = '';
    this.paymentsApiService.getPaymentsByClaim(claimId).subscribe({
      next: (response: { data: PaymentResponse[] }) => {
        this.payments = response.data;
        this.isLoading = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.error = toUserErrorMessage(error, 'Unable to load settlements for this claim.');
        this.isLoading = false;
      }
    });
  }

  fieldError(formName: 'payment' | 'filter', field: string, label: string): string {
    const form = formName === 'payment' ? this.paymentForm : this.filterForm;
    return getFieldError(form, field, label, this.serverValidationErrors);
  }

  formatPaymentMethod(method: PaymentMethod): string {
    return method.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
