import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ClaimRequest } from '../../core/models/claim.model';
import { ClaimService } from '../../core/services/claim.service';

@Component({
  selector: 'app-claim-form-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  template: `
    <section class="page-header">
      <div>
        <h1>{{ isEditMode ? 'Edit Claim' : 'Create New Claim' }}</h1>
        <p>{{ isEditMode ? 'Update the claim details below.' : 'Submit a complete claim for assessment.' }}</p>
      </div>
    </section>

    <mat-card class="claim-card fade-in">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-section">
          <h2 class="section-title">Policy and Vehicle</h2>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Policy Number</mat-label>
              <input matInput formControlName="policyNumber" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Vehicle Registration</mat-label>
              <input matInput formControlName="vehicleRegistration" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Vehicle Make</mat-label>
              <input matInput formControlName="vehicleMake" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Vehicle Model</mat-label>
              <input matInput formControlName="vehicleModel" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Vehicle Year</mat-label>
              <input matInput type="number" formControlName="vehicleYear" />
            </mat-form-field>
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">Incident and Amount</h2>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Incident Date</mat-label>
              <input matInput type="date" formControlName="incidentDate" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Incident Location</mat-label>
              <input matInput formControlName="incidentLocation" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Claim Amount</mat-label>
              <input matInput type="number" formControlName="claimAmount" />
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Incident Description</mat-label>
            <textarea matInput rows="4" formControlName="incidentDescription"></textarea>
          </mat-form-field>
        </div>

        <div class="card-actions">
          <button mat-stroked-button type="button" (click)="router.navigate(['/claims'])">Cancel</button>
          <button mat-flat-button color="primary" [disabled]="form.invalid || loading">
            <span *ngIf="!loading">{{ isEditMode ? 'Update Claim' : 'Submit Claim' }}</span>
            <span class="btn-loading" *ngIf="loading">
              <mat-spinner diameter="18"></mat-spinner>
              Saving
            </span>
          </button>
        </div>
      </form>
    </mat-card>
  `,
  styles: [`
    .page-header h1 {
      margin: 0;
      color: #0f2f47;
    }

    .page-header p {
      margin: 0.35rem 0 1rem;
      color: var(--text-secondary);
    }

    .btn-loading {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
  `]
})
export class ClaimFormPageComponent implements OnInit {
  claimId: number | null = null;
  loading = false;

  readonly form = this.fb.group({
    policyNumber: ['', Validators.required],
    vehicleRegistration: ['', Validators.required],
    vehicleMake: ['', Validators.required],
    vehicleModel: ['', Validators.required],
    vehicleYear: [new Date().getFullYear(), [Validators.required, Validators.min(1950)]],
    incidentDate: ['', Validators.required],
    incidentLocation: ['', Validators.required],
    incidentDescription: ['', [Validators.required, Validators.minLength(20)]],
    claimAmount: [0, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    public readonly router: Router,
    private readonly claimService: ClaimService
  ) {}

  get isEditMode(): boolean {
    return this.claimId !== null;
  }

  ngOnInit(): void {
    const claimIdParam = this.route.snapshot.paramMap.get('id');
    this.claimId = claimIdParam ? Number(claimIdParam) : null;

    if (!this.claimId) {
      return;
    }

    this.loading = true;
    this.claimService.getClaimById(this.claimId)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(claim => {
        this.form.patchValue({
          policyNumber: claim.policyNumber,
          vehicleRegistration: claim.vehicleRegistrationNumber || claim.vehicleRegistration || '',
          vehicleMake: claim.vehicleMake || '',
          vehicleModel: claim.vehicleModel || '',
          vehicleYear: claim.vehicleYear ?? new Date().getFullYear(),
          incidentDate: claim.incidentDate?.slice(0, 10) ?? '',
          incidentLocation: claim.incidentLocation ?? '',
          incidentDescription: claim.incidentDescription ?? '',
          claimAmount: claim.claimAmount
        });
      });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    const payload: ClaimRequest = {
      policyNumber: this.form.controls.policyNumber.value ?? '',
      vehicleRegistration: this.form.controls.vehicleRegistration.value ?? '',
      vehicleMake: this.form.controls.vehicleMake.value ?? '',
      vehicleModel: this.form.controls.vehicleModel.value ?? '',
      vehicleYear: this.form.controls.vehicleYear.value ?? undefined,
      incidentDate: this.form.controls.incidentDate.value ?? '',
      incidentLocation: this.form.controls.incidentLocation.value ?? '',
      incidentDescription: this.form.controls.incidentDescription.value ?? '',
      claimAmount: this.form.controls.claimAmount.value ?? 0
    };

    this.loading = true;

    const request$ = this.isEditMode && this.claimId
      ? this.claimService.updateClaim(this.claimId, payload)
      : this.claimService.createClaim(payload);

    request$
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(claim => {
        if (this.isEditMode) {
          this.router.navigate(['/claims', claim.id]);
          return;
        }

        this.router.navigate(['/documents/upload'], {
          queryParams: {
            claimId: claim.id,
            returnTo: `/claims/${claim.id}`
          }
        });
      });
  }
}
