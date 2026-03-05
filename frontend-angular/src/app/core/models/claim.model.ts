export type ClaimStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ADJUSTED'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

export interface Claim {
  id: number;
  claimNumber: string;
  policyNumber: string;
  policyholderId?: number;
  policyholderName?: string;
  policyholderEmail?: string;

  // Vehicle details
  vehicleRegistration?: string;
  vehicleRegistrationNumber?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear?: number;
  vinNumber?: string;

  // Incident details
  incidentDate: string;
  incidentLocation?: string;
  incidentDescription?: string;
  description?: string;

  // Financial
  claimAmount: number;
  approvedAmount?: number;

  // Status and assignment
  status: ClaimStatus;
  assignedAdjusterId?: number;
  adjusterName?: string;
  adjusterNotes?: string;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  paidAt?: string;

  // Related data
  documents?: ClaimDocument[];
  assessments?: Assessment[];
  payments?: Payment[];
}

export interface ClaimDocument {
  id: number;
  claimId: number;
  fileName: string;
  originalFileName: string;
  documentType: DocumentType;
  description?: string;
  uploadedAt: string;
  uploadedBy: string;
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

export interface ClaimRequest {
  policyNumber: string;
  vehicleRegistration: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear?: number;
  incidentDate: string;
  incidentLocation?: string;
  incidentDescription?: string;
  claimAmount: number;
}

export interface ClaimStatusUpdate {
  status: ClaimStatus;
  notes?: string;
  assignedAdjusterId?: number;
  approvedAmount?: number;
}

export interface Assessment {
  id: number;
  claimId: number;
  adjusterId: number;
  adjusterName: string;
  assessmentDate: string;
  damageAssessment: string;
  repairCostEstimate: number;
  recommendedPayout: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  fraudIndicators?: string[];
  decision: 'APPROVE' | 'REJECT' | 'INVESTIGATE';
  notes: string;
}

export interface Payment {
  id: number;
  claimId: number;
  claimNumber: string;
  paymentAmount: number;
  paymentMethod: 'BANK_TRANSFER' | 'CHECK' | 'CARD';
  paymentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  transactionId?: string;
  paidAt?: string;
  notes?: string;
}

export interface ClaimStatistics {
  totalClaims: number;
  submittedClaims: number;
  underReviewClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  adjustedClaims?: number;
  paidClaims?: number;
  paymentFailedClaims?: number;
  cancelledClaims?: number;
  closedClaims: number;
  approvedAmount?: number;
}
