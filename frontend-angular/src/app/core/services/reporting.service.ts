import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ReportingService {
  private readonly API_URL = `${environment.apiUrl}/reports`;

  constructor(private readonly http: HttpClient) {}

  getClaimSummary(startDate?: string, endDate?: string): Observable<unknown> {
    const params = this.buildDateParams(startDate, endDate);
    return this.http.get<ApiResponse<unknown>>(`${this.API_URL}/claims/summary`, { params })
      .pipe(map(response => response.data));
  }

  getPaymentSummary(startDate?: string, endDate?: string): Observable<unknown> {
    const params = this.buildDateParams(startDate, endDate);
    return this.http.get<ApiResponse<unknown>>(`${this.API_URL}/payments`, { params })
      .pipe(map(response => response.data));
  }

  getAdjusterPerformance(startDate?: string, endDate?: string): Observable<unknown> {
    const params = this.buildDateParams(startDate, endDate);
    return this.http.get<ApiResponse<unknown>>(`${this.API_URL}/adjusters/performance`, { params })
      .pipe(map(response => response.data));
  }

  private buildDateParams(startDate?: string, endDate?: string): HttpParams {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return params;
  }
}

