import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../../../../shared-services/src/lib/api-config';

const BASE_URL = apiUrl('/learner');

@Injectable({ providedIn: 'root' })
export class SubmissionService {

  constructor(private http: HttpClient) {}

  // CREATE (multipart)
  submitCase(formData: FormData): Observable<any> {
    return this.http.post(`${BASE_URL}/submissions`, formData, { withCredentials: true });
  }

  // GET ALL
  getMySubmissions(page = 0, size = 10): Observable<any> {
    return this.http.get(`${BASE_URL}/submissions?page=${page}&size=${size}`, { withCredentials: true });
  }

  // GET ONE
  getSubmission(id: string): Observable<any> {
    return this.http.get(`${BASE_URL}/submissions/${id}`, { withCredentials: true });
  }

  // UPDATE
  updateSubmission(id: string, formData: FormData): Observable<any> {
    return this.http.put(`${BASE_URL}/submissions/${id}`, formData, { withCredentials: true });
  }

  // DELETE
  deleteSubmission(id: string): Observable<any> {
    return this.http.delete(`${BASE_URL}/submissions/${id}`, { withCredentials: true });
  }
  
  // PUBLISH APPROVED CASE
  publishSubmission(id: string): Observable<any> {
    return this.http.post(`${BASE_URL}/submissions/${id}/publish`, {}, { withCredentials: true });
  }
}
