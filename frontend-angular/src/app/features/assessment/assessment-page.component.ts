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
import { MatSelectModule } from '@angular/material/select';

import { Document } from '../../core/models/document.model';
import { DocumentService } from '../../core/services/document.service';
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
    MatIconModule,
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
            <button mat-flat-button color="primary" [disabled]="assessmentForm.invalid || !claimId || hasFinalDecision">
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
            <button mat-flat-button color="primary" [disabled]="decisionForm.invalid || !assessmentId || hasFinalDecision">
              Submit Decision
            </button>
          </div>
        </form>
      </mat-card>
      </div>

      <div class="col-12">
      <mat-card class="claim-card">
        <div class="card-header"><h2>Claim Documents</h2></div>
        <div class="card-body">
          <div class="loading-container" *ngIf="loadingDocuments">
            <mat-spinner diameter="28"></mat-spinner>
            <p>Loading claim documents...</p>
          </div>

          <div class="empty-state compact" *ngIf="!loadingDocuments && !documents.length">
            <mat-icon class="empty-icon">description</mat-icon>
            <h3>No documents uploaded for this claim yet</h3>
          </div>

          <div class="table-wrap" *ngIf="!loadingDocuments && documents.length">
            <table class="data-table table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let document of documents">
                  <td>{{ document.originalFileName || document.fileName }}</td>
                  <td>{{ document.documentType }}</td>
                  <td>{{ document.fileSize | number }} bytes</td>
                  <td class="action-buttons">
                    <button mat-icon-button (click)="downloadDocument(document)">
                      <mat-icon>download</mat-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
  loadingDocuments = false;
  claimId: number | null = null;
  assessmentId: number | null = null;
  hasFinalDecision = false;
  documents: Document[] = [];

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
    private readonly assessmentService: AssessmentService,
    private readonly documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.claimId = Number(this.route.snapshot.paramMap.get('claimId'));
    if (!this.claimId) {
      return;
    }

    this.loadClaimDocuments(this.claimId);

    this.loading = true;
    this.assessmentService.getByClaimId(this.claimId, true)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(result => {
        const data = result as { id?: number; assessedAmount?: number; decision?: string | null } | null;
        this.assessmentId = data?.id ?? null;
        this.hasFinalDecision = !!data?.decision && data.decision !== 'PENDING_REVIEW';
        if (data?.assessedAmount) {
          this.assessmentForm.patchValue({ assessedAmount: data.assessedAmount });
          this.decisionForm.patchValue({ finalAmount: data.assessedAmount });
        }
      });
  }

  submitAssessment(): void {
    if (!this.claimId || this.assessmentForm.invalid || this.hasFinalDecision) {
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
    if (!this.assessmentId || this.decisionForm.invalid || this.hasFinalDecision) {
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

  downloadDocument(document: Document): void {
    this.documentService.downloadDocument(document.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalFileName || document.fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  private loadClaimDocuments(claimId: number): void {
    this.loadingDocuments = true;
    this.documentService.getDocumentsByClaim(claimId, true)
      .pipe(finalize(() => { this.loadingDocuments = false; }))
      .subscribe(documents => {
        this.documents = documents;
      });
  }
}
