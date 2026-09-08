import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
interface UserProfileTerms {
  profile: string;
  content: string;
}

@Component({
  selector: 'app-terms-conditions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms-conditions.component.html',
  styleUrl: './terms-conditions.component.css'
})
export class TermsConditionsComponent {
profiles: string[] = ['Patient', 'Doctor', 'Learner', 'Auth Officer'];

  selectedProfile: string = this.profiles[0];

termsData: UserProfileTerms[] = [
  {
    profile: 'Patient',
    content: `Consent for Data Sharing
Patients must provide explicit and informed consent for any healthcare professional or authorized personnel to access their medical records on this platform. Such consent is revocable at any time, and the platform shall implement technical and administrative controls to prevent further access once consent is withdrawn.

Data Protection
All personal, medical, and identifiable information is protected in accordance with the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the IT Act, 2000. Data is encrypted at rest and in transit, stored securely on certified servers, and access is restricted based on role-based permissions.

Emergency Access
In life-threatening or exigent circumstances, hospitals and emergency responders may be granted limited access to patient information necessary for immediate care. All such access is logged, monitored, and auditable to ensure compliance with legal obligations and ethical standards.

Responsibilities
Patients are obliged to provide accurate, current, and complete information to facilitate safe and effective healthcare delivery. Sharing login credentials, or permitting unauthorized access to the platform, constitutes a breach of these terms.

User Rights
Patients retain the rights to access, rectify, or request the deletion of their personal data. They will be notified promptly in the event of a data breach and may lodge complaints with the designated Data Protection Officer or relevant regulatory authorities.`
  },
  {
    profile: 'Doctor',
    content: `Professional Conduct
Access to patient data is strictly restricted to cases where explicit patient consent has been provided. Doctors must adhere to the Indian Medical Council (Professional Conduct, Etiquette and Ethics) Regulations, 2002, and any violation of these guidelines may result in disciplinary action including suspension or revocation of platform privileges.

Data Handling
Doctors shall ensure all patient data accessed or downloaded is stored securely, encrypted if necessary, and not disclosed to unauthorized parties. Electronic communication of patient information must comply with best practices for data security and privacy.

Case Contributions
When submitting anonymized case studies to the learner platform, doctors must ensure no identifiable patient information is present. Cases will undergo review by Authentication Officers prior to publication to prevent accidental disclosure of sensitive data.

Audit & Compliance
All access and modification actions are logged, monitored, and auditable. Failure to comply with platform policies, ethical standards, or applicable laws may result in administrative, civil, or criminal liability.`
  },
  {
    profile: 'Learner',
    content: `Data Anonymity
Learners are permitted to access only de-identified patient data in the centralized library. Sharing, reproducing, or attempting to re-identify patients from any dataset is strictly prohibited and may result in termination of platform access and potential legal action.

Content Submission
All submissions must comply with ethical, academic, and professional standards. Submitted cases are subject to review and approval by Authentication Officers before they can be published.

Usage Restrictions
Learners shall use their accounts solely for educational and professional development purposes. Unauthorized attempts to access patient records, modify platform data, or exploit platform resources are prohibited.

Intellectual Property
Ownership of submitted cases remains with the contributor. The platform is granted a non-exclusive, royalty-free license to distribute anonymized content for educational purposes. Misrepresentation, plagiarism, or unlawful dissemination of content is prohibited.

Compliance
Learners must comply with the Information Technology Act, 2000, and any applicable state or central healthcare data regulations, including but not limited to patient confidentiality and privacy obligations.`
  },
  {
    profile: 'Auth Officer',
    content: `Responsibilities
Authentication Officers are entrusted with verifying the authenticity, accuracy, and ethical compliance of submitted cases. They approve or reject cases based on adherence to professional, legal, and ethical standards, and also review user registrations, including patients, doctors, and learners.

Data Protection
All user information and case data handled by Authentication Officers must be treated as strictly confidential. Officers are required to implement technical and administrative measures to ensure compliance with the Information Technology Act, 2000, the IT (SPDI) Rules, 2011, and healthcare data privacy guidelines.

Audit & Compliance
All officer actions, including approvals, rejections, and edits, are logged and auditable. Auditing and monitoring mechanisms are in place to prevent conflicts of interest, abuse of privileges, or unauthorized manipulation of data.

Conflict of Interest
Officers must abstain from participating in approvals where personal, professional, or financial conflicts exist. Unauthorized approval, denial, or manipulation of submissions constitutes a violation of platform policies and may trigger disciplinary and legal action.

Legal Obligations
Authentication Officers must remain compliant with applicable Indian laws regarding data privacy, healthcare regulations, and IT security, ensuring platform accountability and trustworthiness.`
  }
];

  getTermsList(): { text: string, isHeader: boolean }[] {
  const content = this.termsData.find(t => t.profile === this.selectedProfile)?.content || '';
  
  // Split into lines by newline
  const lines = content.split('\n').map(l => l.trim()).filter(l => l !== '');

  return lines.map(line => {
    // Treat line as header if it does NOT end with a period
    const isHeader = !line.endsWith('.');
    return { text: line, isHeader };
  });
}


  changeProfile(profile: string) {
    this.selectedProfile = profile;
  }
}