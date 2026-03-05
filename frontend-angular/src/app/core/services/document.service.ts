import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpEvent, HttpRequest, HttpContext } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Document, DocumentUploadRequest, DocumentFilter } from '../models/document.model';
import { ApiResponse } from '../models/api-response.model';
import { AuthService } from './auth.service';
import { SKIP_GLOBAL_ERROR } from '../interceptors/http-context.tokens';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly API_URL = `${environment.apiUrl}/documents`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  uploadDocument(request: DocumentUploadRequest): Observable<HttpEvent<ApiResponse<Document>>> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('claimId', request.claimId.toString());
    formData.append('documentType', request.documentType);
    if (request.description) {
      formData.append('description', request.description);
    }

    const req = new HttpRequest('POST', `${this.API_URL}/upload`, formData, {
      reportProgress: true
    });
    return this.http.request(req);
  }

  getDocuments(filter?: DocumentFilter): Observable<Document[]> {
    if (filter?.claimId && filter?.documentType) {
      return this.http.get<ApiResponse<Document[]>>(
        `${this.API_URL}/claim/${filter.claimId}/type/${filter.documentType}`
      ).pipe(map(response => response.data));
    }

    if (filter?.claimId) {
      return this.getDocumentsByClaim(filter.claimId);
    }

    const user = this.authService.currentUser;
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.get<ApiResponse<Document[]>>(`${this.API_URL}/user/${user.id}`)
      .pipe(map(response => response.data));
  }

  getDocumentById(id: number): Observable<Document> {
    return this.http.get<ApiResponse<Document>>(`${this.API_URL}/${id}`)
      .pipe(map(response => response.data));
  }

  getDocumentsByClaim(claimId: number, silent: boolean = false): Observable<Document[]> {
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR, silent);
    return this.http.get<ApiResponse<Document[]>>(`${this.API_URL}/claim/${claimId}`, { context })
      .pipe(map(response => response.data));
  }

  downloadDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${id}/download`, {
      responseType: 'blob'
    });
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`)
      .pipe(map(response => response.data));
  }

  getDocumentTypes(): string[] {
    return [
      'CLAIM_FORM',
      'POLICY_DOCUMENT',
      'ID_PROOF',
      'VEHICLE_REGISTRATION',
      'DRIVERS_LICENSE',
      'POLICE_REPORT',
      'MEDICAL_REPORT',
      'REPAIR_ESTIMATE',
      'PHOTO_EVIDENCE',
      'OTHER'
    ];
  }

  getDocumentTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'CLAIM_FORM': 'Claim Form',
      'POLICY_DOCUMENT': 'Policy Document',
      'ID_PROOF': 'ID Proof',
      'VEHICLE_REGISTRATION': 'Vehicle Registration',
      'DRIVERS_LICENSE': 'Driver\'s License',
      'POLICE_REPORT': 'Police Report',
      'MEDICAL_REPORT': 'Medical Report',
      'REPAIR_ESTIMATE': 'Repair Estimate',
      'PHOTO_EVIDENCE': 'Photo Evidence',
      'OTHER': 'Other'
    };
    return labels[type] || type;
  }

  getDocumentIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'CLAIM_FORM': 'description',
      'POLICY_DOCUMENT': 'policy',
      'ID_PROOF': 'badge',
      'VEHICLE_REGISTRATION': 'directions_car',
      'DRIVERS_LICENSE': 'credit_card',
      'POLICE_REPORT': 'local_police',
      'MEDICAL_REPORT': 'local_hospital',
      'REPAIR_ESTIMATE': 'build',
      'PHOTO_EVIDENCE': 'photo',
      'OTHER': 'insert_drive_file'
    };
    return icons[type] || 'insert_drive_file';
  }
}
