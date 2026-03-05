export interface Document {
  id: number;
  claimId: number;
  uploadedBy: number;
  fileName: string;
  originalFileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  documentType: DocumentType;
  description?: string;
  createdAt: string;
  updatedAt: string;
  downloadUrl: string;
}

export type DocumentType = 
  | 'CLAIM_FORM'
  | 'POLICY_DOCUMENT'
  | 'ID_PROOF'
  | 'VEHICLE_REGISTRATION'
  | 'DRIVERS_LICENSE'
  | 'POLICE_REPORT'
  | 'MEDICAL_REPORT'
  | 'REPAIR_ESTIMATE'
  | 'PHOTO_EVIDENCE'
  | 'OTHER';

export interface DocumentUploadRequest {
  claimId: number;
  documentType: DocumentType;
  description?: string;
  file: File;
}

export interface DocumentFilter {
  claimId?: number;
  documentType?: DocumentType;
  fromDate?: string;
  toDate?: string;
}
