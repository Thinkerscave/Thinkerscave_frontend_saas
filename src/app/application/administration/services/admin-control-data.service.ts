import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { AdminControlCenter, AdminOrganizationCreatePayload, AdminSystemEvent, AdminUserCreatePayload, SubscriptionPlanDTO } from '../models/admin-control.model';

@Injectable({ providedIn: 'root' })
export class AdminControlDataService {
  private readonly adminUrl = `${environment.baseUrl}/admin-control`;
  private readonly onboardingUrl = `${environment.baseUrl}/tenant-onboarding`;
  private readonly usersUrl = `${environment.baseUrl}/users`;
  private readonly subscriptionPlansUrl = `${environment.baseUrl}/subscription-plans`;

  constructor(
    private http: HttpClient
  ) { }

  loadWorkspace(): Observable<AdminControlCenter> {
    return this.http.get<any>(`${this.adminUrl}/workspace`)
      .pipe(map(response => unwrapApiResponse<AdminControlCenter>(response, {} as AdminControlCenter)));
  }

  runDiagnostics(): Observable<AdminSystemEvent> {
    return this.http.post<any>(`${this.adminUrl}/diagnostics`, {})
      .pipe(map(response => unwrapApiResponse<AdminSystemEvent>(response, {} as AdminSystemEvent)));
  }

  createOrganization(payload: AdminOrganizationCreatePayload): Observable<any> {
    return this.http.post<any>(`${this.onboardingUrl}/provision`, payload)
      .pipe(map(response => unwrapApiResponse(response, response)));
  }

  createAdminUser(payload: AdminUserCreatePayload): Observable<any> {
    return this.http.post<any>(`${this.usersUrl}/register`, payload)
      .pipe(map(response => unwrapApiResponse(response, response)));
  }

  listSubscriptionPlans(): Observable<SubscriptionPlanDTO[]> {
    return this.http.get<any>(this.subscriptionPlansUrl)
      .pipe(map(response => unwrapApiResponse<SubscriptionPlanDTO[]>(response, [] as SubscriptionPlanDTO[])));
  }

  createSubscriptionPlan(plan: SubscriptionPlanDTO): Observable<SubscriptionPlanDTO> {
    return this.http.post<any>(this.subscriptionPlansUrl, plan)
      .pipe(map(response => unwrapApiResponse<SubscriptionPlanDTO>(response, plan)));
  }

  updateSubscriptionPlan(plan: SubscriptionPlanDTO): Observable<SubscriptionPlanDTO> {
    return this.http.put<any>(`${this.subscriptionPlansUrl}/${plan.planId}`, plan)
      .pipe(map(response => unwrapApiResponse<SubscriptionPlanDTO>(response, plan)));
  }

  deleteSubscriptionPlan(planId: number): Observable<void> {
    return this.http.delete<any>(`${this.subscriptionPlansUrl}/${planId}`)
      .pipe(map(() => undefined));
  }
}