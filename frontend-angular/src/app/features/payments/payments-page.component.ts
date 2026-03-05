import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-payments-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <section class="page-header">
      <h1>Payments</h1>
      <p>Track processed and pending payout records.</p>
    </section>

    <mat-card class="claim-card fade-in">
      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="36"></mat-spinner>
        <p>Loading payment records...</p>
      </div>

      <div class="empty-state" *ngIf="!loading && !payments.length">
        <mat-icon class="empty-icon">payments</mat-icon>
        <h3>No payments available</h3>
      </div>

      <div class="table-wrap" *ngIf="!loading && payments.length">
        <table class="data-table table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Claim ID</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let payment of payments">
              <td>{{ payment.id }}</td>
              <td>{{ payment.claimId }}</td>
              <td>
                <span class="status-badge" [ngClass]="'status-' + statusClass(payment.status)">
                  {{ payment.status }}
                </span>
              </td>
              <td>{{ payment.amountLabel }}</td>
              <td>{{ payment.method }}</td>
              <td>{{ payment.updatedAtLabel }}</td>
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

    .table-wrap {
      overflow: auto;
    }
  `]
})
export class PaymentsPageComponent implements OnInit {
  loading = false;
  payments: PaymentViewModel[] = [];

  constructor(private readonly paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loading = true;
    this.paymentService.getInternalAll(true).subscribe(payments => {
      this.payments = payments.map((payment, index) => this.mapPayment(payment, index));
      this.loading = false;
    });
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace(/_/g, '-');
  }

  private mapPayment(payment: unknown, index: number): PaymentViewModel {
    const data = this.asRecord(payment);
    const id = this.readValue(data, ['id', 'paymentId', 'transactionId']) ?? `#${index + 1}`;
    const claimId = this.readValue(data, ['claimId', 'claim_id']) ?? '-';
    const status = String(this.readValue(data, ['status', 'paymentStatus']) ?? 'UNKNOWN').toUpperCase();
    const method = String(this.readValue(data, ['method', 'paymentMethod', 'mode']) ?? '-');
    const amount = this.readNumber(data, ['amount', 'paidAmount', 'paymentAmount']);
    const updatedAt = this.readValue(data, ['updatedAt', 'processedAt', 'paidAt', 'createdAt']);

    return {
      id: String(id),
      claimId: String(claimId),
      status,
      method,
      amountLabel: amount !== null ? this.formatCurrency(amount) : '-',
      updatedAtLabel: updatedAt ? this.formatDate(updatedAt) : '-'
    };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private readValue(data: Record<string, unknown>, keys: string[]): unknown {
    for (const key of keys) {
      if (data[key] !== undefined && data[key] !== null) {
        return data[key];
      }
    }
    return null;
  }

  private readNumber(data: Record<string, unknown>, keys: string[]): number | null {
    const value = this.readValue(data, keys);
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  private formatDate(value: unknown): string {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

interface PaymentViewModel {
  id: string;
  claimId: string;
  status: string;
  amountLabel: string;
  method: string;
  updatedAtLabel: string;
}
