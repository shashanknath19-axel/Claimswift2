import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { User } from './core/models/user.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="app-container" [class.authenticated]="isAuthenticated">
      <!-- Header -->
      <mat-toolbar color="primary" class="app-header navbar" *ngIf="isAuthenticated">
        <button mat-icon-button (click)="toggleSidenav()" class="menu-button">
          <mat-icon>menu</mat-icon>
        </button>
        
        <span class="app-title navbar-brand mb-0">
          <mat-icon class="app-logo">directions_car</mat-icon>
          ClaimSwift
        </span>
        
        <span class="spacer"></span>
        
        <!-- WebSocket Status -->
        <div class="connection-status" [class]="connectionStatus" *ngIf="isAuthenticated">
          <span *ngIf="connectionStatus === 'connected'">Online</span>
          <span *ngIf="connectionStatus === 'disconnected'">Offline</span>
          <span *ngIf="connectionStatus === 'connecting'">Connecting...</span>
        </div>
        
        <!-- Notifications -->
        <button mat-icon-button class="icon-action" [matBadge]="unreadNotifications" matBadgeColor="warn" 
                matBadgeSize="small" [matBadgeHidden]="unreadNotifications === 0"
                routerLink="/notifications" matTooltip="Notifications">
          <mat-icon>notifications</mat-icon>
        </button>
        
        <!-- User Menu -->
        <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu-button">
          <mat-icon>account_circle</mat-icon>
          <span class="role-chip">{{ primaryRoleLabel }}</span>
          <span class="username">{{ currentUser?.username }}</span>
          <mat-icon>expand_more</mat-icon>
        </button>
        
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon>
            <span>Profile</span>
          </button>
          <button mat-menu-item routerLink="/settings">
            <mat-icon>settings</mat-icon>
            <span>Settings</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </mat-toolbar>

      <mat-sidenav-container class="sidenav-container" [class.with-header]="isAuthenticated">
        <!-- Sidebar Navigation -->
        <mat-sidenav
          [mode]="isMobile ? 'over' : 'side'"
          [opened]="sidenavOpened"
          class="app-sidenav"
          *ngIf="isAuthenticated"
        >
        <mat-nav-list>
            <div class="nav-section-label">Workspace</div>
            <a mat-list-item routerLink="/dashboard" routerLinkActive="active" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Dashboard</span>
            </a>
            
            <a mat-list-item routerLink="/claims" routerLinkActive="active" *ngIf="isPolicyholder" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>assignment</mat-icon>
              <span matListItemTitle>My Claims</span>
            </a>

            <a mat-list-item routerLink="/claims/history" routerLinkActive="active" *ngIf="isPolicyholder" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>history</mat-icon>
              <span matListItemTitle>Claim History</span>
            </a>

            <a mat-list-item routerLink="/claims" routerLinkActive="active" *ngIf="isAdjuster" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>task</mat-icon>
              <span matListItemTitle>Assigned Claims</span>
            </a>

            <a mat-list-item routerLink="/claims" routerLinkActive="active" *ngIf="isManager || isAdmin" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>inventory</mat-icon>
              <span matListItemTitle>All Claims</span>
            </a>
            
            <a mat-list-item routerLink="/claims/new" routerLinkActive="active" *ngIf="isPolicyholder" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>add_circle</mat-icon>
              <span matListItemTitle>New Claim</span>
            </a>
            
            <a mat-list-item routerLink="/documents" routerLinkActive="active" *ngIf="isPolicyholder" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>folder</mat-icon>
              <span matListItemTitle>Documents</span>
            </a>

            <a mat-list-item routerLink="/documents/upload" routerLinkActive="active" *ngIf="isPolicyholder" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>upload_file</mat-icon>
              <span matListItemTitle>Upload</span>
            </a>
            
            <mat-divider></mat-divider>
            <div class="nav-section-label">Inbox</div>
            
            <a mat-list-item routerLink="/notifications" routerLinkActive="active" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>notifications</mat-icon>
              <span matListItemTitle>Notifications</span>
              <span class="nav-unread-count" *ngIf="unreadNotifications > 0">{{ unreadNotifications }}</span>
            </a>
            
            <mat-divider *ngIf="isOpsUser"></mat-divider>
            <div class="nav-section-label" *ngIf="isOpsUser">Operations</div>
            
            <a mat-list-item routerLink="/admin/dashboard" routerLinkActive="active" *ngIf="isManagerOrAdmin" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
              <span matListItemTitle>Admin Dashboard</span>
            </a>

            <a mat-list-item routerLink="/admin/claims" routerLinkActive="active" *ngIf="isAdjuster" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>fact_check</mat-icon>
              <span matListItemTitle>Assessment Queue</span>
            </a>

            <a mat-list-item routerLink="/admin/claims" routerLinkActive="active" *ngIf="isManagerOrAdmin" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>rule</mat-icon>
              <span matListItemTitle>Claim Ops</span>
            </a>
            
            <a mat-list-item routerLink="/reports" routerLinkActive="active" *ngIf="isManagerOrAdmin" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>assessment</mat-icon>
              <span matListItemTitle>Reports</span>
            </a>

            <a mat-list-item routerLink="/payments" routerLinkActive="active" *ngIf="isManagerOrAdmin" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>payments</mat-icon>
              <span matListItemTitle>Payments</span>
            </a>
            
            <mat-divider *ngIf="isAdmin"></mat-divider>
            
            <a mat-list-item routerLink="/admin/users" routerLinkActive="active" *ngIf="isAdmin" (click)="onNavItemClick()">
              <mat-icon matListItemIcon>people</mat-icon>
              <span matListItemTitle>User Management</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>

        <!-- Main Content -->
        <mat-sidenav-content class="sidenav-content">
          <main class="main-content container-fluid container-xxl">
            <router-outlet></router-outlet>
          </main>
        </mat-sidenav-content>
      </mat-sidenav-container>

      <!-- Footer -->
      <footer class="app-footer" *ngIf="isAuthenticated">
        <div class="container-fluid container-xxl">
          <p>&copy; 2026 ClaimSwift. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background:
        radial-gradient(circle at 8% 2%, #f5fbff 0, rgba(245, 251, 255, 0) 34%),
        radial-gradient(circle at 92% 2%, #eef7ff 0, rgba(238, 247, 255, 0) 32%),
        #eef3f8;
    }

    .app-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      height: 72px;
      background: linear-gradient(105deg, #0e334f 0%, #19547d 52%, #1d6695 100%);
      box-shadow: 0 12px 34px rgba(12, 40, 63, 0.31);
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      padding: 0 0.9rem;
      backdrop-filter: blur(4px);
    }

    .app-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      margin-left: 2px;
      color: #ffffff;
    }

    .app-logo {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .menu-button {
      margin-right: 8px;
    }

    .icon-action {
      margin-right: 0.25rem;
    }

    .connection-status {
      margin-right: 16px;
      padding: 7px 14px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 600;
      border: 1px solid transparent;
      min-width: 90px;
      text-align: center;

      &.connected {
        background-color: #e7f6ee;
        color: #216e49;
        border-color: #b8e2c8;
      }

      &.disconnected {
        background-color: #ffe9ec;
        color: #b32637;
        border-color: #ffc1ca;
      }

      &.connecting {
        background-color: #e8f1ff;
        color: #245fa7;
        border-color: #bad4ff;
      }
    }

    .user-menu-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.35);
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      padding: 0 8px 0 10px;
    }

    .role-chip {
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 999px;
      padding: 2px 10px;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .username {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sidenav-container {
      flex: 1;
      margin-top: 0;
    }

    .sidenav-container.with-header {
      margin-top: 72px;
    }

    .app-sidenav {
      width: 294px;
      background: linear-gradient(180deg, #f8fbff 0%, #f4f9ff 100%);
      border-right: 1px solid #d2deeb;
      box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.6);
    }

    .mat-mdc-nav-list .mat-mdc-list-item {
      margin: 4px 10px;
      border-radius: 11px;
      border: 1px solid transparent;
      transition: all 0.2s ease-in-out;
      min-height: 46px;

      &.active {
        background: linear-gradient(96deg, #d4eaff 0%, #ecf5ff 100%);
        color: #0f547d;
        border-color: #b8d8f4;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
      }

      &:hover {
        background-color: #e8f3fc;
        border-color: #d2e4f3;
      }
    }

    .nav-section-label {
      margin: 14px 18px 8px;
      font-size: 0.68rem;
      letter-spacing: 0.11em;
      font-weight: 700;
      color: #6b8294;
      text-transform: uppercase;
    }

    .nav-unread-count {
      min-width: 22px;
      height: 22px;
      border-radius: 999px;
      background: #e53935;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 700;
      line-height: 1;
      padding: 0 6px;
      margin-left: auto;
      box-shadow: 0 2px 6px rgba(229, 57, 53, 0.35);
    }

    .sidenav-content {
      background: transparent;
      min-height: calc(100vh - 126px);
    }

    .main-content {
      padding: 1.5rem;
      max-width: 1480px;
      margin: 0 auto;
    }

    .app-footer {
      background: #f6f9fc;
      padding: 0.8rem 0;
      border-top: 1px solid #d9e3ee;

      p {
        margin: 0;
        color: #5f7588;
        font-size: 0.82rem;
        text-align: center;
      }
    }

    mat-divider {
      margin: 8px 0;
    }

    @media (max-width: 991px) {
      .sidenav-container.with-header {
        margin-top: 56px;
      }

      .main-content {
        padding: 1rem 0.9rem;
      }

      .username {
        display: none;
      }

      .connection-status {
        display: none;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  currentUser: User | null = null;
  isAuthenticated = false;
  unreadNotifications = 0;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  sidenavOpened = true;
  isMobile = false;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.updateViewportState();

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
      this.sidenavOpened = this.isAuthenticated && !this.isMobile;
    });

    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadNotifications = count;
    });

    this.notificationService.connectionStatus$.subscribe(status => {
      this.connectionStatus = status;
    });
  }

  get isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  get isManager(): boolean {
    return this.authService.hasRole('MANAGER');
  }

  get isAdjuster(): boolean {
    return this.authService.hasRole('ADJUSTER');
  }

  get isPolicyholder(): boolean {
    return this.authService.hasRole('POLICYHOLDER');
  }

  get isManagerOrAdmin(): boolean {
    return this.authService.hasAnyRole(['MANAGER', 'ADMIN']);
  }

  get isOpsUser(): boolean {
    return this.authService.hasAnyRole(['ADJUSTER', 'MANAGER', 'ADMIN']);
  }

  get primaryRoleLabel(): string {
    const roles = this.currentUser?.roles ?? [];
    if (!roles.length) {
      return 'User';
    }

    const normalize = (value: string) => value.replace(/^ROLE_/, '').toUpperCase();
    const ordered = ['ADMIN', 'MANAGER', 'ADJUSTER', 'POLICYHOLDER'];
    const normalizedRoles = roles.map(normalize);
    const primary = ordered.find(role => normalizedRoles.includes(role)) ?? normalizedRoles[0];
    return primary.replace(/_/g, ' ');
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportState();
  }

  private updateViewportState(): void {
    this.isMobile = window.innerWidth < 992;
    if (this.isAuthenticated) {
      this.sidenavOpened = !this.isMobile;
    }
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

  onNavItemClick(): void {
    if (this.isMobile) {
      this.sidenavOpened = false;
    }
  }

  logout(): void {
    this.authService.logoutSecure().subscribe();
  }
}
