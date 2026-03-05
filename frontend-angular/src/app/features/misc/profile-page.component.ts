import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <section class="page-header">
      <h1>Profile</h1>
      <p>Signed-in user identity and role data.</p>
    </section>

    <mat-card class="claim-card fade-in">
      <div class="card-header"><h2>User Information</h2></div>
      <div class="card-body detail-grid" *ngIf="authService.currentUser as user">
        <div><span class="label">Username</span><div>{{ user.username }}</div></div>
        <div><span class="label">Email</span><div>{{ user.email }}</div></div>
        <div><span class="label">Name</span><div>{{ user.firstName }} {{ user.lastName }}</div></div>
        <div><span class="label">Roles</span><div>{{ user.roles.join(', ') }}</div></div>
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

    .detail-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .label {
      display: block;
      color: var(--text-secondary);
      font-size: 0.75rem;
      text-transform: uppercase;
      margin-bottom: 0.2rem;
      letter-spacing: 0.07em;
    }

    @media (max-width: 768px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfilePageComponent {
  constructor(public readonly authService: AuthService) {}
}

