import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CaseImageService {
  private readonly basePath = 'assets/case-images';

  private readonly departmentImageMap: Record<string, string> = {
    cardiology: 'cardiology.png',
    pulmonology: 'pulmonology.png',
    neurology: 'neurology.png',
    gastroenterology: 'gastroenterology.png',
    dermatology: 'dermatology.png',
    pediatrics: 'pediatrics.png',
    orthopedics: 'orthopedics.png',
    oncology: 'oncology.png',
    general: 'general-medicine.png',
    endocrinology: 'endocrinology.png',
    nephrology: 'nephrology.png',
    gynecology: 'gynecology.png',
    psychiatry: 'psychiatry.png',
    ent: 'ent.png',
    ophthalmology: 'ophthalmology.png'
  };

  private readonly keywordImageMap: Record<string, string> = {
    pneumonia: 'pneumonia.png',
    asthma: 'asthma.png',
    copd: 'copd.png',
    tuberculosis: 'tuberculosis.png',

    stroke: 'stroke.png',
    seizure: 'seizure.png',
    epilepsy: 'seizure.png',
    migraine: 'neurology.png',

    ecg: 'ecg.png',
    arrhythmia: 'ecg.png',
    fibrillation: 'ecg.png',
    cardiac: 'cardiology.png',
    hypertension: 'hypertension.png',
    heart: 'cardiology.png',

    hepatitis: 'hepatitis.png',
    liver: 'hepatitis.png',
    gastritis: 'gastroenterology.png',

    diabetes: 'diabetes.png',
    thyroid: 'endocrinology.png',

    fracture: 'fracture.png',
    meniscal: 'orthopedics.png',
    knee: 'orthopedics.png',

    pregnancy: 'pregnancy.png',
    ectopic: 'pregnancy.png',

    rash: 'dermatology.png',
    stevens: 'dermatology.png',
    johnson: 'dermatology.png',

    cancer: 'oncology.png',
    tumor: 'oncology.png',

    xray: 'xray-chest.png',
    'x-ray': 'xray-chest.png',
    ct: 'brain-ct.png',
    // mri: 'brain-ct.png',
    ultrasound: 'ultrasound.png'
  };

  getCaseImage(
    department?: string,
    title?: string,
    keywords: string[] = [],
    customImage?: string
  ): string {
    if (customImage) {
      return customImage;
    }

    const searchableText = [
      department || '',
      title || '',
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

    return `${this.basePath}/default-case.png`;
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