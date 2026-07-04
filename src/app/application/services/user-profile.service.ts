import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { profileApi } from '../../shared/constants/api.endpoint';
import { ApiResponse } from '../../shared/models/api-response.model';
import { UserInfo } from '../../shared/models/auth.model';
import { unwrapApiResponse } from '../../shared/utils/api-response.util';
import { LoginService } from '../../core/services/login.service';

export interface ProfileUpdatePayload {
  firstName: string;
  lastName?: string;
  mobileNumber?: string;
  displayName?: string;
  profileImageUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UserSummaryDto {
  id: number;
  userCode: string;
  username: string;
  email: string;
  mobileNumber?: string;
  firstName: string;
  lastName?: string;
  displayName?: string;
  profileImageUrl?: string;
  roles?: Array<{ roleName?: string; roleCode?: string; roleType?: string }>;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly http = inject(HttpClient);
  private readonly loginService = inject(LoginService);

  loadProfile(): Observable<UserInfo> {
    return this.http.get<ApiResponse<UserSummaryDto>>(profileApi.me).pipe(
      map(r => this.toUserInfo(unwrapApiResponse(r, {} as UserSummaryDto))),
      tap(user => this.loginService.setUser(user))
    );
  }

  updateProfile(payload: ProfileUpdatePayload): Observable<UserInfo> {
    return this.http.put<ApiResponse<UserSummaryDto>>(profileApi.me, payload).pipe(
      map(r => this.toUserInfo(unwrapApiResponse(r, {} as UserSummaryDto))),
      tap(user => this.loginService.setUser(user))
    );
  }

  changePassword(payload: ChangePasswordPayload): Observable<void> {
    return this.http.post<ApiResponse<void>>(profileApi.changePassword, payload).pipe(map(() => undefined));
  }

  private toUserInfo(dto: UserSummaryDto): UserInfo {
    const roles = (dto.roles ?? [])
      .map(r => r.roleType || r.roleCode || r.roleName)
      .filter(Boolean) as string[];
    return {
      id: String(dto.id),
      userCode: dto.userCode,
      userName: dto.username,
      firstName: dto.firstName,
      lastName: dto.lastName ?? '',
      name: dto.displayName ?? `${dto.firstName} ${dto.lastName ?? ''}`.trim(),
      email: dto.email,
      mobile: dto.mobileNumber ?? '',
      roles,
      privileges: [],
      orgId: this.loginService.getUser()?.orgId ?? 0,
      organizationId: this.loginService.getUser()?.organizationId,
      orgCode: this.loginService.getUser()?.orgCode ?? '',
      isActive: true,
      profilePhoto: dto.profileImageUrl
    } as UserInfo & { profilePhoto?: string };
  }
}
