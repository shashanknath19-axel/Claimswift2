import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ReportingService } from '../../core/services/reporting.service';

@Component({
  selector: 'app-reports-page',
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
        <h1>Reports</h1>
        <p>Operational and financial insight across claim lifecycle.</p>
      </div>
    </section>

    <mat-card class="claim-card fade-in">
      <form [formGroup]="form" class="toolbar row g-2 align-items-end" (ngSubmit)="loadReports()">
        <div class="col-12 col-md-4">
          <mat-form-field appearance="outline">
            <mat-label>Start Date</mat-label>
            <input matInput type="date" formControlName="startDate" />
          </mat-form-field>
        </div>

        <div class="col-12 col-md-4">
          <mat-form-field appearance="outline">
            <mat-label>End Date</mat-label>
            <input matInput type="date" formControlName="endDate" />
          </mat-form-field>
        </div>

        <div class="col-12 col-md-auto d-flex justify-content-md-end">
          <button mat-flat-button color="primary" type="submit">
            <mat-icon>bar_chart</mat-icon>
            Load Reports
          </button>
        </div>
      </form>
    </mat-card>

    <div class="loading-container" *ngIf="loading">
      <mat-spinner diameter="38"></mat-spinner>
      <p>Loading reports...</p>
    </div>

    <section class="row g-3 mt-1" *ngIf="!loading">
      <div class="col-12 col-xl-6">
      <mat-card class="claim-card h-100">
        <div class="card-header"><h2>Claim Summary</h2></div>
        <div class="card-body">
          <div class="metric-grid" *ngIf="claimSummaryMetrics.length; else claimSummaryRawTpl">
            <div class="metric" *ngFor="let metric of claimSummaryMetrics">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
            </div>
          </div>
          <ng-template #claimSummaryRawTpl>
            <p class="placeholder">No structured claim summary returned.</p>
          </ng-template>
        </div>
      </mat-card>
      </div>

      <div class="col-12 col-xl-6">
      <mat-card class="claim-card h-100">
        <div class="card-header"><h2>Payment Summary</h2></div>
        <div class="card-body">
          <div class="metric-grid" *ngIf="paymentSummaryMetrics.length; else paymentSummaryRawTpl">
            <div class="metric" *ngFor="let metric of paymentSummaryMetrics">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
            </div>
          </div>
          <ng-template #paymentSummaryRawTpl>
            <p class="placeholder">No structured payment summary returned.</p>
          </ng-template>
        </div>
      </mat-card>
      </div>

      <div class="col-12">
      <mat-card class="claim-card">
        <div class="card-header"><h2>Adjuster Performance</h2></div>
        <div class="card-body">
          <div class="table-wrap" *ngIf="adjusterPerformanceRows.length">
            <table class="data-table table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th *ngFor="let column of adjusterPerformanceColumns">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of adjusterPerformanceRows">
                  <td *ngFor="let column of adjusterPerformanceColumns">{{ row[column] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="placeholder" *ngIf="!adjusterPerformanceRows.length">No adjuster performance rows returned.</p>
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

    .toolbar {
      display: flex;
      gap: 0.8rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    pre {
      white-space: pre-wrap;
      margin: 0;
      font-size: 0.84rem;
      color: #16374f;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.7rem;
    }

    .metric {
      border: 1px solid var(--border-color);
      border-radius: 0.7rem;
      padding: 0.7rem;
      background: #f9fcff;
    }

    .metric span {
      display: block;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-secondary);
      font-size: 0.74rem;
      margin-bottom: 0.2rem;
    }

    .metric strong {
      color: #113752;
      font-size: 1rem;
      overflow-wrap: anywhere;
    }

    .table-wrap {
      overflow: auto;
    }

    .placeholder {
      margin: 0;
      color: var(--text-secondary);
    }

    @media (max-width: 960px) {
      .metric-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ReportsPageComponent implements OnInit {
  loading = false;
  claimSummaryMetrics: MetricItem[] = [];
  paymentSummaryMetrics: MetricItem[] = [];
  adjusterPerformanceColumns: string[] = [];
  adjusterPerformanceRows: ReportRow[] = [];

  readonly form = this.fb.group({
    startDate: [''],
    endDate: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly reportingService: ReportingService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    const startDate = this.form.controls.startDate.value || undefined;
    const endDate = this.form.controls.endDate.value || undefined;

    this.loading = true;
    forkJoin({
      claimSummary: this.reportingService.getClaimSummary(startDate, endDate).pipe(catchError(() => of(null))),
      paymentSummary: this.reportingService.getPaymentSummary(startDate, endDate).pipe(catchError(() => of(null))),
      adjusterPerformance: this.reportingService.getAdjusterPerformance(startDate, endDate).pipe(catchError(() => of(null)))
    })
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(result => {
        this.claimSummaryMetrics = this.toMetricItems(result.claimSummary);
        this.paymentSummaryMetrics = this.toMetricItems(result.paymentSummary);

        const rows = this.toRows(result.adjusterPerformance);
        this.adjusterPerformanceRows = rows;
        this.adjusterPerformanceColumns = rows.length ? Object.keys(rows[0]) : [];
      });
  }

  private toMetricItems(payload: unknown): MetricItem[] {
    if (!this.isRecord(payload)) {
      return [];
    }

    return Object.entries(payload)
      .filter(([, value]) => typeof value !== 'object' || value === null)
      .map(([key, value]) => ({
        label: this.toTitleCase(key),
        value: String(value ?? '-')
      }));
  }

  private toRows(payload: unknown): ReportRow[] {
    if (Array.isArray(payload)) {
      return payload
        .filter(item => this.isRecord(item))
        .map(item => this.normalizeRow(item as Record<string, unknown>));
    }

    if (this.isRecord(payload)) {
      const firstArray = Object.values(payload).find(value => Array.isArray(value));
      if (Array.isArray(firstArray)) {
        return firstArray
          .filter(item => this.isRecord(item))
          .map(item => this.normalizeRow(item as Record<string, unknown>));
      }

      return [this.normalizeRow(payload)];
    }

    return [];
  }

  private normalizeRow(row: Record<string, unknown>): ReportRow {
    const output: ReportRow = {};
    for (const [key, value] of Object.entries(row)) {
      output[this.toTitleCase(key)] = this.stringifyValue(value);
    }
    return output;
  }

  private stringifyValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return JSON.stringify(value);
  }

  private toTitleCase(key: string): string {
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }
}

interface MetricItem {
  label: string;
  value: string;
}

type ReportRow = Record<string, string>;
