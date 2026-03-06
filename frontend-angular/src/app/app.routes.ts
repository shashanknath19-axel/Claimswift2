import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { ClaimsComponent } from './pages/claims/claims.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DocumentsComponent } from './pages/documents/documents.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { RegisterComponent } from './pages/register/register.component';
import { ReportsComponent } from './pages/reports/reports.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    component: DashboardComponent
  },
  {
    path: 'claims',
    canActivate: [authGuard],
    component: ClaimsComponent
  },
  {
    path: 'documents',
    canActivate: [authGuard],
    component: DocumentsComponent
  },
  {
    path: 'payments',
    canActivate: [authGuard],
    component: PaymentsComponent
  },
  {
    path: 'reports',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ROLE_ADJUSTER', 'ROLE_MANAGER', 'ROLE_ADMIN']
    },
    component: ReportsComponent
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ROLE_ADMIN']
    },
    component: AdminUsersComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
