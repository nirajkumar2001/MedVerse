export interface MedicalVisitRecord {
  updateId: number;
  sessionId: string;
  patientId: string;
  doctorId: string;

  bloodGroup: string;
  allergies: string;
  chronicConditions: string;
  currentMedication: string;

  disease: string;
  medicalReports: string;
  findings: string;
  prescription: string;

  heightCm?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  bloodPressure?: string | null;
  bodyTemperature?: string | null;

  dateOfUpdate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientMedicalProfileRecord {
  patientId?: string;

  bloodGroup: string;
  allergies: string;
  chronicConditions: string;
  currentMedication: string;
  medicalReports: string;

  disease?: string;
  findings?: string;
  prescription?: string;

  heightCm?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  bloodPressure?: string | null;
  bodyTemperature?: string | null;

  lastDisease?: string;
  lastFindings?: string;
  lastPrescription?: string;

  lastUpdatedByDoctorId?: string;
  lastUpdatedSessionId?: string;
  lastUpdatedAt?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface PatientMedicalRecord {
  currentProfile: PatientMedicalProfileRecord;
  previousRecords: MedicalVisitRecord[];
}