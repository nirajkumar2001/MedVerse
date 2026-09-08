import { EmergencyRecord } from './emergency-record.model';

export interface Patient {
  patientId: string;
  userId?: string;
  fullName: string;
  name?: string;
  email?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contactNumber?: string;
  emergencyContact: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  height?: number | null;
  weight?: number | null;
  profileImage?: string;
  photoText: string;
  photoUrl?: string;
  emergencyRecord: EmergencyRecord;
}
