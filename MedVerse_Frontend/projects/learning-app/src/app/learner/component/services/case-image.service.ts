import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CaseImageService {
  private readonly basePath = 'assets/case-images';

  private readonly departmentImageMap: Record<string, string> = {
    cardiology: 'cardiology.jpg',
    pulmonology: 'pulmonology.jpg',
    neurology: 'neurology.jpeg',
    gastroenterology: 'gastroenterology.png',
    dermatology: 'dermatology.jpg',
    // pediatrics: 'pediatrics.png',
    orthopedics: 'orthopedics.png',
    // radiology: 'radiology.png',
    // oncology: 'oncology.png',
    // emergency: 'emergency.png',
    // endocrinology: 'endocrinology.png',
    // nephrology: 'nephrology.png',
    // gynecology: 'gynecology.png',
    // obstetrics: 'gynecology.png',
    // psychiatry: 'psychiatry.png',
    // ent: 'ent.png',
    // ophthalmology: 'ophthalmology.png'
  };

  private readonly keywordImageMap: Record<string, string> = {
    pneumonia: 'pneumonia.jpeg',
    asthma: 'asthma.png',
    copd: 'copd.png',
    tuberculosis: 'tuberculosis.png',

    stroke: 'stroke.jpeg',
    // seizure: 'seizure.png',
    // epilepsy: 'seizure.png',
    // migraine: 'neurology.png',

    ecg: 'ecg.jpg',
    arrhythmia: 'ecg.jpg',
    fibrillation: 'ecg.jpg',
    // cardiac: 'cardiology.jpg',
    // hypertension: 'hypertension.png',
    // heart: 'cardiology.png',

    hepatitis: 'hepatitis.jpg',
    liver: 'hepatitis.png',
    gastritis: 'gastroenterology.png',

    // diabetes: 'diabetes.png',
    // thyroid: 'endocrinology.png',

    // fracture: 'fracture.png',
    // meniscal: 'orthopedics.png',
    // knee: 'orthopedics.png',

    pregnancy: 'pregnancy1.jpg',
    ectopic: 'pregnancy.jpg',

    rash: 'rash.jpg',
    johnson: 'rash.jpg',

    // cancer: 'oncology.png',
    // tumor: 'oncology.png',

    xray: 'xray.jpg',
    // 'x-ray': 'xray-chest.png',
    ct: 'brain-ct.jpg',
    // mri: 'brain-ct.jpg',
    ultrasound: 'ultrasound.jpg'
  };

  getCaseImage(
    department?: string,
  title?: string,
  description?: string,
  keywords: string[] = [],
  customImage?: string
  ): string {
    if (customImage) {
      return customImage;
    }

    const searchableText = [
      department || '',
  title || '',
  description || '',
  ...keywords
    ]
      .join(' ')
      .toLowerCase();

    const keywordImage = this.findKeywordImage(searchableText);

    if (keywordImage) {
      return `${this.basePath}/${keywordImage}`;
    }

    const departmentKey = this.normalize(department || '');

    if (departmentKey && this.departmentImageMap[departmentKey]) {
      return `${this.basePath}/${this.departmentImageMap[departmentKey]}`;
    }

    // chage needed
    
    return `${this.basePath}/default.jpg`;
  }

  private findKeywordImage(text: string): string | null {
    for (const keyword of Object.keys(this.keywordImageMap)) {
      if (text.includes(keyword)) {
        return this.keywordImageMap[keyword];
      }
    }

    return null;
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace('&', 'and')
      .replace(/\s+/g, ' ');
  }
}