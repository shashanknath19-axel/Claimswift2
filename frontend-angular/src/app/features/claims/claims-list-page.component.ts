import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Claim } from '../../core/models/claim.model';
import { AuthService } from '../../core/services/auth.service';
import { ClaimService } from '../../core/services/claim.service';

@Component({
  selector: 'app-claims-list-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule
  ],
  template: `
    <section class="page-header">
      <div>
        <h1>{{ pageTitle }}</h1>
        <p>{{ pageDescription }}</p>
      </div>
      <div class="header-actions">
        <button mat-flat-button color="primary" routerLink="/claims/new" *ngIf="isPolicyholder">
          <mat-icon>add</mat-icon>
          New Claim
        </button>
      </div>
    </section>

    <mat-card class="claim-card fade-in">
      <div class="toolbar row g-2 align-items-end">
        <form [formGroup]="filterForm" class="filters col-12 col-lg">
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="">All</mat-option>
              <mat-option *ngFor="let status of statuses" [value]="status">{{ status }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Search</mat-label>
            <input matInput formControlName="query" placeholder="Claim #, policy, holder name/phone" />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>From Date</mat-label>
            <input matInput type="date" formControlName="fromDate" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>To Date</mat-label>
            <input matInput type="date" formControlName="toDate" />
          </mat-form-field>
        </form>

        <div class="col-12 col-lg-auto d-flex justify-content-lg-end">
          <button mat-stroked-button (click)="loadClaims()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      </div>

      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="36"></mat-spinner>
        <p>Loading claims...</p>
      </div>

      <div class="empty-state" *ngIf="!loading && !claims.length">
        <mat-icon class="empty-icon">assignment</mat-icon>
        <h3>No claims found</h3>
        <p>Try changing your filters or create a new claim.</p>
      </div>

      <div class="table-wrap" *ngIf="!loading && claims.length">
        <table class="data-table table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Claim #</th>
              <th>Policy #</th>
              <th>Status</th>
              <th *ngIf="isAdjuster">Priority</th>
              <th>Amount</th>
              <th>Incident Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let claim of claims">
              <td>{{ claim.claimNumber }}</td>
              <td>{{ claim.policyNumber }}</td>
              <td>
                <span class="status-badge" [ngClass]="'status-' + statusClass(claim.status)">
                  {{ claim.status }}
                </span>
              </td>
              <td *ngIf="isAdjuster">
                <span class="status-badge" [ngClass]="'status-' + priorityClass(claim)">
                  {{ priorityLabel(claim) }}
                </span>
              </td>
              <td>{{ claim.claimAmount | currency:'INR':'symbol':'1.0-0' }}</td>
              <td>{{ claim.incidentDate | date:'mediumDate' }}</td>
              <td class="action-buttons">
                <button mat-icon-button [routerLink]="['/claims', claim.id]" matTooltip="View details">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/claims', claim.id, 'tracking']" matTooltip="Track claim">
                  <mat-icon>timeline</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/claims', claim.id, 'edit']" matTooltip="Edit claim" *ngIf="isPolicyholder">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/assessment', claim.id]" matTooltip="Open assessment" *ngIf="isAdjusterOrManager">
                  <mat-icon>fact_check</mat-icon>
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

    .page-header h1 {
      margin: 0;
      color: #0f2f47;
      font-size: 1.75rem;
    }

    .page-header p {
      margin: 0.35rem 0 0;
      color: var(--text-secondary);
    }

    .toolbar {
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      margin-bottom: 1rem;
      padding: 0.3rem 0 0.2rem;
    }

    .filters {
      display: grid;
      grid-template-columns: 14rem minmax(14rem, 1fr) 11rem 11rem;
      gap: 0.75rem;
    }

    .table-wrap {
      overflow: auto;
    }

    @media (max-width: 900px) {
      .filters {
        grid-template-columns: 1fr;
        width: 100%;
      }
    }
  `]
})
export class ClaimsListPageComponent implements OnInit {
  loading = false;
  claims: Claim[] = [];
  statuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ADJUSTED', 'PAID'];

