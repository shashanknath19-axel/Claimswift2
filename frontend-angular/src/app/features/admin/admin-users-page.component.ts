import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <section class="page-header">
      <div>
        <h1>User & Role Governance</h1>
        <p>Role policy reference for secure access control.</p>
      </div>
      <button mat-flat-button color="primary" routerLink="/register">
        <mat-icon>person_add</mat-icon>
        Register User
      </button>
    </section>

    <section class="grid">
      <mat-card class="claim-card">
        <div class="card-header"><h2>Role Matrix</h2></div>
        <div class="card-body">
          <table class="data-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Access Scope</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>POLICYHOLDER</td>
                <td>Create claims, upload documents, track own claims, receive notifications.</td>
              </tr>
              <tr>
                <td>ADJUSTER</td>
                <td>Assess assigned claims, update statuses, monitor operational reports.</td>
              </tr>
              <tr>
                <td>MANAGER</td>
                <td>Assign claims, approve/reject, oversee reporting and operations.</td>
              </tr>
              <tr>
                <td>ADMIN</td>
                <td>System-level governance and broad role access.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </mat-card>

      <mat-card class="claim-card">
        <div class="card-header"><h2>Current Implementation Notes</h2></div>
        <div class="card-body">
          <p>
            Backend currently exposes registration and authentication APIs.
            Dedicated user CRUD APIs are not part of this build yet, so user management
            is performed through registration + role-based access checks.
          </p>
          <div class="card-actions">
            <button mat-stroked-button routerLink="/dashboard">Back to dashboard</button>
          </div>
        </div>
      </mat-card>
    </section>
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

    .grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 0.8rem;
    }

    @media (max-width: 900px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminUsersPageComponent {}

