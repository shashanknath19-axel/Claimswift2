export type NotificationType = 
  | 'CLAIM_STATUS_UPDATE'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'PAYMENT_PROCESSED'
  | 'DOCUMENT_UPLOADED'
  | 'ASSESSMENT_COMPLETED'
  | 'SYSTEM_MESSAGE'
  | 'REMINDER';

export interface Notification {
  id: number;
  userId: number;
  claimId?: number;
  type: NotificationType;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  senderId?: number;
  createdAt: string;
  readAt?: string;
}

export interface NotificationPreference {
  userId: number;
  emailEnabled: boolean;
  pushEnabled: boolean;
  claimUpdates: boolean;
  documentUpdates: boolean;
  paymentUpdates: boolean;
  marketingEmails: boolean;
}
