import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { SKIP_GLOBAL_ERROR } from '../interceptors/http-context.tokens';

export interface AssessmentDecisionRequest {
  assessmentId: number;
  decision: 'APPROVED' | 'REJECTED' | 'ADJUSTED';
  finalAmount: number;
  justification: string;
}

export interface AssessmentCreateRequest {
  claimId: number;
  assessedAmount: number;
  justification: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  private readonly API_URL = `${environment.apiUrl}/assessments`;

  constructor(private readonly http: HttpClient) {}

  getByClaimId(claimId: number, silent: boolean = false): Observable<unknown> {
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR, silent);
    return this.http.get<ApiResponse<unknown>>(`${this.API_URL}/claim/${claimId}`, { context })
      .pipe(map(response => response.data));
  }

  createAssessment(payload: AssessmentCreateRequest): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(this.API_URL, payload)
      .pipe(map(response => response.data));
  }

  submitDecision(payload: AssessmentDecisionRequest): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.API_URL}/decision`, payload)
      .pipe(map(response => response.data));
  }
}
