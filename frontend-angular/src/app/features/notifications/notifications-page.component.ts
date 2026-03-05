import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { Notification } from '../../core/models/notification.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <section class="page-header">
      <div>
        <h1>Notifications</h1>
        <p>Stay updated with claim, assessment, and payment events.</p>
      </div>
      <div class="header-actions">
        <button mat-flat-button color="primary" (click)="markAllRead()" [disabled]="!unreadCount">
          <mat-icon>done_all</mat-icon>
          Mark all read
        </button>
      </div>
    </section>

    <mat-card class="claim-card fade-in">
      <div class="meta">
        <span>Unread: {{ unreadCount }}</span>
      </div>

      <div class="empty-state" *ngIf="!notifications.length">
        <mat-icon class="empty-icon">notifications</mat-icon>
        <h3>No notifications yet</h3>
      </div>

      <ul class="notification-list" *ngIf="notifications.length">
        <li [class.unread]="!notification.isRead" *ngFor="let notification of notifications">
          <div class="title-row">
            <h3>{{ notification.title }}</h3>
            <span class="badge" *ngIf="!notification.isRead">NEW</span>
          </div>
          <p>{{ notification.message }}</p>
          <footer>
            <time>{{ notification.createdAt | date:'medium' }}</time>
            <div class="actions">
              <button mat-button [routerLink]="notification.actionUrl" *ngIf="notification.actionUrl">Open</button>
              <button mat-button (click)="markRead(notification)" *ngIf="!notification.isRead">Mark read</button>
              <button mat-button color="warn" (click)="remove(notification.id)">Delete</button>
            </div>
          </footer>
        </li>
      </ul>
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

    h1 {
      margin: 0;
      color: #0f2f47;
      font-size: 1.75rem;
    }

    .page-header p {
      margin: 0.35rem 0 0;
      color: var(--text-secondary);
    }

    .header-actions {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .meta {
      margin-bottom: 0.8rem;
      color: var(--text-secondary);
      font-size: 0.92rem;
    }

    .notification-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .notification-list li {
      border: 1px solid var(--border-color);
      border-radius: 0.8rem;
      padding: 1rem;
      margin-bottom: 0.8rem;
      background: #fcfeff;
    }

    .notification-list li.unread {
      border-left: 4px solid #1c7bd5;
      background: #f3f9ff;
    }

    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .title-row h3 {
      margin: 0;
      color: #10324b;
      font-size: 1.02rem;
    }

    .badge {
      background: #1c7bd5;
      color: #fff;
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      padding: 0.2rem 0.45rem;
      border-radius: 999px;
      font-weight: 600;
    }

    p {
      margin: 0.5rem 0;
      color: var(--text-secondary);
    }

    footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    time {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .actions {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
  `]
})
export class NotificationsPageComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount = 0;

  constructor(private readonly notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.loadNotifications();
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.unreadCount = notifications.filter(notification => !notification.isRead).length;
    });
  }

  markRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id).subscribe();
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  remove(notificationId: number): void {
    this.notificationService.deleteNotification(notificationId).subscribe();
  }
}
