import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgFor, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly isAuthenticated$ = this.authService.currentUser$.pipe(map((user) => !!user));
  readonly currentUser$ = this.authService.currentUser$;
  readonly isAdmin$ = this.authService.currentUser$.pipe(map((user) => !!user?.roles?.includes('ROLE_ADMIN')));
  readonly canSeeReports$ = this.authService.currentUser$.pipe(
    map((user) => !!user?.roles?.some((role) => ['ROLE_ADJUSTER', 'ROLE_MANAGER', 'ROLE_ADMIN'].includes(role)))
  );
  readonly theme$ = this.themeService.theme$;

  constructor(
    private readonly authService: AuthService,
    private readonly themeService: ThemeService
  ) {}

  logout(): void {
    this.authService.logout();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
