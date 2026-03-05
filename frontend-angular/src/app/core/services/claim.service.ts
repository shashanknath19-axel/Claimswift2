import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Claim, ClaimRequest, ClaimStatusUpdate, ClaimStatistics } from '../models/claim.model';
import { ApiResponse, PageResponse } from '../models/api-response.model';
import { SKIP_GLOBAL_ERROR } from '../interceptors/http-context.tokens';

@Injectable({
  providedIn: 'root'
})
export class ClaimService {
  private readonly API_URL = `${environment.apiUrl}/claims`;

  constructor(private http: HttpClient) {}

  getClaims(
    page: number = 0,
    size: number = 10,
    status?: string,
    sortBy: string = 'createdAt',
    sortDir: 'asc' | 'desc' = 'desc'
  ): Observable<PageResponse<Claim>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiResponse<PageResponse<Claim>>>(this.API_URL, { params })
      .pipe(map(response => response.data));
  }

  getClaimById(id: number, silent: boolean = false): Observable<Claim> {
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR, silent);
    return this.http.get<ApiResponse<Claim>>(`${this.API_URL}/${id}`, { context })
      .pipe(map(response => response.data));
  }

  getClaimByNumber(claimNumber: string): Observable<Claim> {
    return this.http.get<ApiResponse<Claim>>(`${this.API_URL}/number/${claimNumber}`)
      .pipe(map(response => response.data));
  }

  createClaim(claim: ClaimRequest): Observable<Claim> {
    return this.http.post<ApiResponse<Claim>>(this.API_URL, claim)
      .pipe(map(response => response.data));
  }

  updateClaim(id: number, claim: Partial<ClaimRequest>): Observable<Claim> {
    return this.http.put<ApiResponse<Claim>>(`${this.API_URL}/${id}`, claim)
      .pipe(map(response => response.data));
  }

  updateClaimStatus(id: number, update: ClaimStatusUpdate): Observable<Claim> {
    return this.http.put<ApiResponse<Claim>>(`${this.API_URL}/${id}/status`, update)
      .pipe(map(response => response.data));
  }

  deleteClaim(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`)
      .pipe(map(response => response.data));
  }

  getMyClaims(): Observable<Claim[]> {
    return this.http.get<ApiResponse<Claim[]>>(`${this.API_URL}/my-claims`)
      .pipe(map(response => response.data));
  }

  searchMyClaims(filters: {
    query?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Observable<Claim[]> {
    let params = new HttpParams();
    if (filters.query) {
      params = params.set('query', filters.query);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }
    if (filters.toDate) {
      params = params.set('toDate', filters.toDate);
    }
    return this.http.get<ApiResponse<Claim[]>>(`${this.API_URL}/my-claims/search`, { params })
      .pipe(map(response => response.data));
  }

  getClaimHistory(): Observable<Claim[]> {
    return this.http.get<ApiResponse<Claim[]>>(`${this.API_URL}/history`)
      .pipe(map(response => response.data));
  }

  getClaimsByStatus(status: string): Observable<Claim[]> {
    return this.http.get<ApiResponse<Claim[]>>(`${this.API_URL}/status/${status}`)
      .pipe(map(response => response.data));
  }

  getPendingClaims(): Observable<Claim[]> {
    return this.http.get<ApiResponse<Claim[]>>(`${this.API_URL}/pending`)
      .pipe(map(response => response.data));
  }

  getAssignedClaims(): Observable<Claim[]> {
    return this.http.get<ApiResponse<Claim[]>>(`${this.API_URL}/assigned`)
      .pipe(map(response => response.data));
  }

  assignClaim(claimId: number, adjusterId: number): Observable<Claim> {
    return this.http.patch<ApiResponse<Claim>>(
      `${this.API_URL}/${claimId}/assign`,
      { adjusterId }
    ).pipe(map(response => response.data));
  }

  unassignClaim(claimId: number): Observable<Claim> {
    return this.http.patch<ApiResponse<Claim>>(`${this.API_URL}/${claimId}/unassign`, {})
      .pipe(map(response => response.data));
  }

  getClaimStatistics(): Observable<ClaimStatistics> {
    return this.http.get<ApiResponse<ClaimStatistics>>(`${this.API_URL}/statistics`)
      .pipe(map(response => response.data));
  }

  searchClaims(query: string): Observable<Claim[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<ApiResponse<Claim[]>>(`${this.API_URL}/search`, { params })
      .pipe(map(response => response.data));
  }
}
