import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Patient } from '../../../core/models/patient.model';
import { SidebarItem } from '../../../core/models/sidebar-item.model';
import { PatientService } from '../../../core/services/patient.service';
import { LayoutSidebarComponent } from '../../../shared/components/layout-sidebar/layout-sidebar.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { HealthcareFooterComponent } from '../../../shared/components/healthcare-footer/healthcare-footer.component';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LayoutSidebarComponent,
    PageHeaderComponent,
    HealthcareFooterComponent
  ],
  templateUrl: './patient-profile.component.html',
  styleUrl: './patient-profile.component.css'
})
export class PatientProfileComponent implements OnInit {
  private readonly photoStorageKey = 'medverse-patient-profile-photo';

  patient!: Patient;
  saved = false;
  isSavingPhoto = false;

  photoPreview = localStorage.getItem(this.photoStorageKey) || '';

  menuItems: SidebarItem[] = [
    { label: 'Dashboard', route: '/patient/home', icon: 'D', exact: true },
    { label: 'My Profile', route: '/patient/profile', icon: 'P', exact: true },
    { label: 'Emergency Details', route: '/patient/emergency-details', icon: 'E', exact: true },
    { label: 'My Medical Records', route: '/patient/medical-records', icon: 'M', exact: true },
    { label: 'Access Requests', route: '/patient/notifications', icon: 'N', badgeCount: 0, exact: true },
    { label: 'Help & Support', route: '/patient/support', icon: 'H', exact: true }
  ];

  constructor(private readonly patientService: PatientService) {}

  ngOnInit(): void {
    this.patientService.getMyProfile().subscribe(patient => {
      this.patient = { ...patient };

      if (patient.photoUrl) {
        this.photoPreview = patient.photoUrl;
        localStorage.setItem(this.photoStorageKey, patient.photoUrl);
      } else if (this.photoPreview) {
        this.patient.photoUrl = this.photoPreview;
      }
    });
  }

  get patientPhotoUrl(): string {
    return this.photoPreview || this.patient?.photoUrl || '';
  }

  save(): void {
    const payload: Patient = {
      ...this.patient,
      photoUrl: this.patientPhotoUrl
    };

    this.patientService.updateMyProfile(payload).subscribe(patient => {
      this.patient = {
        ...patient,
        photoUrl: patient.photoUrl || this.patientPhotoUrl
      };

      if (this.patient.photoUrl) {
        this.photoPreview = this.patient.photoUrl;
        localStorage.setItem(this.photoStorageKey, this.patient.photoUrl);
        this.notifyPhotoUpdated();
      }

      this.saved = true;

      setTimeout(() => {
        this.saved = false;
      }, 2500);
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    this.resizeImage(file, 420, 420, 0.78).then(photoDataUrl => {
      this.photoPreview = photoDataUrl;

      if (this.patient) {
        this.patient.photoUrl = photoDataUrl;
      }

      localStorage.setItem(this.photoStorageKey, photoDataUrl);
      this.notifyPhotoUpdated();

      this.isSavingPhoto = true;

      this.patientService.updateMyProfile({
        ...this.patient,
        photoUrl: photoDataUrl
      }).subscribe({
        next: patient => {
          this.patient = {
            ...patient,
            photoUrl: patient.photoUrl || photoDataUrl
          };

          this.photoPreview = this.patient.photoUrl || photoDataUrl;
          localStorage.setItem(this.photoStorageKey, this.photoPreview);
          this.notifyPhotoUpdated();

          this.isSavingPhoto = false;
          this.saved = true;

          setTimeout(() => {
            this.saved = false;
          }, 2200);
        },
        error: error => {
          console.error('Unable to save profile photo:', error);

          this.isSavingPhoto = false;

          /*
           * Keep local preview even if backend save fails.
           * This prevents the UI from losing the uploaded image immediately.
           */
          localStorage.setItem(this.photoStorageKey, photoDataUrl);
          this.notifyPhotoUpdated();
        }
      });
    });

    input.value = '';
  }

  private resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = (): void => {
        reject(new Error('Unable to read selected image.'));
      };

      reader.onload = (): void => {
        const image = new Image();

        image.onerror = (): void => {
          reject(new Error('Unable to load selected image.'));
        };

        image.onload = (): void => {
          let width = image.width;
          let height = image.height;

          if (width > height && width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext('2d');

          if (!context) {
            reject(new Error('Unable to process selected image.'));
            return;
          }

          context.drawImage(image, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', quality));
        };

        image.src = String(reader.result || '');
      };

      reader.readAsDataURL(file);
    });
  }

  private notifyPhotoUpdated(): void {
    window.dispatchEvent(new CustomEvent('medverse-profile-photo-updated'));
  }
}