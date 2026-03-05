import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Claim, ClaimStatistics } from '../../core/models/claim.model';
import { ClaimService } from '../../core/services/claim.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <section class="page-header">
      <div>
        <h1>Admin Dashboard</h1>
        <p>Operational command center for claim processing teams.</p>
      </div>
      <div class="header-actions">
        <button mat-stroked-button routerLink="/admin/claims">
          <mat-icon>assignment</mat-icon>
          Manage Claims
        </button>
        <button mat-stroked-button routerLink="/reports">
          <mat-icon>assessment</mat-icon>
          Reports
        </button>
      </div>
    </section>

    <section class="row g-3 mb-3" *ngIf="!loading; else loadingTpl">
      <div class="col-12 col-sm-6 col-xl-3">
        <mat-card class="kpi-card h-100">
          <div class="kpi-title">Total Claims</div>
          <div class="kpi-value">{{ stats.totalClaims }}</div>
        </mat-card>
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <mat-card class="kpi-card h-100">
          <div class="kpi-title">Under Review</div>
          <div class="kpi-value">{{ stats.underReviewClaims }}</div>
        </mat-card>
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <mat-card class="kpi-card h-100">
          <div class="kpi-title">Approved</div>
          <div class="kpi-value">{{ stats.approvedClaims }}</div>
        </mat-card>
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <mat-card class="kpi-card h-100">
          <div class="kpi-title">Rejected</div>
          <div class="kpi-value">{{ stats.rejectedClaims }}</div>
        </mat-card>
      </div>
    </section>

    <mat-card class="claim-card" *ngIf="!loading">
      <div class="card-header">
        <h2>Priority Queue</h2>
      </div>
      <div class="card-body">
        <div class="empty-state" *ngIf="!priorityClaims.length">
          <mat-icon class="empty-icon">task_alt</mat-icon>
          <h3>No priority claims</h3>
        </div>

        <table class="data-table table table-hover align-middle mb-0" *ngIf="priorityClaims.length">
          <thead>
            <tr>
              <th>Claim #</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let claim of priorityClaims">
              <td>{{ claim.claimNumber }}</td>
              <td><span class="status-badge" [ngClass]="'status-' + statusClass(claim.status)">{{ claim.status }}</span></td>
              <td>{{ claim.claimAmount | currency:'INR':'symbol':'1.0-0' }}</td>
              <td>
                <button mat-button [routerLink]="['/claims', claim.id]">Open</button>
                <button mat-button [routerLink]="['/assessment', claim.id]">Assess</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </mat-card>

    <ng-template #loadingTpl>
      <div class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading admin metrics...</p>
      </div>
    </ng-template>
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
      margin-top: 0.35rem;
      font-size: 1.8rem;
      font-weight: 700;
      color: #10324b;
    }

    @media (max-width: 540px) {
      .header-actions {
        width: 100%;
      }
    }
  `]
})
export class AdminDashboardPageComponent implements OnInit {
  loading = false;
  priorityClaims: Claim[] = [];

  stats: ClaimStatistics = {
    totalClaims: 0,
    submittedClaims: 0,
    underReviewClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    closedClaims: 0
  };

  constructor(private readonly claimService: ClaimService) {}

  ngOnInit(): void {
    this.loading = true;
    this.claimService.getClaimStatistics().subscribe(stats => { this.stats = stats; });

    this.claimService.getPendingClaims()
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(claims => {
        this.priorityClaims = claims.slice(0, 10);
      });
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace(/_/g, '-');
  }
}
