export type AccessRequestStatus =
  | 'Pending'
  | 'ApprovedWithPreviousRecords'
  | 'ApprovedProfileOnly'
  | 'Rejected';

export interface AccessRequest {
  requestId: number;
  patientId: string;
  doctorId: string;
  reason: string;
  status: AccessRequestStatus;
  requestedAt: Date;
}