import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { take } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Claim, ClaimStatistics } from '../../core/models/claim.model';
import { Notification } from '../../core/models/notification.model';
import { AuthService } from '../../core/services/auth.service';
import { ClaimService } from '../../core/services/claim.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-dashboard-page',
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
    <section class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p>{{ welcomeLine }}</p>
      </div>
      <div class="header-actions">
        <button mat-flat-button color="primary" routerLink="/claims/new" *ngIf="isPolicyholder">
          <mat-icon>post_add</mat-icon>
          Create Claim
        </button>
        <button mat-flat-button color="primary" routerLink="/claims" *ngIf="isAdjuster">
          <mat-icon>task</mat-icon>
          Assigned Claims
        </button>
        <button mat-flat-button color="primary" routerLink="/admin/dashboard" *ngIf="isManagerOrAdmin">
          <mat-icon>admin_panel_settings</mat-icon>
          Operations Hub
        </button>
      </div>
    </section>

    <section class="row g-3 mb-3" *ngIf="!loading; else loadingTpl">
      <div class="col-12 col-sm-6 col-xl-3">
        <mat-card class="kpi-card h-100">
          <div class="kpi-title">Total Claims</div>
          <div class="kpi-value">{{ summary.totalClaims }}</div>
        </mat-card>
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <mat-card class="kpi-card h-100">
          <div class="kpi-title">Under Review</div>
          <div class="kpi-value">{{ summary.underReviewClaims }}</div>
        </mat-card>
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <mat-card class="kpi-card h-100">
          <div class="kpi-title">Approved</div>
          <div class="kpi-value">{{ summary.approvedClaims }}</div>
        </mat-card>
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <mat-card class="kpi-card h-100">
          <div class="kpi-title">Rejected</div>
          <div class="kpi-value">{{ summary.rejectedClaims }}</div>
        </mat-card>
      </div>
    </section>

    <section class="row g-3" *ngIf="!loading">
      <div class="col-12 col-xl-8">
      <mat-card class="panel h-100">
        <header>
          <h2>Recent Claims</h2>
          <a routerLink="/claims">View all</a>
        </header>
        <div class="table-wrap" *ngIf="recentClaims.length; else noClaimsTpl">
          <table class="data-table">
            <thead>
              <tr>
                <th>Claim #</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let claim of recentClaims">
                <td>
                  <a [routerLink]="['/claims', claim.id]">{{ claim.claimNumber }}</a>
                </td>
                <td>
                  <span class="status-badge" [ngClass]="'status-' + normalizeStatus(claim.status)">
                    {{ claim.status }}
                  </span>
                </td>
                <td>{{ claim.claimAmount | currency:'INR':'symbol':'1.0-0' }}</td>
                <td>{{ claim.createdAt || claim.incidentDate | date:'mediumDate' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </mat-card>
      </div>

      <div class="col-12 col-xl-4">
      <mat-card class="panel h-100">
        <header>
          <h2>Recent Notifications</h2>
          <a routerLink="/notifications">Open inbox</a>
        </header>
        <ul class="notification-list" *ngIf="recentNotifications.length; else noNotificationsTpl">
          <li *ngFor="let notification of recentNotifications">
            <div class="notification-title">{{ notification.title }}</div>
            <p>{{ notification.message }}</p>
            <time>{{ notification.createdAt | date:'short' }}</time>
          </li>
        </ul>
      </mat-card>
      </div>
    </section>

    <ng-template #loadingTpl>
      <div class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading dashboard data...</p>
      </div>
    </ng-template>

    <ng-template #noClaimsTpl>
      <div class="empty-state">
        <mat-icon class="empty-icon">assignment</mat-icon>
        <h3>No claims yet</h3>
        <p>Create your first claim to start processing.</p>
        <button mat-flat-button color="primary" routerLink="/claims/new" *ngIf="isPolicyholder">
          Submit claim
        </button>
      </div>
    </ng-template>

    <ng-template #noNotificationsTpl>
      <div class="empty-state">
        <mat-icon class="empty-icon">notifications</mat-icon>
        <h3>No recent notifications</h3>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.2rem;
      flex-wrap: wrap;
    }

    .page-header h1 {
      margin: 0;
      font-size: 2rem;
      color: #0f2f47;
    }

    .page-header p {
      margin: 0.4rem 0 0;
      color: var(--text-secondary);
      font-size: 1rem;
    }

    .header-actions {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .kpi-card {
      border: 1px solid #d9e5ed;
      border-radius: 0.95rem;
      box-shadow: 0 8px 20px rgba(16, 50, 75, 0.06);
      background: linear-gradient(165deg, #fbfdff 0%, #f3f8fc 100%);
    }

    .kpi-title {
      color: var(--text-secondary);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .kpi-value {
      margin-top: 0.35rem;
      font-size: 2rem;
      color: #10324b;
      font-weight: 700;
    }

    .panel {
      border-radius: 0.95rem;
      border: 1px solid #d9e5ed;
      overflow: hidden;
      box-shadow: 0 8px 20px rgba(16, 50, 75, 0.06);
    }

    .panel header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.1rem;
      border-bottom: 1px solid var(--border-color);
      background: #f9fbfc;
    }

    .panel header h2 {
      margin: 0;
      font-size: 1.06rem;
    }

    .panel header a {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .table-wrap {
      overflow: auto;
    }

    .data-table td a {
      color: #144d72;
      text-decoration: none;
      font-weight: 600;
    }

    .notification-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .notification-list li {
      padding: 1rem 1.1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .notification-list li:last-child {
      border-bottom: 0;
    }

    .notification-title {
      font-weight: 600;
      margin-bottom: 0.2rem;
      color: #11344f;
    }

    .notification-list p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    time {
      margin-top: 0.35rem;
      display: inline-block;
      color: var(--text-secondary);
      font-size: 0.78rem;
    }

    @media (max-width: 640px) {
      .panel header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class DashboardPageComponent implements OnInit {
  loading = true;
  recentClaims: Claim[] = [];
  recentNotifications: Notification[] = [];

  summary: ClaimStatistics = {
    totalClaims: 0,
    submittedClaims: 0,
    underReviewClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    closedClaims: 0
  };

  constructor(
    public readonly authService: AuthService,
    private readonly claimService: ClaimService,
    private readonly notificationService: NotificationService
  ) {}

  get isPolicyholder(): boolean {
    return this.authService.hasRole('POLICYHOLDER');
  }

  get isAdjuster(): boolean {
    return this.authService.hasRole('ADJUSTER');
  }

  get isManagerOrAdmin(): boolean {
    return this.authService.hasAnyRole(['MANAGER', 'ADMIN']);
  }

  get welcomeLine(): string {
    const displayName = this.authService.currentUser?.firstName || this.authService.currentUser?.username || 'there';
    if (this.isPolicyholder) {
      return `Welcome back, ${displayName}. Track your active claims and updates.`;
    }
    if (this.isAdjuster) {
      return `Welcome back, ${displayName}. Review and process assigned claims.`;
    }
    return `Welcome back, ${displayName}. Monitor portfolio performance and operations.`;
  }

  ngOnInit(): void {
    this.notificationService.loadNotifications();

    forkJoin({
      claims: this.isPolicyholder
        ? this.claimService.getMyClaims().pipe(catchError(() => of([] as Claim[])))
        : this.isAdjuster
          ? this.claimService.getAssignedClaims().pipe(catchError(() => of([] as Claim[])))
          : this.claimService.getClaims(0, 8).pipe(catchError(() => of({ content: [] as Claim[] }))),
      stats: this.isPolicyholder || this.isAdjuster
        ? of(null)
        : this.claimService.getClaimStatistics().pipe(catchError(() => of(null))),
      notifications: this.notificationService.notifications$.pipe(take(1), catchError(() => of([] as Notification[])))
    }).subscribe(result => {
      const claims = Array.isArray(result.claims)
        ? result.claims
        : result.claims.content ?? [];

      const orderedClaims = this.isAdjuster ? this.sortByPriority(claims) : claims;
      this.recentClaims = orderedClaims.slice(0, 8);
      this.recentNotifications = (result.notifications ?? []).slice(0, 6);

      if (this.isPolicyholder || this.isAdjuster) {
        this.summary = this.computePolicyholderSummary(orderedClaims);
      } else if (result.stats) {
        this.summary = result.stats;
      }

      this.loading = false;
    });
  }

  normalizeStatus(status: string): string {
    return status.toLowerCase().replace(/_/g, '-');
  }

  private computePolicyholderSummary(claims: Claim[]): ClaimStatistics {
    const submitted = claims.filter(claim => claim.status === 'SUBMITTED').length;
    const underReview = claims.filter(claim => claim.status === 'UNDER_REVIEW').length;
    const approved = claims.filter(claim => claim.status === 'APPROVED').length;
    const rejected = claims.filter(claim => claim.status === 'REJECTED').length;

    return {
      totalClaims: claims.length,
      submittedClaims: submitted,
      underReviewClaims: underReview,
      approvedClaims: approved,
      rejectedClaims: rejected,
      closedClaims: approved + rejected
    };
  }

  private sortByPriority(claims: Claim[]): Claim[] {
    return [...claims].sort((a, b) => this.priorityScore(b) - this.priorityScore(a));
  }

  private priorityScore(claim: Claim): number {
    const statusWeight = claim.status === 'UNDER_REVIEW' ? 60 : claim.status === 'SUBMITTED' ? 35 : 15;
    const amountWeight = Math.min(25, Math.floor((claim.claimAmount || 0) / 10000));
    const incidentDate = claim.incidentDate || claim.createdAt;
    const ageInDays = incidentDate
      ? Math.max(0, Math.floor((Date.now() - new Date(incidentDate).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    const ageWeight = Math.min(20, ageInDays);
    return statusWeight + amountWeight + ageWeight;
  }
}
