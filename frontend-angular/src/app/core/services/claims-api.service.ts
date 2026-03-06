import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClaimCreateRequest, ClaimResponse } from '../models/claim.models';
import { PaginatedResponse, StandardResponse } from '../models/common.models';

@Injectable({
  providedIn: 'root'
})
export class ClaimsApiService {
  private readonly baseUrl = '/api/claims';

  constructor(private readonly http: HttpClient) {}

  createClaim(payload: ClaimCreateRequest): Observable<StandardResponse<ClaimResponse>> {
    return this.http.post<StandardResponse<ClaimResponse>>(this.baseUrl, payload);
  }

  getMyClaims(): Observable<StandardResponse<ClaimResponse[]>> {
    return this.http.get<StandardResponse<ClaimResponse[]>>(`${this.baseUrl}/my-claims`);
  }

  getClaimById(claimId: number): Observable<StandardResponse<ClaimResponse>> {
    return this.http.get<StandardResponse<ClaimResponse>>(`${this.baseUrl}/${claimId}`);
  }

  getClaimByNumber(claimNumber: string): Observable<StandardResponse<ClaimResponse>> {
    return this.http.get<StandardResponse<ClaimResponse>>(
      `${this.baseUrl}/number/${encodeURIComponent(claimNumber)}`
    );
  }

  getClaims(page = 0, size = 10): Observable<StandardResponse<PaginatedResponse<ClaimResponse>>> {
    return this.http.get<StandardResponse<PaginatedResponse<ClaimResponse>>>(
      `${this.baseUrl}?page=${page}&size=${size}`
    );
  }

  searchMyClaims(query: string): Observable<StandardResponse<ClaimResponse[]>> {
    return this.http.get<StandardResponse<ClaimResponse[]>>(
      `${this.baseUrl}/my-claims/search?query=${encodeURIComponent(query)}`
    );
  }
}
