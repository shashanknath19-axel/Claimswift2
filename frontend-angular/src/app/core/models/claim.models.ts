export interface ClaimCreateRequest {
  policyNumber: string;
  vehicleRegistration: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number | null;
  incidentDate: string;
  incidentLocation?: string;
  incidentDescription?: string;
  claimAmount: number;
}

export interface ClaimResponse {
  id: number;
  claimNumber: string;
  policyNumber: string;
  policyholderId: number;
  status: string;
  claimAmount: number;
  approvedAmount?: number | null;
  incidentDate: string;
  incidentLocation?: string | null;
  incidentDescription?: string | null;
  adjusterName?: string | null;
  createdAt: string;
}
