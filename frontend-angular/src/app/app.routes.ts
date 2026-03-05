import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page.component').then(m => m.LoginPageComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register-page.component').then(m => m.RegisterPageComponent)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/dashboard/dashboard-page.component').then(m => m.DashboardPageComponent)
  },
  {
    path: 'claims',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/claims/claims-list-page.component').then(m => m.ClaimsListPageComponent)
      },
      {
        path: 'history',
        canActivate: [RoleGuard],
        data: { roles: ['POLICYHOLDER'] },
        loadComponent: () => import('./features/claims/claim-history-page.component').then(m => m.ClaimHistoryPageComponent)
      },
      {
        path: 'new',
        canActivate: [RoleGuard],
        data: { roles: ['POLICYHOLDER', 'ADMIN'] },
        loadComponent: () => import('./features/claims/claim-form-page.component').then(m => m.ClaimFormPageComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/claims/claim-detail-page.component').then(m => m.ClaimDetailPageComponent)
      },
      {
        path: ':id/edit',
        canActivate: [RoleGuard],
        data: { roles: ['POLICYHOLDER', 'ADMIN'] },
        loadComponent: () => import('./features/claims/claim-form-page.component').then(m => m.ClaimFormPageComponent)
      },
      {
        path: ':id/tracking',
        loadComponent: () => import('./features/claims/claim-tracking-page.component').then(m => m.ClaimTrackingPageComponent)
      }
    ]
  },
  {
    path: 'documents',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        canActivate: [RoleGuard],
        data: { roles: ['POLICYHOLDER', 'ADMIN'] },
        loadComponent: () => import('./features/documents/documents-page.component').then(m => m.DocumentsPageComponent)
      },
      {
        path: 'upload',
        canActivate: [RoleGuard],
        data: { roles: ['POLICYHOLDER', 'ADMIN'] },
        loadComponent: () => import('./features/documents/document-upload-page.component').then(m => m.DocumentUploadPageComponent)
      }
    ]
  },
  {
    path: 'notifications',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/notifications/notifications-page.component').then(m => m.NotificationsPageComponent)
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/misc/profile-page.component').then(m => m.ProfilePageComponent)
  },
  {
    path: 'settings',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/misc/settings-page.component').then(m => m.SettingsPageComponent)
  },
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['MANAGER', 'ADJUSTER', 'ADMIN'] },
    children: [
      {
        path: 'dashboard',
        canActivate: [RoleGuard],
        data: { roles: ['MANAGER', 'ADMIN'] },
        loadComponent: () => import('./features/admin/admin-dashboard-page.component').then(m => m.AdminDashboardPageComponent)
      },
      {
        path: 'claims',
        loadComponent: () => import('./features/admin/admin-claims-page.component').then(m => m.AdminClaimsPageComponent)
      },
      {
        path: 'users',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/admin/admin-users-page.component').then(m => m.AdminUsersPageComponent),
      }
    ]
  },
  {
    path: 'reports',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['MANAGER', 'ADMIN'] },
    loadComponent: () => import('./features/reports/reports-page.component').then(m => m.ReportsPageComponent)
  },
  {
    path: 'payments',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['MANAGER', 'ADMIN'] },
    loadComponent: () => import('./features/payments/payments-page.component').then(m => m.PaymentsPageComponent)
  },
  {
    path: 'assessment',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADJUSTER', 'MANAGER', 'ADMIN'] },
    children: [
      {
        path: ':claimId',
        loadComponent: () => import('./features/assessment/assessment-page.component').then(m => m.AssessmentPageComponent)
      }
    ]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/misc/unauthorized-page.component').then(m => m.UnauthorizedPageComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./features/misc/not-found-page.component').then(m => m.NotFoundPageComponent)
  }
];
