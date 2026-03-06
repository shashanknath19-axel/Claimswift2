import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AdjusterPerformanceReport, ClaimSummaryReport, PaymentReport } from '../../core/models/report.models';
import { ReportsApiService } from '../../core/services/reports-api.service';
import { toUserErrorMessage } from '../../core/utils/error-message.util';
import { ShellCardComponent } from '../../ui/shell-card/shell-card.component';
import { StatTileComponent } from '../../ui/stat-tile/stat-tile.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    DecimalPipe,
    DatePipe,
    ShellCardComponent,
    StatTileComponent
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent {
  readonly filterForm = this.fb.nonNullable.group({
    startDate: [''],
    endDate: ['']
  });

  claimSummary: ClaimSummaryReport | null = null;
  paymentReport: PaymentReport | null = null;
  adjusterPerformance: AdjusterPerformanceReport | null = null;
  isLoading = false;
  error = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly reportsApiService: ReportsApiService
  ) {}

  loadReports(): void {
    const { startDate, endDate } = this.filterForm.getRawValue();
    this.isLoading = true;
    this.error = '';

    this.reportsApiService.getClaimSummary(startDate, endDate).subscribe({
      next: (claimSummaryResponse) => {
        this.claimSummary = claimSummaryResponse.data;
        this.reportsApiService.getPaymentReport(startDate, endDate).subscribe({
          next: (paymentResponse) => {
            this.paymentReport = paymentResponse.data;
            this.reportsApiService.getAdjusterPerformance(startDate, endDate).subscribe({
              next: (adjusterResponse) => {
                this.adjusterPerformance = adjusterResponse.data;
                this.isLoading = false;
              },
              error: (error) => this.handleError(error)
            });
          },
          error: (error) => this.handleError(error)
        });
      },
      error: (error) => this.handleError(error)
    });
  }

  private handleError(error: unknown): void {
    this.error = toUserErrorMessage(
      error,
      'Unable to generate reports for the selected date range.',
      'Please verify the selected dates and try again.'
    );
    this.isLoading = false;
  }
}
