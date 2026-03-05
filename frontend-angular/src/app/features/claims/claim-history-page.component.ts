import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Claim } from '../../core/models/claim.model';
import { Document } from '../../core/models/document.model';
import { ClaimService } from '../../core/services/claim.service';
import { DocumentService } from '../../core/services/document.service';

@Component({
  selector: 'app-claim-history-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <section class="page-header">
      <div>
        <h1>Claim History</h1>
        <p>Review previous claims and download related settlement documents.</p>
      </div>
      <button mat-stroked-button routerLink="/claims">
        <mat-icon>arrow_back</mat-icon>
        Back to claims
      </button>
    </section>

    <mat-card class="claim-card fade-in">
      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="36"></mat-spinner>
        <p>Loading claim history...</p>
      </div>

      <div class="empty-state" *ngIf="!loading && !claims.length">
        <mat-icon class="empty-icon">history</mat-icon>
        <h3>No claim history found</h3>
      </div>

      <div class="table-wrap" *ngIf="!loading && claims.length">
        <table class="data-table table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Claim #</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let claim of claims">
              <td>{{ claim.claimNumber }}</td>
              <td>
                <span class="status-badge" [ngClass]="'status-' + statusClass(claim.status)">
                  {{ claim.status }}
                </span>
              </td>
              <td>{{ claim.claimAmount | currency:'INR':'symbol':'1.0-0' }}</td>
              <td>{{ claim.createdAt || claim.incidentDate | date:'mediumDate' }}</td>
              <td class="action-buttons">
                <button mat-icon-button [routerLink]="['/claims', claim.id, 'tracking']" matTooltip="Track">
                  <mat-icon>timeline</mat-icon>
                </button>
                <button
                  mat-icon-button
                  (click)="downloadSettlementDocuments(claim)"
                  [disabled]="downloadingClaimId === claim.id || !isSettlementEligible(claim)"
                  matTooltip="Download documents"
                >
                  <mat-icon>{{ downloadingClaimId === claim.id ? 'hourglass_top' : 'download' }}</mat-icon>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </mat-card>
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

    .table-wrap {
      overflow: auto;
    }
  `]
})
export class ClaimHistoryPageComponent implements OnInit {
  loading = false;
  claims: Claim[] = [];
  downloadingClaimId: number | null = null;

  constructor(
    private readonly claimService: ClaimService,
    private readonly documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.claimService.getClaimHistory()
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(claims => {
        this.claims = [...claims].sort((a, b) =>
          this.toTimestamp(b.createdAt || b.incidentDate) - this.toTimestamp(a.createdAt || a.incidentDate)
        );
      });
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace(/_/g, '-');
  }

  isSettlementEligible(claim: Claim): boolean {
    return ['APPROVED', 'PAID', 'ADJUSTED'].includes(claim.status);
  }

  downloadSettlementDocuments(claim: Claim): void {
    if (!this.isSettlementEligible(claim)) {
      return;
    }

    this.downloadingClaimId = claim.id;
    this.documentService.getDocumentsByClaim(claim.id, true)
      .pipe(finalize(() => { this.downloadingClaimId = null; }))
      .subscribe(documents => {
        documents.forEach(document => this.downloadDocument(document));
      });
  }

  private downloadDocument(document: Document): void {
    this.documentService.downloadDocument(document.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalFileName || document.fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  private toTimestamp(value: string | undefined): number {
    if (!value) {
      return 0;
    }
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
