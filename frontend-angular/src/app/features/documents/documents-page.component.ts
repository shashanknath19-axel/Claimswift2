import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { Document, DocumentType } from '../../core/models/document.model';
import { DocumentService } from '../../core/services/document.service';

@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <section class="page-header">
      <div>
        <h1>Documents</h1>
        <p>Manage uploaded claim evidence and supporting files.</p>
      </div>
      <button mat-flat-button color="primary" routerLink="/documents/upload">
        <mat-icon>upload_file</mat-icon>
        Upload
      </button>
    </section>

    <mat-card class="claim-card fade-in">
      <form [formGroup]="filterForm" class="toolbar" (ngSubmit)="loadDocuments()">
        <mat-form-field appearance="outline">
          <mat-label>Claim ID (optional)</mat-label>
          <input matInput type="number" formControlName="claimId" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Document Type</mat-label>
          <mat-select formControlName="documentType">
            <mat-option value="">All</mat-option>
            <mat-option *ngFor="let type of documentTypes" [value]="type">{{ type }}</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-stroked-button type="submit">
          <mat-icon>search</mat-icon>
          Apply
        </button>
      </form>

      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="36"></mat-spinner>
        <p>Loading documents...</p>
      </div>

      <div class="empty-state" *ngIf="!loading && !documents.length">
        <mat-icon class="empty-icon">description</mat-icon>
        <h3>No documents found</h3>
        <p>Upload claim files to see them here.</p>
      </div>

      <div class="selected-doc" *ngIf="selectedDocument">
        <h3>Document Details</h3>
        <div class="meta-grid">
          <div><span>ID</span><strong>{{ selectedDocument.id }}</strong></div>
          <div><span>Claim ID</span><strong>{{ selectedDocument.claimId }}</strong></div>
          <div><span>Type</span><strong>{{ selectedDocument.documentType }}</strong></div>
          <div><span>Size</span><strong>{{ selectedDocument.fileSize | number }} bytes</strong></div>
        </div>
      </div>

      <div class="table-wrap" *ngIf="!loading && documents.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Type</th>
              <th>Claim ID</th>
              <th>Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let document of documents">
              <td>{{ document.originalFileName || document.fileName }}</td>
              <td>{{ document.documentType }}</td>
              <td>{{ document.claimId }}</td>
              <td>{{ document.fileSize | number }} bytes</td>
              <td class="action-buttons">
                <button mat-icon-button (click)="view(document.id)">
                  <mat-icon>info</mat-icon>
                </button>
                <button mat-icon-button (click)="download(document)">
                  <mat-icon>download</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="remove(document.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </mat-card>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    h1 {
      margin: 0;
      color: #0f2f47;
      font-size: 1.75rem;
    }

    .page-header p {
      margin: 0.35rem 0 0;
      color: var(--text-secondary);
    }

    .toolbar {
      display: flex;
      gap: 0.8rem;
      align-items: flex-end;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .table-wrap {
      overflow: auto;
    }

    .selected-doc {
      border: 1px solid var(--border-color);
      border-radius: 0.8rem;
      padding: 0.9rem 1rem;
      margin-bottom: 0.9rem;
      background: #f8fcff;
    }

    .selected-doc h3 {
      margin: 0 0 0.7rem;
      color: #10324b;
      font-size: 1rem;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.8rem;
    }

    .meta-grid span {
      display: block;
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-bottom: 0.1rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .meta-grid strong {
      color: #123852;
      overflow-wrap: anywhere;
    }

    @media (max-width: 960px) {
      .meta-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 540px) {
      .meta-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DocumentsPageComponent implements OnInit {
  loading = false;
  documents: Document[] = [];
  selectedDocument: Document | null = null;
  documentTypes = this.documentService.getDocumentTypes();

  readonly filterForm = this.fb.group({
    claimId: [''],
    documentType: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;

    const claimIdRaw = this.filterForm.controls.claimId.value ?? '';
    const documentType = this.filterForm.controls.documentType.value ?? '';
    const claimId = claimIdRaw ? Number(claimIdRaw) : undefined;
    const filterType = documentType ? documentType as DocumentType : undefined;

    this.documentService.getDocuments({ claimId, documentType: filterType })
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(documents => {
        this.documents = documents;
        this.selectedDocument = null;
      });
  }

  download(document: Document): void {
    this.documentService.downloadDocument(document.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalFileName || document.fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  view(documentId: number): void {
    this.documentService.getDocumentById(documentId).subscribe(document => {
      this.selectedDocument = document;
    });
  }

  remove(documentId: number): void {
    this.documentService.deleteDocument(documentId).subscribe(() => {
      this.documents = this.documents.filter(document => document.id !== documentId);
      if (this.selectedDocument?.id === documentId) {
        this.selectedDocument = null;
      }
    });
  }
}
