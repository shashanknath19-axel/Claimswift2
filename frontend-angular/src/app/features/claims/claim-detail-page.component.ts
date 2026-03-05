import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Claim, ClaimStatus } from '../../core/models/claim.model';
import { Document } from '../../core/models/document.model';
import { AuthService } from '../../core/services/auth.service';
import { ClaimService } from '../../core/services/claim.service';
import { DocumentService } from '../../core/services/document.service';
import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-claim-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <section class="page-header" *ngIf="claim">
      <div>
        <h1>{{ claim.claimNumber }}</h1>
        <p>Claim details and workflow controls.</p>
      </div>
      <div class="header-actions">
        <button mat-stroked-button [routerLink]="['/claims', claim.id, 'tracking']">
          <mat-icon>timeline</mat-icon>
          Track
        </button>
        <button mat-stroked-button [routerLink]="['/claims', claim.id, 'edit']" *ngIf="isPolicyholder">
          <mat-icon>edit</mat-icon>
          Edit
        </button>
        <button mat-flat-button color="primary" [routerLink]="['/assessment', claim.id]" *ngIf="isAdjusterOrManager">
          <mat-icon>fact_check</mat-icon>
          Assessment
        </button>
        <button mat-stroked-button color="warn" (click)="deleteClaim()" *ngIf="canDeleteClaim">
          <mat-icon>delete</mat-icon>
          Delete
        </button>
      </div>
    </section>

    <div class="loading-container" *ngIf="loading">
      <mat-spinner diameter="40"></mat-spinner>
      <p>Loading claim details...</p>
    </div>

    <div class="empty-state" *ngIf="!loading && loadError">
      <mat-icon class="empty-icon">error</mat-icon>
      <h3>Unable to load claim</h3>
      <p>{{ loadError }}</p>
      <button mat-stroked-button routerLink="/claims">Back to claims</button>
    </div>

    <ng-container *ngIf="!loading && claim">
      <section class="summary-grid">
        <mat-card class="kpi-card">
          <div class="kpi-title">Status</div>
          <span class="status-badge" [ngClass]="'status-' + statusClass(claim.status)">{{ claim.status }}</span>
        </mat-card>
        <mat-card class="kpi-card">
          <div class="kpi-title">Claim Amount</div>
          <div class="kpi-value">{{ claim.claimAmount | currency:'INR':'symbol':'1.0-0' }}</div>
        </mat-card>
        <mat-card class="kpi-card">
          <div class="kpi-title">Documents</div>
          <div class="kpi-value">{{ documents.length }}</div>
        </mat-card>
        <mat-card class="kpi-card">
          <div class="kpi-title">Payments</div>
          <div class="kpi-value">{{ payments.length }}</div>
        </mat-card>
      </section>

      <mat-card class="claim-card">
        <div class="card-header">
          <h2>Incident Information</h2>
        </div>
        <div class="card-body detail-grid">
          <div>
            <div class="label">Incident Date</div>
            <div>{{ claim.incidentDate | date:'mediumDate' }}</div>
          </div>
          <div>
            <div class="label">Incident Location</div>
            <div>{{ claim.incidentLocation || '-' }}</div>
          </div>
          <div>
            <div class="label">Vehicle</div>
            <div>{{ claim.vehicleMake }} {{ claim.vehicleModel }} ({{ claim.vehicleYear }})</div>
          </div>
          <div>
            <div class="label">Vehicle Registration</div>
            <div>{{ claim.vehicleRegistrationNumber || claim.vehicleRegistration || '-' }}</div>
          </div>
          <div class="full">
            <div class="label">Description</div>
            <div>{{ claim.incidentDescription || '-' }}</div>
          </div>
        </div>
      </mat-card>

      <mat-card class="claim-card" *ngIf="isAdjusterOrManager">
        <div class="card-header">
          <h2>Adjuster Actions</h2>
        </div>
        <div class="card-body action-row">
          <button mat-stroked-button (click)="updateStatus('UNDER_REVIEW')">Mark Under Review</button>
          <button mat-flat-button color="primary" (click)="approveClaim()">Approve</button>
          <button mat-flat-button color="warn" (click)="rejectClaim()">Disapprove</button>
          <button mat-stroked-button (click)="adjustClaim()">Adjust Amount</button>
        </div>
      </mat-card>
    </ng-container>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    h1 {
      margin: 0;
      color: #0f2f47;
    }

    .page-header p {
      margin: 0.35rem 0 0;
      color: var(--text-secondary);
    }

    .header-actions {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.8rem;
      margin-bottom: 0.8rem;
    }

    .kpi-card {
      border: 1px solid var(--border-color);
      border-radius: 0.8rem;
    }

    .kpi-title {
      color: var(--text-secondary);
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }

    .kpi-value {
      margin-top: 0.4rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: #10324b;
    }

    .detail-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .full {
      grid-column: 1 / -1;
    }

    .label {
      font-size: 0.8rem;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin-bottom: 0.2rem;
      letter-spacing: 0.06em;
    }

    .action-row {
      display: flex;
      gap: 0.7rem;
      flex-wrap: wrap;
    }

    @media (max-width: 900px) {
      .summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 540px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ClaimDetailPageComponent implements OnInit {
  loading = true;
  loadError: string | null = null;
  claim: Claim | null = null;
  documents: Document[] = [];
  payments: unknown[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly claimService: ClaimService,
    private readonly documentService: DocumentService,
    private readonly paymentService: PaymentService
  ) {}

  get isPolicyholder(): boolean {
    return this.authService.hasRole('POLICYHOLDER');
  }

  get isAdjusterOrManager(): boolean {
    return this.authService.hasAnyRole(['ADJUSTER', 'MANAGER', 'ADMIN']);
  }

  get canDeleteClaim(): boolean {
    return this.authService.hasAnyRole(['ADJUSTER', 'MANAGER']);
  }

  ngOnInit(): void {
    const claimId = Number(this.route.snapshot.paramMap.get('id'));
    if (!claimId) {
      this.router.navigate(['/claims']);
      return;
    }

    this.claimService.getClaimById(claimId, true)
      .pipe(catchError(() => of(null)))
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(claim => {
        if (!claim) {
          this.loadError = 'The requested claim is unavailable right now. Please try again.';
          return;
        }

        this.loadError = null;
        this.claim = claim;
        this.loadRelatedData(claim.id);
      });
  }

  updateStatus(status: ClaimStatus): void {
    if (!this.claim) {
      return;
    }

    this.claimService.updateClaimStatus(this.claim.id, { status }).subscribe(updated => {
      this.claim = updated;
    });
  }

  approveClaim(): void {
    this.updateStatus('APPROVED');
  }

  rejectClaim(): void {
    this.updateStatus('REJECTED');
  }

  adjustClaim(): void {
    if (!this.claim) {
      return;
    }

    const amountInput = window.prompt(
      'Enter adjusted approved amount',
      String(this.claim.approvedAmount ?? this.claim.claimAmount)
    );
    if (amountInput === null) {
      return;
    }

    const approvedAmount = Number(amountInput);
    if (!Number.isFinite(approvedAmount) || approvedAmount <= 0) {
      return;
    }

    const notes = window.prompt('Enter adjustment note (optional)') || undefined;
    this.claimService.updateClaimStatus(this.claim.id, {
      status: 'ADJUSTED',
      approvedAmount,
      notes
    }).subscribe(updated => {
      this.claim = updated;
    });
  }

  deleteClaim(): void {
    if (!this.claim) {
      return;
    }

    const confirmed = window.confirm(`Delete claim ${this.claim.claimNumber}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.claimService.deleteClaim(this.claim.id).subscribe(() => {
      this.router.navigate(['/claims']);
    });
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace(/_/g, '-');
  }

  private loadRelatedData(claimId: number): void {
    this.documentService.getDocumentsByClaim(claimId, true).subscribe(documents => {
      this.documents = documents;
    });

    this.paymentService.getByClaimId(claimId, true).subscribe(payments => {
      this.payments = payments;
    });
  }
}
