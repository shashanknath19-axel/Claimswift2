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
      <div class="card-body detail-grid row g-3" *ngIf="authService.currentUser as user">
        <div class="col-12 col-md-6"><span class="label">Username</span><div>{{ user.username }}</div></div>
        <div class="col-12 col-md-6"><span class="label">Email</span><div>{{ user.email }}</div></div>
        <div class="col-12 col-md-6"><span class="label">Name</span><div>{{ user.firstName }} {{ user.lastName }}</div></div>
        <div class="col-12 col-md-6"><span class="label">Roles</span><div>{{ user.roles.join(', ') }}</div></div>
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

    .label {
      display: block;
      color: var(--text-secondary);
      font-size: 0.75rem;
      text-transform: uppercase;
      margin-bottom: 0.2rem;
      letter-spacing: 0.07em;
    }

  `]
})
export class ProfilePageComponent {
  constructor(public readonly authService: AuthService) {}
}
