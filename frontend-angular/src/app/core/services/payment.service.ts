import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { SKIP_GLOBAL_ERROR } from '../interceptors/http-context.tokens';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly API_URL = `${environment.apiUrl}/payments`;

  constructor(private readonly http: HttpClient) {}

  getByClaimId(claimId: number, silent: boolean = false): Observable<unknown[]> {
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR, silent);
    return this.http.get<ApiResponse<unknown[]>>(`${this.API_URL}/claim/${claimId}`, { context })
      .pipe(map(response => response.data ?? []));
  }

  getInternalAll(silent: boolean = false): Observable<unknown[]> {
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR, silent);
    return this.http.get<ApiResponse<unknown[]>>(`${this.API_URL}/internal/all`, { context })
      .pipe(map(response => response.data ?? []));
  }
}
