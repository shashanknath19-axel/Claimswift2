import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

import { environment } from '../../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

interface DecodedToken {
  sub: string;
  username: string;
  roles: string[];
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'claimswift_token';
  private readonly USER_KEY = 'claimswift_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
    this.startTokenRefreshTimer();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (this.isTokenValid(token)) {
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        } else {
          this.logout();
        }
      } catch {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/login`, credentials)
      .pipe(
        map(response => response.data),
        tap(authData => this.handleAuthentication(authData)),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/register`, data)
      .pipe(
        map(response => response.data),
        tap(authData => this.handleAuthentication(authData)),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  getAdjusters(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.API_URL}/adjusters`)
      .pipe(map(response => response.data));
  }

  logout(): void {
    this.clearSessionAndRedirect();
  }

  logoutSecure(): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.API_URL}/logout`, {})
      .pipe(
        map(response => response.data),
        catchError(() => of(void 0)),
        tap(() => this.clearSessionAndRedirect())
      );
  }

  clearSessionAndRedirect(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/refresh`, {})
      .pipe(
        map(response => response.data),
        tap(authData => this.handleAuthentication(authData)),
        catchError(error => {
          this.clearSessionAndRedirect();
          return throwError(() => error);
        })
      );
  }

  private handleAuthentication(authData: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authData.accessToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authData.user));
    this.currentUserSubject.next(authData.user);
    this.isAuthenticatedSubject.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private isTokenValid(token: string): boolean {
    try {
      const decoded: DecodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  }

  private startTokenRefreshTimer(): void {
    setInterval(() => {
      const token = this.getToken();
      if (token) {
        try {
          const decoded: DecodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          const timeUntilExpiry = decoded.exp - currentTime;

          if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
            this.refreshToken().subscribe();
          } else if (timeUntilExpiry <= 0) {
            this.clearSessionAndRedirect();
          }
        } catch {
          this.clearSessionAndRedirect();
        }
      }
    }, 60000); // Check every minute
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user?.roles?.length) return false;
    const target = this.normalizeRoleName(role);
    const aliases = new Set<string>([target]);

    if (target === 'ADJUSTER') {
      aliases.add('POLICYADJUSTER');
      aliases.add('POLICY_ADJUSTER');
    }

    if (target === 'POLICYHOLDER') {
      aliases.add('POLICY_HOLDER');
    }

    return user.roles.some(currentRole => aliases.has(this.normalizeRoleName(currentRole)));
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  private normalizeRoleName(role: string): string {
    return role
      .replace(/^ROLE_/, '')
      .replace(/[\s-]/g, '_')
      .toUpperCase();
  }
}
