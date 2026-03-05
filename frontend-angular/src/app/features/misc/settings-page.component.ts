import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatSlideToggleModule],
  template: `
    <section class="page-header">
      <h1>Settings</h1>
      <p>Preference controls for local session behavior.</p>
    </section>

    <mat-card class="claim-card fade-in">
      <div class="card-header"><h2>Notification Preferences</h2></div>
      <div class="card-body settings-grid d-grid gap-3">
        <mat-slide-toggle [(ngModel)]="settings.claimUpdates">Claim updates</mat-slide-toggle>
        <mat-slide-toggle [(ngModel)]="settings.documentUpdates">Document updates</mat-slide-toggle>
        <mat-slide-toggle [(ngModel)]="settings.paymentUpdates">Payment updates</mat-slide-toggle>
      </div>
      <div class="card-actions">
        <button mat-flat-button color="primary" (click)="save()">Save Preferences</button>
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

    .settings-grid {
      display: grid;
      gap: 0.8rem;
    }
  `]
})
export class SettingsPageComponent {
  settings = {
    claimUpdates: true,
    documentUpdates: true,
    paymentUpdates: true
  };

  save(): void {
    localStorage.setItem('claimswift_ui_settings', JSON.stringify(this.settings));
  }
}
