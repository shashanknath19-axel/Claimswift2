import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import {
  AssessmentCreateRequest,
  AssessmentDecisionRequest,
  AssessmentService
} from '../../core/services/assessment.service';

@Component({
  selector: 'app-assessment-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <section class="page-header">
      <h1>Assessment Workflow</h1>
      <p *ngIf="claimId">Claim ID: {{ claimId }}</p>
    </section>

    <div class="loading-container" *ngIf="loading">
      <mat-spinner diameter="36"></mat-spinner>
      <p>Loading assessment...</p>
    </div>

    <section class="row g-3" *ngIf="!loading">
      <div class="col-12 col-xl-6">
      <mat-card class="claim-card h-100">
        <div class="card-header"><h2>Create Assessment</h2></div>
        <form [formGroup]="assessmentForm" (ngSubmit)="submitAssessment()" class="card-body">
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Assessed Amount</mat-label>
              <input matInput type="number" formControlName="assessedAmount" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Justification</mat-label>
              <input matInput formControlName="justification" />
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Notes</mat-label>
            <textarea matInput rows="4" formControlName="notes"></textarea>
          </mat-form-field>

          <div class="card-actions">
            <button mat-flat-button color="primary" [disabled]="assessmentForm.invalid || !claimId">
              Save Assessment
            </button>
          </div>
        </form>
      </mat-card>
      </div>

      <div class="col-12 col-xl-6">
      <mat-card class="claim-card h-100">
        <div class="card-header"><h2>Decision</h2></div>
        <form [formGroup]="decisionForm" (ngSubmit)="submitDecision()" class="card-body">
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Decision</mat-label>
              <mat-select formControlName="decision">
                <mat-option value="APPROVED">APPROVED</mat-option>
                <mat-option value="REJECTED">REJECTED</mat-option>
                <mat-option value="ADJUSTED">ADJUSTED</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Final Amount</mat-label>
              <input matInput type="number" formControlName="finalAmount" />
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Decision Justification</mat-label>
            <textarea matInput rows="4" formControlName="justification"></textarea>
          </mat-form-field>

          <div class="card-actions">
            <button mat-flat-button color="primary" [disabled]="decisionForm.invalid || !assessmentId">
              Submit Decision
            </button>
          </div>
        </form>
      </mat-card>
      </div>
    </section>
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

  `]
})
export class AssessmentPageComponent implements OnInit {
  loading = false;
  claimId: number | null = null;
  assessmentId: number | null = null;

  readonly assessmentForm = this.fb.group({
    assessedAmount: [0, [Validators.required, Validators.min(1)]],
    justification: ['', Validators.required],
    notes: ['']
  });

  readonly decisionForm = this.fb.group({
    decision: ['APPROVED' as AssessmentDecisionRequest['decision'], Validators.required],
    finalAmount: [0, [Validators.required, Validators.min(1)]],
    justification: ['', Validators.required]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly assessmentService: AssessmentService
  ) {}

  ngOnInit(): void {
    this.claimId = Number(this.route.snapshot.paramMap.get('claimId'));
    if (!this.claimId) {
      return;
    }

    this.loading = true;
    this.assessmentService.getByClaimId(this.claimId, true)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(result => {
        const data = result as { id?: number; assessedAmount?: number } | null;
        this.assessmentId = data?.id ?? null;
        if (data?.assessedAmount) {
          this.assessmentForm.patchValue({ assessedAmount: data.assessedAmount });
          this.decisionForm.patchValue({ finalAmount: data.assessedAmount });
        }
      });
  }

  submitAssessment(): void {
    if (!this.claimId || this.assessmentForm.invalid) {
      return;
    }

    const payload: AssessmentCreateRequest = {
      claimId: this.claimId,
      assessedAmount: this.assessmentForm.controls.assessedAmount.value ?? 0,
      justification: this.assessmentForm.controls.justification.value ?? '',
      notes: this.assessmentForm.controls.notes.value ?? ''
    };

    this.assessmentService.createAssessment(payload).subscribe(result => {
      const data = result as { id?: number; assessedAmount?: number };
      this.assessmentId = data.id ?? null;
      this.decisionForm.patchValue({
        finalAmount: data.assessedAmount ?? payload.assessedAmount
      });
    });
  }

  submitDecision(): void {
    if (!this.assessmentId || this.decisionForm.invalid) {
      return;
    }

    const payload: AssessmentDecisionRequest = {
      assessmentId: this.assessmentId,
      decision: this.decisionForm.controls.decision.value ?? 'APPROVED',
      finalAmount: this.decisionForm.controls.finalAmount.value ?? 0,
      justification: this.decisionForm.controls.justification.value ?? ''
    };

    this.assessmentService.submitDecision(payload).subscribe(() => {
      if (this.claimId) {
        this.router.navigate(['/claims', this.claimId, 'tracking']);
      }
    });
  }
}
