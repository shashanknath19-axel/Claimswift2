import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Claim } from '../../core/models/claim.model';
import { Document } from '../../core/models/document.model';
import { ClaimService } from '../../core/services/claim.service';
import { DocumentService } from '../../core/services/document.service';
import { PaymentService } from '../../core/services/payment.service';
import { AssessmentService } from '../../core/services/assessment.service';
import { NotificationService } from '../../core/services/notification.service';

interface TimelineEntry {
  title: string;
  completed: boolean;
  description: string;
}

@Component({
  selector: 'app-claim-tracking-page',
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
    <section class="page-header" *ngIf="claim">
      <div>
        <h1>Tracking {{ claim.claimNumber }}</h1>
        <p>End-to-end claim lifecycle visibility.</p>
      </div>
      <button mat-stroked-button [routerLink]="['/claims', claim.id]">
        <mat-icon>arrow_back</mat-icon>
        Back to claim
      </button>
    </section>

    <div class="loading-container" *ngIf="loading">
      <mat-spinner diameter="40"></mat-spinner>
      <p>Loading claim timeline...</p>
    </div>

    <div class="empty-state" *ngIf="!loading && loadError">
      <mat-icon class="empty-icon">error</mat-icon>
      <h3>Unable to load claim tracking</h3>
      <p>{{ loadError }}</p>
      <button mat-stroked-button routerLink="/claims">Back to claims</button>
    </div>

    <ng-container *ngIf="!loading && claim">
      <section class="summary-grid">
        <mat-card class="kpi-card">
          <div class="kpi-title">Current Status</div>
          <span class="status-badge" [ngClass]="'status-' + statusClass(claim.status)">{{ claim.status }}</span>
        </mat-card>
        <mat-card class="kpi-card">
          <div class="kpi-title">Documents</div>
          <div class="kpi-value">{{ documents.length }}</div>
        </mat-card>
        <mat-card class="kpi-card">
          <div class="kpi-title">Assessment</div>
          <div class="kpi-value">{{ assessment ? 'Done' : 'Pending' }}</div>
        </mat-card>
        <mat-card class="kpi-card">
          <div class="kpi-title">Payments</div>
          <div class="kpi-value">{{ payments.length }}</div>
        </mat-card>
      </section>

      <mat-card class="claim-card">
        <div class="card-header">
          <h2>Timeline</h2>
        </div>
        <div class="card-body">
          <div class="claim-timeline">
            <div class="timeline-item" [ngClass]="item.completed ? 'completed' : 'pending'" *ngFor="let item of timeline">
              <div class="timeline-title">{{ item.title }}</div>
              <div class="timeline-description">{{ item.description }}</div>
            </div>
          </div>
        </div>
      </mat-card>

      <section class="detail-grid">
        <mat-card class="claim-card">
          <div class="card-header"><h2>Documents</h2></div>
          <div class="card-body">
            <div *ngIf="documents.length; else noDocTpl">
              <div class="row-line" *ngFor="let doc of documents">
                <span>{{ doc.originalFileName || doc.fileName }}</span>
                <span class="type">{{ doc.documentType }}</span>
              </div>
            </div>
          </div>
        </mat-card>

        <mat-card class="claim-card">
          <div class="card-header"><h2>Payments</h2></div>
          <div class="card-body">
            <div *ngIf="payments.length; else noPaymentTpl">
              <div class="row-line" *ngFor="let payment of payments; let i = index">
                <span>Transaction {{ i + 1 }}</span>
                <span class="type">{{ payment | json }}</span>
              </div>
            </div>
          </div>
        </mat-card>
      </section>
    </ng-container>

    <ng-template #noDocTpl>
      <div class="empty-state compact">
        <mat-icon class="empty-icon">description</mat-icon>
        <h3>No documents yet</h3>
      </div>
    </ng-template>

    <ng-template #noPaymentTpl>
      <div class="empty-state compact">
        <mat-icon class="empty-icon">payments</mat-icon>
        <h3>No payments yet</h3>
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
      margin-top: 0.35rem;
      font-size: 1.2rem;
      font-weight: 700;
      color: #10324b;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.8rem;
      margin-top: 0.8rem;
    }

    .row-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid var(--border-color);
      padding: 0.6rem 0;
    }

    .type {
      color: var(--text-secondary);
      font-size: 0.85rem;
      max-width: 50%;
      overflow-wrap: anywhere;
      text-align: right;
    }

    .compact {
      padding: 1rem 0;
    }

    @media (max-width: 1100px) {
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
export class ClaimTrackingPageComponent implements OnInit, OnDestroy {
  loading = true;
  loadError: string | null = null;
  claim: Claim | null = null;
  documents: Document[] = [];
  payments: unknown[] = [];
  assessment: unknown = null;
  timeline: TimelineEntry[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly claimService: ClaimService,
    private readonly documentService: DocumentService,
    private readonly paymentService: PaymentService,
    private readonly assessmentService: AssessmentService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const claimId = Number(this.route.snapshot.paramMap.get('id'));
    if (!claimId) {
      this.loading = false;
      return;
    }

    this.loadTracking(claimId, true);

    this.notificationService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        if (notification.claimId === claimId) {
          this.loadTracking(claimId, false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace(/_/g, '-');
  }

  private buildTimeline(
    status: string,
    documentCount: number,
    assessment: unknown,
    paymentCount: number
  ): TimelineEntry[] {
    const order = ['SUBMITTED', 'UNDER_REVIEW', 'ADJUSTED', 'APPROVED', 'REJECTED', 'PAID'];
    const statusIndex = order.indexOf(status);
    const isPaid = paymentCount > 0 || status === 'PAID';

    return [
      {
        title: 'Claim Submitted',
        completed: statusIndex >= 0,
        description: 'Policyholder submitted the claim request.'
      },
      {
        title: 'Documents Uploaded',
        completed: documentCount > 0,
        description: documentCount > 0 ? `${documentCount} document(s) attached.` : 'Awaiting supporting documents.'
      },
      {
        title: 'Assessment',
        completed: !!assessment || statusIndex >= 1,
        description: assessment ? 'Assessment record exists.' : 'Assessment pending.'
      },
      {
        title: 'Decision',
        completed: ['APPROVED', 'REJECTED', 'ADJUSTED', 'PAID'].includes(status),
        description: `Current status: ${status}`
      },
      {
        title: 'Payment',
        completed: isPaid,
        description: isPaid ? 'Payment activity recorded.' : 'Payment has not been processed.'
      }
    ];
  }

  private loadTracking(claimId: number, withLoading: boolean): void {
    if (withLoading) {
      this.loading = true;
    }

    this.claimService.getClaimById(claimId, true)
      .pipe(catchError(() => of(null)))
      .subscribe(claim => {
        if (!claim) {
          this.loadError = 'The claim could not be loaded right now. Please try again.';
          this.loading = false;
          return;
        }

        this.claim = claim;
        this.loadError = null;

        forkJoin({
          documents: this.documentService.getDocumentsByClaim(claim.id, true).pipe(catchError(() => of([] as Document[]))),
          payments: this.paymentService.getByClaimId(claim.id, true).pipe(catchError(() => of([] as unknown[]))),
          assessment: this.assessmentService.getByClaimId(claim.id, true).pipe(catchError(() => of(null)))
        })
          .pipe(finalize(() => { this.loading = false; }))
          .subscribe(result => {
            this.documents = result.documents;
            this.payments = result.payments;
            this.assessment = result.assessment;
            this.timeline = this.buildTimeline(claim.status, this.documents.length, this.assessment, this.payments.length);
          });
      });
  }
}
