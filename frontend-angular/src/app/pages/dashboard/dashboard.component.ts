import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { RoleName } from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';
import { ClaimsApiService } from '../../core/services/claims-api.service';
import { PaginatedResponse, StandardResponse } from '../../core/models/common.models';
import { ClaimResponse } from '../../core/models/claim.models';
import { RoleChipComponent } from '../../ui/role-chip/role-chip.component';
import { ShellCardComponent } from '../../ui/shell-card/shell-card.component';
import { StatTileComponent } from '../../ui/stat-tile/stat-tile.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, AsyncPipe, RouterLink, RoleChipComponent, ShellCardComponent, StatTileComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  totalClaims = 0;
  isLoading = false;
  readonly user$ = this.authService.currentUser$;
  readonly headline$ = this.user$.pipe(
    map((user) => {
      if (!user) {
        return 'Operations Workspace';
      }
      if (user.roles.includes('ROLE_ADMIN')) {
        return 'Platform Administration';
      }
      if (user.roles.includes('ROLE_MANAGER')) {
        return 'Claims Governance Console';
      }
      if (user.roles.includes('ROLE_ADJUSTER')) {
        return 'Claims Assessment Desk';
      }
      return 'Policyholder Dashboard';
    })
  );

  constructor(
    private readonly authService: AuthService,
    private readonly claimsApiService: ClaimsApiService
  ) {
    this.loadSummaryCounts();
  }

  isRole(role: RoleName): boolean {
    return this.authService.hasRole(role);
  }

  private loadSummaryCounts(): void {
    this.isLoading = true;
    if (this.authService.hasRole('ROLE_POLICYHOLDER')) {
      this.claimsApiService.getMyClaims().subscribe({
        next: (response: StandardResponse<ClaimResponse[]>) => {
          this.totalClaims = response.data.length;
          this.isLoading = false;
        },
        error: () => {
          this.totalClaims = 0;
          this.isLoading = false;
        }
      });
      return;
    }

    this.claimsApiService.getClaims().subscribe({
      next: (response: StandardResponse<PaginatedResponse<ClaimResponse>>) => {
        this.totalClaims = response.data.totalElements;
        this.isLoading = false;
      },
      error: () => {
        this.totalClaims = 0;
        this.isLoading = false;
      }
    });
  }
}
