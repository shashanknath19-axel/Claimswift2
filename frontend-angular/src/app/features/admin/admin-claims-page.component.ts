import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { Claim, ClaimStatus } from '../../core/models/claim.model';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { ClaimService } from '../../core/services/claim.service';

@Component({
  selector: 'app-admin-claims-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
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
      <div>
        <h1>Admin Claim Management</h1>
        <p>Assign adjusters and apply status workflow decisions.</p>
      </div>
    </section>

    <mat-card class="claim-card fade-in">
      <div class="toolbar">
        <mat-form-field appearance="outline">
          <mat-label>Status Filter</mat-label>
          <mat-select [(ngModel)]="statusFilter" (selectionChange)="loadClaims()">
            <mat-option value="ALL">All</mat-option>
            <mat-option value="SUBMITTED">Submitted</mat-option>
            <mat-option value="UNDER_REVIEW">Under Review</mat-option>
            <mat-option value="APPROVED">Approved</mat-option>
            <mat-option value="REJECTED">Rejected</mat-option>
            <mat-option value="PAID">Paid</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-stroked-button (click)="loadClaims()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="36"></mat-spinner>
        <p>Loading claim operations queue...</p>
      </div>

      <div class="table-wrap" *ngIf="!loading && claims.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>Claim #</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Current Adjuster</th>
              <th>Assign Adjuster</th>
              <th>Workflow (Approve/Disapprove/Adjust)</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let claim of claims">
              <td>
                <a [routerLink]="['/claims', claim.id]">{{ claim.claimNumber }}</a>
              </td>
              <td>
                <span class="status-badge" [ngClass]="'status-' + statusClass(claim.status)">{{ claim.status }}</span>
              </td>
              <td>{{ claim.claimAmount | currency:'INR':'symbol':'1.0-0' }}</td>
              <td>{{ claim.assignedAdjusterId || '-' }}</td>
              <td>
                <div class="assign-box">
                  <input matInput type="number" placeholder="Adjuster ID" [(ngModel)]="adjusterMap[claim.id]" />
                  <button mat-button (click)="assign(claim.id)">Assign</button>
                  <button mat-button color="warn" *ngIf="claim.assignedAdjusterId" (click)="unassign(claim.id)">Remove</button>
                </div>
              </td>
              <td class="action-buttons">
                <button mat-button (click)="updateStatus(claim.id, 'UNDER_REVIEW')">Review</button>
                <button mat-button color="primary" (click)="updateStatus(claim.id, 'APPROVED')">Approve</button>
                <button mat-button color="warn" (click)="updateStatus(claim.id, 'REJECTED')">Reject</button>
                <button mat-button (click)="updateStatus(claim.id, 'ADJUSTED')">Adjust</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state" *ngIf="!loading && !claims.length">
        <mat-icon class="empty-icon">check_circle</mat-icon>
        <h3>No claims in this filter</h3>
      </div>
    </mat-card>

    <mat-card class="claim-card adjuster-card">
      <div class="card-header">
        <h2>Adjuster Availability</h2>
      </div>
      <div class="card-body">
        <div class="empty-state compact" *ngIf="!adjusterAvailability.length">
          <mat-icon class="empty-icon">groups</mat-icon>
          <h3>No adjuster assignment data yet</h3>
        </div>

        <table class="data-table" *ngIf="adjusterAvailability.length">
          <thead>
            <tr>
              <th>Adjuster ID</th>
              <th>Name</th>
              <th>Assigned Claims</th>
              <th>Availability</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of adjusterAvailability">
              <td>{{ item.adjusterId }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.assignedClaims }}</td>
              <td>
                <span class="status-badge" [ngClass]="'status-' + item.badgeClass">{{ item.label }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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

    .toolbar {
      display: flex;
      gap: 0.8rem;
      align-items: flex-end;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .table-wrap {
      overflow: auto;
    }

    a {
      color: #164d72;
      text-decoration: none;
      font-weight: 600;
    }

    .assign-box {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      min-width: 12rem;
    }

    .adjuster-card {
      margin-top: 1rem;
    }

    .compact {
      padding: 1rem 0;
    }
  `]
})
export class AdminClaimsPageComponent implements OnInit {
  loading = false;
  statusFilter = 'ALL';
  claims: Claim[] = [];
  adjusterMap: Record<number, number | null> = {};
  adjusterAvailability: AdjusterAvailability[] = [];
  adjusters: User[] = [];

  constructor(
    private readonly claimService: ClaimService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAdjusters();
    this.loadClaims();
  }

  loadClaims(): void {
    this.loading = true;

    const done = () => { this.loading = false; };
    if (this.statusFilter === 'ALL') {
      this.claimService.getClaims(0, 100)
        .pipe(finalize(done))
        .subscribe(result => {
          this.claims = result.content;
          this.refreshAdjusterAvailability();
        });
      return;
    }

    this.claimService.getClaimsByStatus(this.statusFilter)
      .pipe(finalize(done))
      .subscribe(claims => {
        this.claims = claims;
        this.refreshAdjusterAvailability();
      });
  }

  updateStatus(claimId: number, status: ClaimStatus): void {
    this.claimService.updateClaimStatus(claimId, { status }).subscribe(updated => {
      this.claims = this.claims.map(claim => claim.id === updated.id ? updated : claim);
      this.refreshAdjusterAvailability();
    });
  }

  assign(claimId: number): void {
    const adjusterId = Number(this.adjusterMap[claimId]);
    if (!adjusterId) {
      return;
    }

    this.claimService.assignClaim(claimId, adjusterId).subscribe(updated => {
      this.claims = this.claims.map(claim => claim.id === updated.id ? updated : claim);
      this.refreshAdjusterAvailability();
    });
  }

  unassign(claimId: number): void {
    this.claimService.unassignClaim(claimId).subscribe(updated => {
      this.claims = this.claims.map(claim => claim.id === updated.id ? updated : claim);
      this.refreshAdjusterAvailability();
    });
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace(/_/g, '-');
  }

  private refreshAdjusterAvailability(): void {
    const counters = new Map<number, number>();

    this.claims.forEach(claim => {
      if (claim.assignedAdjusterId && claim.assignedAdjusterId > 0) {
        const current = counters.get(claim.assignedAdjusterId) ?? 0;
        counters.set(claim.assignedAdjusterId, current + 1);
      }
    });

    const adjusterIds = new Set<number>([
      ...this.adjusters.map(adjuster => adjuster.id),
      ...counters.keys()
    ]);

    this.adjusterAvailability = [...adjusterIds]
      .map(adjusterId => {
        const assignedClaims = counters.get(adjusterId) ?? 0;
        const adjuster = this.adjusters.find(item => item.id === adjusterId);
        return {
        adjusterId,
        name: adjuster ? `${adjuster.firstName} ${adjuster.lastName}`.trim() : 'Unknown',
        assignedClaims,
        label: assignedClaims >= 8
          ? ('Busy' as const)
          : assignedClaims >= 4
            ? ('Moderate' as const)
            : ('Available' as const),
        badgeClass: assignedClaims >= 8
          ? ('rejected' as const)
          : assignedClaims >= 4
            ? ('under-review' as const)
            : ('approved' as const)
        };
      })
      .sort((a, b) => b.assignedClaims - a.assignedClaims);
  }

  private loadAdjusters(): void {
    this.authService.getAdjusters().subscribe(adjusters => {
      this.adjusters = adjusters;
      this.refreshAdjusterAvailability();
    });
  }
}

interface AdjusterAvailability {
  adjusterId: number;
  name: string;
  assignedClaims: number;
  label: 'Busy' | 'Moderate' | 'Available';
  badgeClass: 'rejected' | 'under-review' | 'approved';
}
