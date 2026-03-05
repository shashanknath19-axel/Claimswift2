import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-unauthorized-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <section class="center-wrap">
      <mat-card class="claim-card">
        <div class="center-content">
          <mat-icon class="icon">lock</mat-icon>
          <h1>Unauthorized</h1>
          <p>You do not have permission to access this page.</p>
          <button mat-flat-button color="primary" routerLink="/dashboard">Back to dashboard</button>
        </div>
      </mat-card>
    </section>
  `,
  styles: [`
    .center-wrap {
      min-height: calc(100vh - 12rem);
      display: grid;
      place-items: center;
    }

    .center-content {
      text-align: center;
      padding: 2rem;
    }

    .icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #b53e3e;
    }
  `]
})
export class UnauthorizedPageComponent {}

