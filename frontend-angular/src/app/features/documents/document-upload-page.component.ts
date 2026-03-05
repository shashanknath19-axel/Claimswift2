import { CommonModule } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import { Document } from '../../core/models/document.model';
import { DocumentService } from '../../core/services/document.service';

@Component({
  selector: 'app-document-upload-page',
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
    MatProgressBarModule,
    MatSelectModule
  ],
  template: `
    <section class="page-header">
      <div>
        <h1>Upload Document</h1>
        <p>Attach evidence and files to a specific claim.</p>
      </div>
    </section>

    <mat-card class="claim-card fade-in">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Claim ID</mat-label>
            <input matInput type="number" formControlName="claimId" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Document Type</mat-label>
            <mat-select formControlName="documentType">
              <mat-option *ngFor="let type of documentTypes" [value]="type">{{ type }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput rows="3" formControlName="description"></textarea>
        </mat-form-field>

        <div class="file-box">
          <input type="file" accept=".pdf,application/pdf" (change)="onFileChanged($event)" />
          <p *ngIf="selectedFile">{{ selectedFile.name }}</p>
          <p *ngIf="!selectedFile">No file selected</p>
          <p class="error-message" *ngIf="fileError">{{ fileError }}</p>
        </div>

        <mat-progress-bar mode="determinate" [value]="uploadProgress" *ngIf="uploadProgress > 0"></mat-progress-bar>

        <div class="card-actions">
          <button mat-stroked-button type="button" routerLink="/documents">Back</button>
          <button mat-flat-button color="primary" [disabled]="form.invalid || !selectedFile || isSubmitting">
            <mat-icon>cloud_upload</mat-icon>
            Upload
          </button>
        </div>
      </form>
    </mat-card>
  `,
  styles: [`
    .page-header h1 {
      margin: 0;
      color: #0f2f47;
    }

    .page-header p {
      margin: 0.35rem 0 1rem;
      color: var(--text-secondary);
    }

    .file-box {
      border: 1px dashed #97afbf;
      border-radius: 0.8rem;
      padding: 1rem;
      margin-bottom: 0.8rem;
      background: #f8fbfd;
    }

    .file-box p {
      margin: 0.6rem 0 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .error-message {
      color: #b42318;
      font-weight: 600;
    }
  `]
})
export class DocumentUploadPageComponent implements OnInit {
  isSubmitting = false;
  uploadProgress = 0;
  selectedFile: File | null = null;
  fileError: string | null = null;
  documentTypes = this.documentService.getDocumentTypes();

  readonly form = this.fb.group({
    claimId: [null as number | null, [Validators.required, Validators.min(1)]],
    documentType: ['CLAIM_FORM', Validators.required],
    description: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly documentService: DocumentService
  ) {}

  private returnTo: string = '/documents';

  ngOnInit(): void {
    const claimId = Number(this.route.snapshot.queryParamMap.get('claimId'));
    const returnTo = this.route.snapshot.queryParamMap.get('returnTo');

    if (claimId > 0) {
      this.form.patchValue({ claimId });
    }
    if (returnTo) {
      this.returnTo = returnTo;
    }
  }

  onFileChanged(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fileError = null;

    if (!file) {
      this.selectedFile = null;
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isPdfByName = lowerName.endsWith('.pdf');
    const isPdfByType = file.type === 'application/pdf' || file.type === 'application/x-pdf' || file.type === '';
    if (!isPdfByName || !isPdfByType) {
      this.selectedFile = null;
      this.fileError = 'Only PDF documents are allowed.';
      input.value = '';
      return;
    }

    this.selectedFile = file;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.selectedFile || this.isSubmitting) {
      return;
    }

    const value = this.form.getRawValue();
    this.isSubmitting = true;
    this.uploadProgress = 0;

    this.documentService.uploadDocument({
      claimId: value.claimId as number,
      documentType: value.documentType as Document['documentType'],
      description: value.description || undefined,
      file: this.selectedFile
    })
      .pipe(finalize(() => { this.isSubmitting = false; }))
      .subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? event.loaded;
          this.uploadProgress = Math.round((event.loaded / total) * 100);
        }

        if (event instanceof HttpResponse) {
          this.uploadProgress = 100;
          this.router.navigateByUrl(this.returnTo);
        }
      });
  }
}