  readonly filterForm = this.fb.group({
    status: [''],
    query: [''],
    fromDate: [''],
    toDate: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly claimService: ClaimService
  ) {}

  get isPolicyholder(): boolean {
    return this.authService.hasRole('POLICYHOLDER');
  }

  get isAdjuster(): boolean {
    return this.authService.hasRole('ADJUSTER');
  }

  get isAdjusterOrManager(): boolean {
    return this.authService.hasAnyRole(['ADJUSTER', 'MANAGER', 'ADMIN']);
  }

  get pageTitle(): string {
    if (this.isPolicyholder) {
      return 'My Claims';
    }
    if (this.isAdjuster) {
      return 'Assigned Claims';
    }
    return 'Claim Operations';
  }

  get pageDescription(): string {
    if (this.isPolicyholder) {
      return 'Track your submissions and claim progress.';
    }
    if (this.isAdjuster) {
      return 'Review and process claims assigned to you, sorted by priority.';
    }
    return 'Search, triage, and oversee claim records.';
  }

  ngOnInit(): void {
    this.filterForm.controls.query.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe(() => this.loadClaims());

    this.filterForm.controls.status.valueChanges.subscribe(() => this.loadClaims());
    this.filterForm.controls.fromDate.valueChanges.subscribe(() => this.loadClaims());
    this.filterForm.controls.toDate.valueChanges.subscribe(() => this.loadClaims());
    this.loadClaims();
  }

  loadClaims(): void {
    this.loading = true;

    const query = this.filterForm.controls.query.value?.trim() ?? '';
    const status = this.filterForm.controls.status.value ?? '';
    const fromDate = this.filterForm.controls.fromDate.value ?? '';
    const toDate = this.filterForm.controls.toDate.value ?? '';
    const normalizedQuery = query.toLowerCase();

    if (this.isPolicyholder && (query || status || fromDate || toDate)) {
      this.claimService.searchMyClaims({
        query,
        status,
        fromDate,
        toDate
      })
        .pipe(finalize(() => { this.loading = false; }))
        .subscribe(claims => { this.claims = this.sortClaimsForRole(claims); });
      return;
    }

    if (query) {
      const currentUserId = this.authService.currentUser?.id;
      const applyFilters = (claims: Claim[], applyQueryFilter: boolean = false): void => {
        let filtered = claims;
        if (status) {
          filtered = filtered.filter(claim => claim.status === status);
        }
        if (fromDate) {
          filtered = filtered.filter(claim => (claim.incidentDate ?? '') >= fromDate);
        }
        if (toDate) {
          filtered = filtered.filter(claim => (claim.incidentDate ?? '') <= toDate);
        }
        if (applyQueryFilter) {
          filtered = filtered.filter(claim => this.matchesClaimQuery(claim, normalizedQuery));
        }
        if (this.isAdjuster && currentUserId) {
          filtered = filtered.filter(claim => claim.assignedAdjusterId === currentUserId);
        }
        this.claims = this.sortClaimsForRole(filtered);
      };

      const isClaimNumberQuery = /^CLM[-A-Z0-9]+$/i.test(query);
      if (isClaimNumberQuery) {
        this.claimService.getClaimByNumber(query)
          .pipe(finalize(() => { this.loading = false; }))
          .subscribe({
            next: claim => applyFilters(claim ? [claim] : []),
            error: () => {
              this.claimService.searchClaims(query)
                .pipe(finalize(() => { this.loading = false; }))
                .subscribe(claims => applyFilters(claims));
            }
          });
        return;
      }

      this.claimService.searchClaims(query)
        .pipe(finalize(() => { this.loading = false; }))
        .subscribe(claims => applyFilters(claims));
      return;
    }

    if (this.isPolicyholder) {
      this.claimService.searchMyClaims({
        status,
        fromDate,
        toDate
      })
        .pipe(finalize(() => { this.loading = false; }))
        .subscribe(claims => {
          this.claims = this.sortClaimsForRole(claims);
        });
      return;
    }

    if (this.isAdjuster) {
      this.claimService.getAssignedClaims()
        .pipe(finalize(() => { this.loading = false; }))
        .subscribe(claims => {
          const filtered = status ? claims.filter(claim => claim.status === status) : claims;
          this.claims = this.sortClaimsForRole(filtered);
        });
      return;
    }

    if (status) {
      this.claimService.getClaimsByStatus(status)
        .pipe(finalize(() => { this.loading = false; }))
        .subscribe(claims => { this.claims = this.sortClaimsForRole(claims); });
      return;
    }

    this.claimService.getClaims(0, 100)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(page => {
        this.claims = this.sortClaimsForRole(page.content ?? []);
      });
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace(/_/g, '-');
  }

  priorityLabel(claim: Claim): 'HIGH' | 'MEDIUM' | 'LOW' {
    const score = this.priorityScore(claim);
    if (score >= 90) {
      return 'HIGH';
    }
    if (score >= 45) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  priorityClass(claim: Claim): string {
    const priority = this.priorityLabel(claim);
    if (priority === 'HIGH') {
      return 'rejected';
    }
    if (priority === 'MEDIUM') {
      return 'under-review';
    }
    return 'approved';
  }

  private sortClaimsForRole(claims: Claim[]): Claim[] {
    if (!this.isAdjuster) {
      return claims;
    }
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

  private matchesClaimQuery(claim: Claim, normalizedQuery: string): boolean {
    const searchFields = [
      String(claim.id),
      claim.claimNumber,
      claim.policyNumber,
      claim.vehicleRegistration,
      claim.vehicleRegistrationNumber,
      claim.policyholderName,
      claim.policyholderPhone,
      claim.vehicleMake,
      claim.vehicleModel,
      claim.incidentLocation,
      claim.incidentDescription,
      claim.description,
      claim.status
    ];

    return searchFields
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .some(value => value.toLowerCase().includes(normalizedQuery));
  }
}
