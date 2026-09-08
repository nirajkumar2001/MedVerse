import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-dashboard-cases',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-cases.component.html',
  styleUrl: './dashboard-cases.component.css'
})
export class DashboardCasesComponent implements OnInit {
  continueCases: any[] = [];
  featuredCases: any[] = [];

  currentIndex = 0; // ✅ slider index

  ngOnInit(): void {

    // ✅ LEFT: Continue Working (STATIC)
    const continueData = [
      {
        title: 'Atrial Fibrillation Case',
        department: 'Cardiology',
        disease:'Atrial Fibrillation',
        lastEdited: 'Mar 2026',
      },
      {
        title: 'Severe Pneumonia Case',
        department: 'Pulmonology',
        disease:'Pneumonia',
        lastEdited: 'May 2026',
      },
      
{
        title: 'Autoimmune Hepatitis – A Diagnostic Dilemma',
        department: 'Gastroenterology',
        disease:'Hepatitis - A',
        lastEdited: 'Feb 2026',
      },

      {
        title: 'Atrial Fibrillation Case',
        department: 'Cardiology',
        disease:'Atrial Fibrillation',
        lastEdited: 'Mar 2026',
      }
    ];

    // ✅ APPLY IMAGE LOGIC
    this.continueCases = continueData.map(item => ({
      ...item,
      image: this.getImage(item)
    }));


    // ✅ RIGHT: Featured (STATIC simulating DB)
    const featuredData = [
      {
        title: 'Rare Splenic Infarction Mimicking Acute Abdomen',
        department: 'Gastroenterology',
        doctor: 'Dr. Neha Kapoor',
        views: '3.2K',
        comments: 22,
        likes: 134
      },
      {
        title: 'Brain Tumor Advanced Diagnosis Case',
        department: 'Neurology',
        doctor: 'Dr. Arjun Mehta',
        views: '2.5K',
        comments: 30,
        likes: 120
      },
      {
        title: 'Heart Failure Emergency Case',
        department: 'Cardiology',
        doctor: 'Dr. Rohan Singh',
        views: '4.1K',
        comments: 40,
        likes: 200
      }
    ];

    // ✅ APPLY SAME IMAGE LOGIC HERE ✅
    this.featuredCases = featuredData.map(item => ({
      ...item,
      image: this.getImage(item)
    }));

    // ✅ AUTO SCROLL SLIDER
    setInterval(() => {
      this.nextSlide();
    }, 3000);
  }


  // ✅ MASTER IMAGE FUNCTION (USED EVERYWHERE)
  getImage(caseData: any): string {

    const deptImage = this.getImageByDepartment(caseData.department);

    if (deptImage) return deptImage;

    return this.getImageByKeyword(caseData.title);
  }


  // ✅ Department Mapping
  getImageByDepartment(dept: string): string | null {

    if (!dept) return null;

    const map: any = {
      cardiology: 'cardiology.jpg',
      pulmonology: 'pulmonology.jpg',
      gastroenterology: 'gastroenterology.png',
      neurology: 'neurology.jpeg',
      // surgery: 'surgery.png'
    };

    const key = dept.toLowerCase();

    return map[key]
      ? 'assets/case-images/' + map[key]
      : null;
  }


  // ✅ Keyword fallback
  getImageByKeyword(text: string): string {

    if (!text) return 'assets/medicalImg/default.png';

    const value = text.toLowerCase();

    if (value.includes('heart') || value.includes('cardio')) {
      return 'assets/medicalImg/cardiology.png';
    }

    if (value.includes('lung') || value.includes('pneumonia')) {
      return 'assets/medicalImg/pulmonology.png';
    }

    if (value.includes('brain') || value.includes('tumor')) {
      return 'assets/medicalImg/neurology.png';
    }

    if (value.includes('liver') || value.includes('hepatitis')) {
      return 'assets/medicalImg/gastroenterology.png';
    }

    if (value.includes('surgery') || value.includes('splenic') || value.includes('acute')) {
      return 'assets/medicalImg/surgery.png';
    }

    return 'assets/medicalImg/default.png';
  }


  // ✅ NEXT SLIDE
  nextSlide() {
    this.currentIndex =
      (this.currentIndex + 1) % this.featuredCases.length;
  }

}
